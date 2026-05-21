import { afterEach, describe, expect, test, vi } from "vitest";
import { GameLoop } from "../server/src/match/GameLoop";
import { EconomySystem } from "../server/src/systems/EconomySystem";
import { EnemySystem } from "../server/src/systems/EnemySystem";
import { EvolutionSystem } from "../server/src/systems/EvolutionSystem";
import { PlantSystem } from "../server/src/systems/PlantSystem";
import { ProjectileSystem } from "../server/src/systems/ProjectileSystem";
import { WeaponSystem } from "../server/src/systems/WeaponSystem";
import {
  CombatNumbersV01,
  MapConfigV01,
  getLaneCenterY,
  type EvolveRequestPayload,
  type GameStateSnapshot,
  type PlayerState,
  type RoomState,
  type RoomStatePayload
} from "../shared/src";

type EvolutionTestPlayer = PlayerState & {
  nextAllowedShotTimeMs?: number;
};

describe("Phase 9 EvolutionSystem validation", () => {
  test("rejects locked, invalid, unaffordable, repeated, dead, and state-invalid evolve requests", () => {
    const evolutions = new EvolutionSystem();

    expect(
      evolutions.tryEvolve({
        requestId: "request_locked",
        matchState: "WAVE_CLEAR",
        evolutionUnlocked: false,
        player: createEvolutionPlayer(),
        path: "firepower",
        economy: new EconomySystem(999),
        serverTimeMs: 1_000
      })
    ).toMatchObject({
      ok: false,
      rejected: {
        requestId: "request_locked",
        action: "evolve",
        reason: "EVOLUTION_NOT_UNLOCKED"
      }
    });

    expect(
      evolutions.tryEvolve({
        requestId: "request_invalid_path",
        matchState: "WAVE_CLEAR",
        evolutionUnlocked: true,
        player: createEvolutionPlayer(),
        path: "not_a_path",
        economy: new EconomySystem(999),
        serverTimeMs: 1_100
      })
    ).toMatchObject({
      ok: false,
      rejected: {
        reason: "INVALID_EVOLUTION_PATH"
      }
    });

    expect(
      evolutions.tryEvolve({
        requestId: "request_no_sun",
        matchState: "WAVE_CLEAR",
        evolutionUnlocked: true,
        player: createEvolutionPlayer(),
        path: "control",
        economy: new EconomySystem(CombatNumbersV01.evolution.sunCost - 1),
        serverTimeMs: 1_200
      })
    ).toMatchObject({
      ok: false,
      rejected: {
        reason: "NOT_ENOUGH_SUN"
      }
    });

    expect(
      evolutions.tryEvolve({
        requestId: "request_repeated",
        matchState: "WAVE_CLEAR",
        evolutionUnlocked: true,
        player: createEvolutionPlayer({ hasEvolved: true, evolutionPath: "support" }),
        path: "firepower",
        economy: new EconomySystem(999),
        serverTimeMs: 1_300
      })
    ).toMatchObject({
      ok: false,
      rejected: {
        reason: "ALREADY_EVOLVED"
      }
    });

    expect(
      evolutions.tryEvolve({
        requestId: "request_dead",
        matchState: "WAVE_CLEAR",
        evolutionUnlocked: true,
        player: createEvolutionPlayer({ alive: false, hp: 0 }),
        path: "support",
        economy: new EconomySystem(999),
        serverTimeMs: 1_400
      })
    ).toMatchObject({
      ok: false,
      rejected: {
        reason: "PLAYER_DEAD"
      }
    });

    expect(
      evolutions.tryEvolve({
        requestId: "request_countdown",
        matchState: "COUNTDOWN",
        evolutionUnlocked: true,
        player: createEvolutionPlayer(),
        path: "firepower",
        economy: new EconomySystem(999),
        serverTimeMs: 1_500
      })
    ).toMatchObject({
      ok: false,
      rejected: {
        reason: "NOT_IN_VALID_MATCH_STATE"
      }
    });
  });

  test("firepower evolution spends shared sun, updates player state, and does not refill ammo", () => {
    const evolutions = new EvolutionSystem();
    const economy = new EconomySystem(250);
    const player = createEvolutionPlayer({
      ammoInMagazine: 3,
      reserveAmmo: 5
    });

    const result = evolutions.tryEvolve({
      requestId: "request_firepower",
      matchState: "WAVE_CLEAR",
      evolutionUnlocked: true,
      player,
      path: "firepower",
      economy,
      serverTimeMs: 2_000
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected firepower evolution to succeed.");
    }
    expect(result.accepted).toMatchObject({
      requestId: "request_firepower",
      action: "evolve"
    });
    expect(result.feedback).toMatchObject({
      eventType: "hero.evolved",
      playerId: player.playerId,
      data: expect.objectContaining({
        path: "firepower",
        sunCost: CombatNumbersV01.evolution.sunCost
      })
    });
    expect(economy.getSnapshot()).toMatchObject({
      sharedSun: 50,
      totalSunSpent: CombatNumbersV01.evolution.sunCost
    });
    expect(player).toMatchObject({
      hasEvolved: true,
      evolutionPath: "firepower",
      magazineSize: CombatNumbersV01.evolution.firepower.magazineSize,
      maxReserveAmmo: CombatNumbersV01.evolution.firepower.maxReserveAmmo,
      ammoInMagazine: 3,
      reserveAmmo: 5,
      stats: expect.objectContaining({
        sunSpent: CombatNumbersV01.evolution.sunCost
      })
    });
  });

  test("firepower hero bullets deal evolved pistol damage server-side", () => {
    const weapons = new WeaponSystem();
    const projectiles = new ProjectileSystem();
    const enemies = new EnemySystem(() => 1);
    const economy = new EconomySystem();
    const laneIndex = 2;
    const player = createEvolutionPlayer({
      x: 840,
      y: getLaneCenterY(laneIndex),
      hasEvolved: true,
      evolutionPath: "firepower",
      magazineSize: CombatNumbersV01.evolution.firepower.magazineSize,
      maxReserveAmmo: CombatNumbersV01.evolution.firepower.maxReserveAmmo
    });

    enemies.spawnEnemy({ enemyType: "runner", laneIndex, serverTimeMs: 0 });
    const shot = weapons.tryShoot({
      requestId: "request_firepower_shot",
      matchState: "WAVE_ACTIVE",
      player,
      aimWorldX: MapConfigV01.enemySpawnMarker.centerX,
      aimWorldY: player.y,
      projectiles,
      serverTimeMs: 3_000
    });
    expect(shot.ok).toBe(true);

    projectiles.update(0.1, enemies, economy, 3_100, new Map([[player.playerId, player]]));

    expect(enemies.getSnapshot()).toEqual([
      expect.objectContaining({
        type: "runner",
        hp: CombatNumbersV01.enemies.runner.maxHp - CombatNumbersV01.evolution.firepower.pistolDamage
      })
    ]);
    expect(player.stats.damageDealt).toBe(CombatNumbersV01.evolution.firepower.pistolDamage);
  });

  test("control hero bullets slow runners more strongly and movement uses the slow", () => {
    const weapons = new WeaponSystem();
    const projectiles = new ProjectileSystem();
    const enemies = new EnemySystem(() => 1);
    const economy = new EconomySystem();
    const plants = new PlantSystem();
    const laneIndex = 2;
    const base = {
      hp: CombatNumbersV01.base.maxHp,
      maxHp: CombatNumbersV01.base.maxHp
    };
    const player = createEvolutionPlayer({
      x: 840,
      y: getLaneCenterY(laneIndex),
      hasEvolved: true,
      evolutionPath: "control"
    });

    enemies.spawnEnemy({ enemyType: "runner", laneIndex, serverTimeMs: 0 });
    const shot = weapons.tryShoot({
      requestId: "request_control_shot",
      matchState: "WAVE_ACTIVE",
      player,
      aimWorldX: MapConfigV01.enemySpawnMarker.centerX,
      aimWorldY: player.y,
      projectiles,
      serverTimeMs: 4_000
    });
    expect(shot.ok).toBe(true);

    projectiles.update(0.1, enemies, economy, 4_100, new Map([[player.playerId, player]]));
    const slowed = enemies.getSnapshot()[0];
    expect(slowed).toMatchObject({
      slowed: true,
      slowRemainingSeconds: CombatNumbersV01.evolution.control.slowDurationSeconds
    });
    if (!slowed) {
      throw new Error("Expected slowed runner to remain alive.");
    }

    enemies.update(1, plants, economy, base, 5_100);

    expect(enemies.getSnapshot()[0]?.x).toBeCloseTo(
      slowed.x - CombatNumbersV01.enemies.runner.moveSpeed * (1 - CombatNumbersV01.evolution.control.runnerSlowPercent),
      2
    );
    expect(enemies.getSnapshot()[0]).toMatchObject({
      slowed: true,
      slowRemainingSeconds: 0.5
    });
  });

  test("support evolution reduces ammo purchase cost and cooldown and improves hero-kill sun drops", () => {
    const evolutions = new EvolutionSystem();
    const weapons = new WeaponSystem();
    const projectiles = new ProjectileSystem();
    const enemies = new EnemySystem(() => 0.25);
    const economy = new EconomySystem(240);
    const laneIndex = 2;
    const player = createEvolutionPlayer({
      x: 840,
      y: getLaneCenterY(laneIndex),
      reserveAmmo: 0
    });

    const evolved = evolutions.tryEvolve({
      requestId: "request_support",
      matchState: "WAVE_CLEAR",
      evolutionUnlocked: true,
      player,
      path: "support",
      economy,
      serverTimeMs: 6_000
    });
    expect(evolved.ok).toBe(true);

    const bought = weapons.tryBuyAmmo({
      requestId: "request_support_ammo",
      matchState: "WAVE_ACTIVE",
      player,
      economy,
      serverTimeMs: 6_100
    });
    expect(bought.ok).toBe(true);
    expect(economy.getSnapshot()).toMatchObject({
      sharedSun: 0,
      totalSunSpent: CombatNumbersV01.evolution.sunCost + CombatNumbersV01.evolution.support.ammoPackSunCost
    });
    expect(player.ammoPurchaseCooldownRemainingSeconds).toBe(CombatNumbersV01.evolution.support.ammoPurchaseCooldownSeconds);

    enemies.spawnEnemy({ enemyType: "runner", laneIndex, serverTimeMs: 6_200 });
    const enemyId = enemies.getSnapshot()[0]?.id;
    enemies.damageEnemy(enemyId, 50, economy, 6_250);
    const shot = weapons.tryShoot({
      requestId: "request_support_shot",
      matchState: "WAVE_ACTIVE",
      player,
      aimWorldX: MapConfigV01.enemySpawnMarker.centerX,
      aimWorldY: player.y,
      projectiles,
      serverTimeMs: 6_300
    });
    expect(shot.ok).toBe(true);

    projectiles.update(0.1, enemies, economy, 6_400, new Map([[player.playerId, player]]));

    expect(enemies.getSnapshot()).toEqual([]);
    expect(economy.getSnapshot().sharedSun).toBe(CombatNumbersV01.economy.sunDropAmount);
    expect(player.stats.enemiesKilled).toBe(1);
  });
});

describe("Phase 9 GameLoop evolve action integration", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("evolve requests carry request ids and are rejected before Wave 3 unlock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(900_000);
    const harness = runLoopWithRoom();
    harness.loop.start();
    vi.advanceTimersByTime(CombatNumbersV01.match.countdownSeconds * 1000);
    const localPlayer = harness.loop.getCurrentSnapshot().players[0];
    if (!localPlayer) {
      throw new Error("Expected local player in snapshot.");
    }

    const request = {
      requestId: "request_loop_locked_evolve",
      path: "firepower"
    } satisfies EvolveRequestPayload;
    const result = harness.loop.applyEvolveAction(localPlayer.playerId, request);

    expect(result).toMatchObject({
      ok: false,
      rejected: {
        requestId: "request_loop_locked_evolve",
        action: "evolve",
        reason: "EVOLUTION_NOT_UNLOCKED"
      }
    });
  });
});

function createEvolutionPlayer(overrides: Partial<EvolutionTestPlayer> = {}): EvolutionTestPlayer {
  return {
    playerId: "player_evolution",
    slot: 0,
    name: "Evolver",
    connected: true,
    x: 240,
    y: getLaneCenterY(2),
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
    stats: {},
    ...overrides
  };
}

function runLoopWithRoom(): {
  loop: GameLoop;
  latest: () => GameStateSnapshot;
} {
  const snapshots: GameStateSnapshot[] = [];
  let roomState: RoomState = "COUNTDOWN";
  const roomPayload = (): RoomStatePayload => ({
    matchId: "match_phase_9",
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
    matchId: "match_phase_9",
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
