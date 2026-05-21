import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GameLoop } from "../server/src/match/GameLoop";
import { EnemySystem } from "../server/src/systems/EnemySystem";
import { EconomySystem } from "../server/src/systems/EconomySystem";
import { PlantCombatSystem } from "../server/src/systems/PlantCombatSystem";
import { PlantSystem } from "../server/src/systems/PlantSystem";
import { ProjectileSystem } from "../server/src/systems/ProjectileSystem";
import {
  CombatNumbersV01,
  MapConfigV01,
  getPlantCellCenter,
  type BaseState,
  type GameStateSnapshot,
  type PlayerState,
  type RoomState,
  type RoomStatePayload
} from "../shared/src";

describe("Phase 6 EnemySystem", () => {
  test("spawns configured enemy types, moves them left by lane, and damages the base on breakthrough", () => {
    const enemies = new EnemySystem(() => 1);
    const plants = new PlantSystem();
    const economy = new EconomySystem();
    const base = createBase();

    const shamblerSpawn = enemies.spawnEnemy({ enemyType: "shambler", laneIndex: 2, serverTimeMs: 0 });
    enemies.spawnEnemy({ enemyType: "runner", laneIndex: 1, serverTimeMs: 0 });
    enemies.spawnEnemy({ enemyType: "brute", laneIndex: 0, serverTimeMs: 0 });

    expect(shamblerSpawn).toMatchObject({
      ok: true,
      feedback: {
        eventType: "enemy.spawned"
      }
    });

    expect(enemies.getSnapshot()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "shambler",
          laneIndex: 2,
          x: MapConfigV01.enemySpawnMarker.centerX,
          y: expect.any(Number),
          hp: CombatNumbersV01.enemies.shambler.maxHp,
          state: "MOVING"
        }),
        expect.objectContaining({
          type: "runner",
          laneIndex: 1,
          hp: CombatNumbersV01.enemies.runner.maxHp
        }),
        expect.objectContaining({
          type: "brute",
          laneIndex: 0,
          hp: CombatNumbersV01.enemies.brute.maxHp
        })
      ])
    );

    enemies.update(1, plants, economy, base, 1000);

    expect(enemies.getSnapshot()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "shambler",
          x: MapConfigV01.enemySpawnMarker.centerX - CombatNumbersV01.enemies.shambler.moveSpeed
        }),
        expect.objectContaining({
          type: "runner",
          x: MapConfigV01.enemySpawnMarker.centerX - CombatNumbersV01.enemies.runner.moveSpeed
        }),
        expect.objectContaining({
          type: "brute",
          x: MapConfigV01.enemySpawnMarker.centerX - CombatNumbersV01.enemies.brute.moveSpeed
        })
      ])
    );

    const weakBase = { hp: 1, maxHp: CombatNumbersV01.base.maxHp };
    const breakthroughEnemies = new EnemySystem(() => 1);
    breakthroughEnemies.spawnEnemy({ enemyType: "shambler", laneIndex: 2, serverTimeMs: 2000 });

    const result = breakthroughEnemies.update(30, plants, economy, weakBase, 3000);

    expect(weakBase.hp).toBe(0);
    expect(result.defeated).toBe(true);
    expect(breakthroughEnemies.getSnapshot()).toEqual([]);
    expect(result.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: "base.damaged",
          data: expect.objectContaining({ damage: CombatNumbersV01.enemies.shambler.baseDamage })
        })
      ])
    );
  });

  test("stops at blocking plants, attacks them, and releases the cell when a plant dies", () => {
    const enemies = new EnemySystem(() => 1);
    const plants = new PlantSystem();
    const economy = new EconomySystem();
    const base = createBase();
    const player = createPlayerNearCell(2, 6);
    const planted = plants.tryPlant({
      requestId: "request_wall",
      request: {
        requestId: "request_wall",
        plantType: "sunbloom",
        laneIndex: 2,
        columnIndex: 6
      },
      matchState: "WAVE_PREP",
      player,
      economy,
      serverTimeMs: 0,
      enemies: []
    });
    expect(planted.ok).toBe(true);
    if (!planted.ok) {
      throw new Error("Expected plant setup to succeed.");
    }

    enemies.spawnEnemy({ enemyType: "shambler", laneIndex: 2, serverTimeMs: 0 });
    enemies.update(1.5, plants, economy, base, 1500);

    expect(enemies.getSnapshot()[0]).toMatchObject({
      state: "ATTACKING_PLANT",
      targetPlantId: planted.plant.id
    });

    const damageResult = enemies.update(4, plants, economy, base, 5500);

    expect(plants.getSnapshot()).toEqual([]);
    expect(damageResult.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: "plant.destroyed",
          entityId: planted.plant.id
        })
      ])
    );

    const replanted = plants.tryPlant({
      requestId: "request_replant",
      request: {
        requestId: "request_replant",
        plantType: "barkwall",
        laneIndex: 2,
        columnIndex: 6
      },
      matchState: "WAVE_PREP",
      player,
      economy,
      serverTimeMs: 6000,
      enemies: []
    });

    expect(replanted.ok).toBe(true);
  });
});

describe("Phase 6 plant combat and pea projectiles", () => {
  test("peashotter fires same-lane pea projectiles that hit enemies server-side and can drop sunlight", () => {
    const economy = new EconomySystem(1000);
    const plants = new PlantSystem();
    const projectiles = new ProjectileSystem();
    const plantCombat = new PlantCombatSystem();
    const enemies = new EnemySystem(() => 0);
    const player = createPlayerNearCell(2, 0);

    const planted = plants.tryPlant({
      requestId: "request_peashotter",
      request: {
        requestId: "request_peashotter",
        plantType: "peashotter",
        laneIndex: 2,
        columnIndex: 0
      },
      matchState: "WAVE_PREP",
      player,
      economy,
      serverTimeMs: 0,
      enemies: []
    });
    expect(planted.ok).toBe(true);

    enemies.spawnEnemy({ enemyType: "runner", laneIndex: 2, serverTimeMs: 0 });
    const sunAfterPlant = economy.getSnapshot().sharedSun;

    plantCombat.update(0.05, plants, enemies, projectiles, 50);
    expect(projectiles.getSnapshot()).toEqual([
      expect.objectContaining({
        type: "pea_projectile",
        ownerPlantId: expect.any(String),
        dirX: 1,
        dirY: 0
      })
    ]);

    for (let i = 0; i < 160; i += 1) {
      plantCombat.update(0.05, plants, enemies, projectiles, 100 + i * 50);
      projectiles.update(0.05, enemies, economy, 100 + i * 50);
    }

    expect(enemies.getSnapshot()).toEqual([]);
    expect(projectiles.getSnapshot()).toEqual([]);
    expect(economy.getSnapshot().sharedSun).toBe(sunAfterPlant + CombatNumbersV01.economy.sunDropAmount);
  });
});

describe("Phase 6 GameLoop integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(400_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("dev debug command spawns enemies into snapshots and baseHp <= 0 enters DEFEAT", () => {
    const phases: string[] = [];
    const harness = runLoopWithRoom(phases);

    harness.loop.start();
    vi.advanceTimersByTime(CombatNumbersV01.match.countdownSeconds * 1000);

    expect(harness.loop.applyDebugCommand({ command: "spawnEnemy", enemyType: "brute", laneIndex: 0 }).ok).toBe(true);
    expect(harness.loop.applyDebugCommand({ command: "spawnEnemy", enemyType: "brute", laneIndex: 1 }).ok).toBe(true);
    expect(harness.loop.applyDebugCommand({ command: "spawnEnemy", enemyType: "brute", laneIndex: 2 }).ok).toBe(true);
    expect(harness.loop.applyDebugCommand({ command: "spawnEnemy", enemyType: "brute", laneIndex: 3 }).ok).toBe(true);
    expect(harness.loop.applyDebugCommand({ command: "spawnEnemy", enemyType: "brute", laneIndex: 4 }).ok).toBe(true);

    expect(harness.loop.getCurrentSnapshot()).toMatchObject({
      enemies: [
        expect.objectContaining({ type: "brute" }),
        expect.objectContaining({ type: "brute" }),
        expect.objectContaining({ type: "brute" }),
        expect.objectContaining({ type: "brute" }),
        expect.objectContaining({ type: "brute" })
      ],
      bullets: [],
      base: {
        hp: CombatNumbersV01.base.maxHp,
        maxHp: CombatNumbersV01.base.maxHp
      }
    });

    vi.advanceTimersByTime(35_000);

    const snapshot = harness.loop.getCurrentSnapshot();
    expect(snapshot.matchState).toBe("DEFEAT");
    expect(snapshot.base.hp).toBe(0);
    expect(phases).toContain("DEFEAT");
  });
});

function createBase(): BaseState {
  return {
    hp: CombatNumbersV01.base.maxHp,
    maxHp: CombatNumbersV01.base.maxHp
  };
}

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

function runLoopWithRoom(phases: string[]): {
  loop: GameLoop;
  latest: () => GameStateSnapshot;
} {
  const snapshots: GameStateSnapshot[] = [];
  let roomState: RoomState = "COUNTDOWN";
  const roomPayload = (): RoomStatePayload => ({
    matchId: "match_phase_6",
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
    matchId: "match_phase_6",
    getRoomState: roomPayload,
    onPhaseChanged: (event) => {
      phases.push(event.nextState);
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
