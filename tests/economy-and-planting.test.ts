import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GameLoop } from "../server/src/match/GameLoop";
import { EconomySystem } from "../server/src/systems/EconomySystem";
import { PlantSystem } from "../server/src/systems/PlantSystem";
import {
  CombatNumbersV01,
  getPlantCellCenter,
  type GameStateSnapshot,
  type PlayerState,
  type RoomState,
  type RoomStatePayload
} from "../shared/src";

describe("Phase 5 EconomySystem", () => {
  test("initializes shared sun from combat config and never spends below zero", () => {
    const economy = new EconomySystem();

    expect(economy.getSnapshot()).toMatchObject({
      sharedSun: CombatNumbersV01.economy.initialSharedSun,
      totalSunEarned: 0,
      totalSunSpent: 0,
      sunSuppressed: false
    });

    expect(economy.spend(CombatNumbersV01.economy.initialSharedSun + 1)).toBe(false);
    expect(economy.getSnapshot().sharedSun).toBe(CombatNumbersV01.economy.initialSharedSun);

    expect(economy.spend(50)).toBe(true);
    expect(economy.getSnapshot()).toMatchObject({
      sharedSun: CombatNumbersV01.economy.initialSharedSun - 50,
      totalSunSpent: 50
    });

    economy.gain(25);
    expect(economy.getSnapshot()).toMatchObject({
      sharedSun: CombatNumbersV01.economy.initialSharedSun - 25,
      totalSunEarned: 25
    });
  });
});

describe("Phase 5 PlantSystem", () => {
  test("plants a valid unit, deducts shared sun, occupies the cell, and updates player stats", () => {
    const economy = new EconomySystem();
    const plants = new PlantSystem();
    const player = createPlayerNearCell(2, 0);

    const result = plants.tryPlant({
      requestId: "request_plant_1",
      request: {
        requestId: "request_plant_1",
        plantType: "sunbloom",
        laneIndex: 2,
        columnIndex: 0
      },
      matchState: "WAVE_PREP",
      player,
      economy,
      serverTimeMs: 10_000,
      enemies: []
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected plant action to be accepted.");
    }

    expect(result.accepted).toMatchObject({
      requestId: "request_plant_1",
      action: "plant",
      affectedEntityIds: [result.plant.id]
    });
    expect(result.feedback).toMatchObject({
      eventType: "plant.placed",
      entityId: result.plant.id,
      playerId: player.playerId
    });
    expect(result.plant).toMatchObject({
      type: "sunbloom",
      laneIndex: 2,
      columnIndex: 0,
      hp: CombatNumbersV01.plants.sunbloom.maxHp,
      maxHp: CombatNumbersV01.plants.sunbloom.maxHp,
      alive: true,
      cooldownRemainingSeconds: CombatNumbersV01.plants.sunbloom.firstProduceDelaySeconds
    });
    expect(plants.getSnapshot()).toHaveLength(1);
    expect(economy.getSnapshot().sharedSun).toBe(
      CombatNumbersV01.economy.initialSharedSun - CombatNumbersV01.plants.sunbloom.sunCost
    );
    expect(player.stats.plantsPlaced).toBe(1);
    expect(player.stats.sunSpent).toBe(CombatNumbersV01.plants.sunbloom.sunCost);
  });

  test("rejects invalid planting requests with exact reasons", () => {
    const economy = new EconomySystem();
    const plants = new PlantSystem();
    const player = createPlayerNearCell(1, 1);

    expect(
      plants.tryPlant({
        requestId: "request_bad_state",
        request: { requestId: "request_bad_state", plantType: "sunbloom", laneIndex: 1, columnIndex: 1 },
        matchState: "COUNTDOWN",
        player,
        economy,
        serverTimeMs: 1,
        enemies: []
      })
    ).toMatchObject({ ok: false, rejected: { reason: "NOT_IN_VALID_MATCH_STATE" } });

    expect(
      plants.tryPlant({
        requestId: "request_dead",
        request: { requestId: "request_dead", plantType: "sunbloom", laneIndex: 1, columnIndex: 1 },
        matchState: "WAVE_PREP",
        player: { ...player, alive: false },
        economy,
        serverTimeMs: 2,
        enemies: []
      })
    ).toMatchObject({ ok: false, rejected: { reason: "PLAYER_DEAD" } });

    expect(
      plants.tryPlant({
        requestId: "request_invalid_cell",
        request: { requestId: "request_invalid_cell", plantType: "sunbloom", laneIndex: 6 as never, columnIndex: 1 },
        matchState: "WAVE_PREP",
        player,
        economy,
        serverTimeMs: 3,
        enemies: []
      })
    ).toMatchObject({ ok: false, rejected: { reason: "CELL_NOT_PLANTABLE" } });

    const accepted = plants.tryPlant({
      requestId: "request_first",
      request: { requestId: "request_first", plantType: "sunbloom", laneIndex: 1, columnIndex: 1 },
      matchState: "WAVE_PREP",
      player,
      economy,
      serverTimeMs: 4,
      enemies: []
    });
    expect(accepted.ok).toBe(true);

    expect(
      plants.tryPlant({
        requestId: "request_same_cell",
        request: { requestId: "request_same_cell", plantType: "barkwall", laneIndex: 1, columnIndex: 1 },
        matchState: "WAVE_PREP",
        player,
        economy,
        serverTimeMs: 5,
        enemies: []
      })
    ).toMatchObject({ ok: false, rejected: { reason: "CELL_OCCUPIED" } });

    expect(
      plants.tryPlant({
        requestId: "request_far",
        request: { requestId: "request_far", plantType: "sunbloom", laneIndex: 4, columnIndex: 6 },
        matchState: "WAVE_PREP",
        player,
        economy,
        serverTimeMs: 6,
        enemies: []
      })
    ).toMatchObject({ ok: false, rejected: { reason: "OUT_OF_RANGE" } });

    expect(
      plants.tryPlant({
        requestId: "request_enemy",
        request: { requestId: "request_enemy", plantType: "sunbloom", laneIndex: 1, columnIndex: 2 },
        matchState: "WAVE_PREP",
        player: createPlayerNearCell(1, 2),
        economy,
        serverTimeMs: 7,
        enemies: [
          {
            id: "enemy_1",
            type: "shambler",
            laneIndex: 1,
            x: getPlantCellCenter({ laneIndex: 1, columnIndex: 2 }).x,
            y: getPlantCellCenter({ laneIndex: 1, columnIndex: 2 }).y,
            hp: 100,
            maxHp: 100,
            state: "MOVING"
          }
        ]
      })
    ).toMatchObject({ ok: false, rejected: { reason: "ENEMY_BLOCKING_CELL" } });
  });

  test("rejects when shared sun is insufficient and leaves the economy unchanged", () => {
    const economy = new EconomySystem(0);
    const plants = new PlantSystem();
    const player = createPlayerNearCell(0, 0);

    const result = plants.tryPlant({
      requestId: "request_no_sun",
      request: {
        requestId: "request_no_sun",
        plantType: "peashotter",
        laneIndex: 0,
        columnIndex: 0
      },
      matchState: "WAVE_PREP",
      player,
      economy,
      serverTimeMs: 100,
      enemies: []
    });

    expect(result).toMatchObject({ ok: false, rejected: { reason: "NOT_ENOUGH_SUN" } });
    expect(economy.getSnapshot().sharedSun).toBe(0);
    expect(plants.getSnapshot()).toEqual([]);
  });

  test("sunbloom produces after first delay and then on its periodic interval", () => {
    const economy = new EconomySystem();
    const plants = new PlantSystem();
    const player = createPlayerNearCell(0, 0);

    const planted = plants.tryPlant({
      requestId: "request_sunbloom",
      request: {
        requestId: "request_sunbloom",
        plantType: "sunbloom",
        laneIndex: 0,
        columnIndex: 0
      },
      matchState: "WAVE_PREP",
      player,
      economy,
      serverTimeMs: 0,
      enemies: []
    });
    expect(planted.ok).toBe(true);

    const afterPlantSun = economy.getSnapshot().sharedSun;
    plants.update(CombatNumbersV01.plants.sunbloom.firstProduceDelaySeconds - 0.1, economy, 5900);
    expect(economy.getSnapshot().sharedSun).toBe(afterPlantSun);

    const firstEvents = plants.update(0.1, economy, 6000);
    expect(economy.getSnapshot().sharedSun).toBe(afterPlantSun + CombatNumbersV01.plants.sunbloom.produceAmount);
    expect(firstEvents).toHaveLength(1);
    expect(firstEvents[0]).toMatchObject({ eventType: "sun.gained" });
    expect(plants.getSnapshot()[0]?.cooldownRemainingSeconds).toBe(
      CombatNumbersV01.plants.sunbloom.produceIntervalSeconds
    );

    plants.update(CombatNumbersV01.plants.sunbloom.produceIntervalSeconds, economy, 14_000);
    expect(economy.getSnapshot().sharedSun).toBe(afterPlantSun + CombatNumbersV01.plants.sunbloom.produceAmount * 2);
  });
});

describe("Phase 5 GameLoop planting integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(300_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("applies authoritative plant actions and includes economy and plants in snapshots", () => {
    const harness = runLoopWithRoom();
    harness.loop.start();
    vi.advanceTimersByTime(CombatNumbersV01.match.countdownSeconds * 1000);

    const cell = { laneIndex: 2 as const, columnIndex: 0 as const };
    const center = getPlantCellCenter(cell);
    harness.loop.applyPlayerMoveInput("player_0", { dirX: 1, dirY: 0 });
    vi.advanceTimersByTime(700);
    harness.loop.applyPlayerMoveInput("player_0", { dirX: 0, dirY: 0 });

    const plantResult = harness.loop.applyPlantAction("player_0", {
      requestId: "request_loop_plant",
      plantType: "sunbloom",
      laneIndex: cell.laneIndex,
      columnIndex: cell.columnIndex
    });

    expect(plantResult.ok).toBe(true);
    if (!plantResult.ok) {
      throw new Error("Expected GameLoop plant action to be accepted.");
    }
    expect(plantResult.feedback).toMatchObject({
      eventType: "plant.placed",
      x: center.x,
      y: center.y
    });

    const snapshot = harness.loop.getCurrentSnapshot();
    expect(snapshot.economy.sharedSun).toBe(
      CombatNumbersV01.economy.initialSharedSun - CombatNumbersV01.plants.sunbloom.sunCost
    );
    expect(snapshot.plants).toHaveLength(1);
    expect(snapshot.plants[0]).toMatchObject({
      type: "sunbloom",
      laneIndex: cell.laneIndex,
      columnIndex: cell.columnIndex
    });
  });

  test("sunbloom production updates authoritative snapshots over time", () => {
    const harness = runLoopWithRoom();
    harness.loop.start();
    vi.advanceTimersByTime(CombatNumbersV01.match.countdownSeconds * 1000);

    harness.loop.applyPlayerMoveInput("player_0", { dirX: 1, dirY: 0 });
    vi.advanceTimersByTime(700);
    harness.loop.applyPlayerMoveInput("player_0", { dirX: 0, dirY: 0 });
    harness.loop.applyPlantAction("player_0", {
      requestId: "request_loop_sun",
      plantType: "sunbloom",
      laneIndex: 2,
      columnIndex: 0
    });

    const afterPlantSun = harness.loop.getCurrentSnapshot().economy.sharedSun;
    vi.advanceTimersByTime(CombatNumbersV01.plants.sunbloom.firstProduceDelaySeconds * 1000);

    expect(harness.loop.getCurrentSnapshot().economy.sharedSun).toBe(
      afterPlantSun + CombatNumbersV01.plants.sunbloom.produceAmount
    );
  });
});

function createPlayerNearCell(laneIndex: 0 | 1 | 2 | 3 | 4, columnIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6): PlayerState {
  const center = getPlantCellCenter({ laneIndex, columnIndex });

  return {
    playerId: "player_test",
    slot: 0,
    name: "Tester",
    connected: true,
    x: center.x - 20,
    y: center.y,
    aimX: 1,
    aimY: 0,
    hp: CombatNumbersV01.hero.maxHp,
    maxHp: CombatNumbersV01.hero.maxHp,
    alive: true,
    ammoInMagazine: CombatNumbersV01.weapon.pistol.magazineSize,
    magazineSize: CombatNumbersV01.weapon.pistol.magazineSize,
    reserveAmmo: CombatNumbersV01.weapon.pistol.initialReserveAmmo,
    maxReserveAmmo: CombatNumbersV01.weapon.pistol.maxReserveAmmo,
    reloading: false,
    ammoPurchaseCooldownRemainingSeconds: 0,
    hasEvolved: false,
    stats: {}
  };
}

function runLoopWithRoom(): {
  loop: GameLoop;
  latest: () => GameStateSnapshot;
} {
  const snapshots: GameStateSnapshot[] = [];
  let roomState: RoomState = "COUNTDOWN";
  const roomPayload = (): RoomStatePayload => ({
    matchId: "match_phase_5",
    roomState,
    players: [
      {
        playerId: "player_0",
        slot: 0,
        name: "Player A",
        connected: true,
        ready: true
      },
      {
        playerId: "player_1",
        slot: 1,
        name: "Player B",
        connected: true,
        ready: true
      }
    ]
  });
  const loop = new GameLoop({
    matchId: "match_phase_5",
    getRoomState: roomPayload,
    onPhaseChanged: (event) => {
      roomState = event.nextState === "COUNTDOWN" ? "COUNTDOWN" : "IN_MATCH";
    },
    onSnapshot: (snapshot) => snapshots.push(snapshot)
  });

  return {
    loop,
    latest: () => {
      const latest = snapshots.at(-1);
      if (!latest) {
        throw new Error("No snapshot captured.");
      }
      return latest;
    }
  };
}
