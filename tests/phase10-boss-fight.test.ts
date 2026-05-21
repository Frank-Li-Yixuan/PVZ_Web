import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GameLoop } from "../server/src/match/GameLoop";
import { BossSystem } from "../server/src/systems/BossSystem";
import { EconomySystem } from "../server/src/systems/EconomySystem";
import { EnemySystem } from "../server/src/systems/EnemySystem";
import { PlantSystem } from "../server/src/systems/PlantSystem";
import { ProjectileSystem } from "../server/src/systems/ProjectileSystem";
import {
  CombatNumbersV01,
  MapConfigV01,
  getLaneCenterY,
  getPlantCellCenter,
  type BaseState,
  type FeedbackEvent,
  type GameStateSnapshot,
  type PlayerState,
  type PlantState,
  type RoomState,
  type RoomStatePayload
} from "../shared/src";

type BossTestPlayer = PlayerState & {
  nextAllowedShotTimeMs?: number;
};

describe("Phase 10 BossSystem lifecycle and phase rules", () => {
  test("spawns Ironmaw but only exposes boss snapshots during BOSS_ACTIVE", () => {
    const boss = new BossSystem();

    expect(boss.getSnapshot("BOSS_PREP")).toBeUndefined();
    const spawn = boss.spawnBoss(1_000);

    expect(spawn).toMatchObject({
      ok: true,
      boss: expect.objectContaining({
        bossType: "ironmaw_siege_beast",
        hp: CombatNumbersV01.boss.ironmaw.maxHp,
        phase: 1,
        weakPointActive: false,
        charging: false
      }),
      feedback: expect.objectContaining({
        eventType: "boss.spawned"
      })
    });
    expect(boss.getSnapshot("BOSS_PREP")).toBeUndefined();
    expect(boss.getSnapshot("BOSS_ACTIVE")).toMatchObject({
      bossType: "ironmaw_siege_beast",
      hp: CombatNumbersV01.boss.ironmaw.maxHp,
      phase: 1
    });
  });

  test("phase 1 exposes weak points, phase 2 starts at 50 percent HP, and rewards team sun", () => {
    const boss = spawnBoss();
    const economy = new EconomySystem(0);
    const player = createBossPlayer();

    const weakPointEvents = updateBoss(boss, {
      deltaSeconds: CombatNumbersV01.boss.ironmaw.weakPointExpose.firstCastSeconds,
      economy
    }).events;

    expect(weakPointEvents).toEqual([
      expect.objectContaining({
        eventType: "boss.weakPointExposed"
      })
    ]);
    expect(boss.getSnapshot("BOSS_ACTIVE")).toMatchObject({
      weakPointActive: true,
      weakPointRemainingSeconds: CombatNumbersV01.boss.ironmaw.weakPointExpose.durationSeconds
    });

    const phaseChange = boss.damageBoss({
      amount: CombatNumbersV01.boss.ironmaw.maxHp - CombatNumbersV01.boss.ironmaw.phase2HpThreshold,
      source: "hero",
      player,
      economy,
      serverTimeMs: 2_000
    });

    expect(phaseChange).toMatchObject({
      hit: true,
      killed: false,
      damageApplied: CombatNumbersV01.boss.ironmaw.maxHp - CombatNumbersV01.boss.ironmaw.phase2HpThreshold,
      events: expect.arrayContaining([
        expect.objectContaining({ eventType: "boss.phaseChanged" }),
        expect.objectContaining({ eventType: "sun.gained" })
      ])
    });
    expect(economy.getSnapshot()).toMatchObject({
      sharedSun: CombatNumbersV01.boss.ironmaw.phaseTransition.teamSunReward,
      totalSunEarned: CombatNumbersV01.boss.ironmaw.phaseTransition.teamSunReward
    });
    expect(boss.getSnapshot("BOSS_ACTIVE")).toMatchObject({
      hp: CombatNumbersV01.boss.ironmaw.phase2HpThreshold,
      phase: 2,
      skillRemainingSeconds: CombatNumbersV01.boss.ironmaw.phaseTransition.stunSeconds
    });
  });

  test("boss death reports victory feedback when the base is still alive", () => {
    const boss = spawnBoss();
    const economy = new EconomySystem();
    const player = createBossPlayer();

    const result = boss.damageBoss({
      amount: CombatNumbersV01.boss.ironmaw.maxHp,
      source: "hero",
      player,
      economy,
      serverTimeMs: 3_000
    });

    expect(result).toMatchObject({
      hit: true,
      killed: true,
      damageApplied: CombatNumbersV01.boss.ironmaw.maxHp,
      events: expect.arrayContaining([
        expect.objectContaining({ eventType: "match.victory" })
      ])
    });
    expect(boss.getSnapshot("BOSS_ACTIVE")).toBeUndefined();
  });
});

describe("Phase 10 boss projectile collision and evolution modifiers", () => {
  test("hero bullets damage Boss weak points, firepower changes the weak point multiplier, and control increases interrupt progress", () => {
    const boss = enterPhase2Charge();
    const economy = new EconomySystem();
    const enemies = new EnemySystem(() => 1);
    const firepowerPlayer = createBossPlayer({ playerId: "firepower", hasEvolved: true, evolutionPath: "firepower" });
    const controlPlayer = createBossPlayer({ playerId: "control", hasEvolved: true, evolutionPath: "control" });
    const initialHp = boss.getSnapshot("BOSS_ACTIVE")?.hp ?? 0;

    fireHeroBulletAtBossWeakPoint({ boss, economy, enemies, player: firepowerPlayer, serverTimeMs: 4_000 });
    expect(boss.getSnapshot("BOSS_ACTIVE")).toMatchObject({
      hp: initialHp - CombatNumbersV01.evolution.firepower.pistolDamage * CombatNumbersV01.evolution.firepower.weakPointMultiplier,
      interruptProgress: 1
    });
    expect(firepowerPlayer.stats.damageDealt).toBe(
      CombatNumbersV01.evolution.firepower.pistolDamage * CombatNumbersV01.evolution.firepower.weakPointMultiplier
    );

    fireHeroBulletAtBossWeakPoint({ boss, economy, enemies, player: controlPlayer, serverTimeMs: 5_000 });
    expect(boss.getSnapshot("BOSS_ACTIVE")?.interruptProgress).toBe(3);

    const plant = createPeashotterPlant();
    const projectiles = new ProjectileSystem();
    projectiles.spawnPeaProjectile(plant, 5_100);
    projectiles.update(0.25, enemies, economy, 5_350, new Map(), boss);

    expect(boss.getSnapshot("BOSS_ACTIVE")).toMatchObject({
      hp:
        initialHp -
        CombatNumbersV01.evolution.firepower.pistolDamage * CombatNumbersV01.evolution.firepower.weakPointMultiplier -
        CombatNumbersV01.weapon.pistol.damage * CombatNumbersV01.boss.ironmaw.weakPointMultiplier -
        CombatNumbersV01.plants.peashotter.damage,
      interruptProgress: 3
    });
  });

  test("charge windup can be interrupted only by enough hero weak point hits", () => {
    const boss = enterPhase2Charge();
    const economy = new EconomySystem();
    const enemies = new EnemySystem(() => 1);
    const controlPlayer = createBossPlayer({ playerId: "control", hasEvolved: true, evolutionPath: "control" });

    let events: FeedbackEvent[] = [];
    for (let shot = 0; shot < 4; shot += 1) {
      events = fireHeroBulletAtBossWeakPoint({
        boss,
        economy,
        enemies,
        player: controlPlayer,
        serverTimeMs: 6_000 + shot * 1_000
      });
    }

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: "boss.interrupted"
        })
      ])
    );
    expect(boss.getSnapshot("BOSS_ACTIVE")).toMatchObject({
      charging: false,
      weakPointActive: false,
      interruptProgress: CombatNumbersV01.boss.ironmaw.charge.requiredInterruptPoints
    });
    expect(controlPlayer.stats.bossInterrupts).toBe(1);
  });
});

describe("Phase 10 boss skills", () => {
  test("failed charge damages the first plant in the path and heroes hit by the dash", () => {
    const boss = enterPhase2Charge();
    const plantSystem = new PlantSystem();
    const economy = new EconomySystem();
    const enemies = new EnemySystem(() => 1);
    const base: BaseState = { hp: CombatNumbersV01.base.maxHp, maxHp: CombatNumbersV01.base.maxHp };
    const hero = createBossPlayer({
      x: MapConfigV01.enemySpawnMarker.centerX - 42,
      y: getLaneCenterY(CombatNumbersV01.boss.ironmaw.mainLane)
    });
    const plantOwner = createBossPlayer({
      x: getPlantCellCenter({ laneIndex: 2, columnIndex: 6 }).x,
      y: getPlantCellCenter({ laneIndex: 2, columnIndex: 6 }).y
    });
    const planted = plantSystem.tryPlant({
      requestId: "request_barkwall",
      request: {
        requestId: "request_barkwall",
        plantType: "barkwall",
        laneIndex: 2,
        columnIndex: 6
      },
      matchState: "BOSS_ACTIVE",
      player: plantOwner,
      economy: new EconomySystem(999),
      serverTimeMs: 7_000,
      enemies: []
    });
    expect(planted.ok).toBe(true);

    const beforeChargeX = boss.getSnapshot("BOSS_ACTIVE")?.x;
    const result = updateBoss(boss, {
      deltaSeconds: CombatNumbersV01.boss.ironmaw.charge.windupSeconds,
      plants: plantSystem,
      enemies,
      economy,
      base,
      players: [hero],
      serverTimeMs: 10_000
    });

    expect(result.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: "boss.chargeFailed"
        })
      ])
    );
    expect(boss.getSnapshot("BOSS_ACTIVE")?.x).toBe((beforeChargeX ?? 0) - CombatNumbersV01.boss.ironmaw.charge.failedChargeDistance);
    expect(plantSystem.getSnapshot()).toEqual([
      expect.objectContaining({
        type: "barkwall",
        hp: CombatNumbersV01.plants.barkwall.maxHp - CombatNumbersV01.boss.ironmaw.charge.damageToFirstPlant
      })
    ]);
    expect(hero.hp).toBe(CombatNumbersV01.hero.maxHp - CombatNumbersV01.boss.ironmaw.charge.damageToHero);
    expect(hero.stats.damageTaken).toBe(CombatNumbersV01.boss.ironmaw.charge.damageToHero);
  });

  test("phase 2 summon and sun suppression run from server state", () => {
    const boss = enterPhase2Ready();
    const plantSystem = new PlantSystem();
    const enemies = new EnemySystem(() => 0);
    const economy = new EconomySystem();
    const base: BaseState = { hp: CombatNumbersV01.base.maxHp, maxHp: CombatNumbersV01.base.maxHp };

    updateBoss(boss, {
      deltaSeconds: CombatNumbersV01.boss.ironmaw.charge.firstCastAfterPhase2Seconds,
      plants: plantSystem,
      enemies,
      economy,
      base
    });
    updateBoss(boss, {
      deltaSeconds: CombatNumbersV01.boss.ironmaw.charge.windupSeconds,
      plants: plantSystem,
      enemies,
      economy,
      base
    });
    updateBoss(boss, {
      deltaSeconds: CombatNumbersV01.boss.ironmaw.charge.recoverySeconds,
      plants: plantSystem,
      enemies,
      economy,
      base
    });

    const summon = updateBoss(boss, {
      deltaSeconds:
        CombatNumbersV01.boss.ironmaw.phase2Summon.firstCastAfterPhase2Seconds -
        CombatNumbersV01.boss.ironmaw.charge.firstCastAfterPhase2Seconds,
      plants: plantSystem,
      enemies,
      economy,
      base
    });
    expect(summon.spawns).toHaveLength(CombatNumbersV01.boss.ironmaw.phase2Summon.count);
    expect(summon.spawns.map((spawn) => spawn.enemyType)).toEqual(["runner", "runner"]);

    const suppression = updateBoss(boss, {
      deltaSeconds:
        CombatNumbersV01.boss.ironmaw.sunSuppression.firstCastAfterPhase2Seconds -
        CombatNumbersV01.boss.ironmaw.phase2Summon.firstCastAfterPhase2Seconds,
      plants: plantSystem,
      enemies,
      economy,
      base
    });

    expect(suppression.events).toEqual([
      expect.objectContaining({
        eventType: "boss.phaseChanged",
        data: expect.objectContaining({ skill: "sun_suppression" })
      })
    ]);
    expect(economy.getSnapshot()).toMatchObject({
      sunSuppressed: true,
      sunSuppressionRemainingSeconds: CombatNumbersV01.boss.ironmaw.sunSuppression.durationSeconds
    });
  });
});

describe("Phase 10 GameLoop boss integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("debug startBoss transitions into BOSS_ACTIVE and includes Boss in snapshots", () => {
    const phases: string[] = [];
    const harness = runLoopWithRoom(phases);

    harness.loop.start();
    const result = harness.loop.applyDebugCommand({ command: "startBoss" });
    const snapshot = harness.loop.getCurrentSnapshot();

    expect(result).toEqual({ ok: true });
    expect(phases).toEqual(expect.arrayContaining(["COUNTDOWN", "BOSS_ACTIVE"]));
    expect(snapshot).toMatchObject({
      matchState: "BOSS_ACTIVE",
      boss: expect.objectContaining({
        bossType: "ironmaw_siege_beast",
        hp: CombatNumbersV01.boss.ironmaw.maxHp,
        phase: 1
      }),
      events: expect.arrayContaining([
        expect.objectContaining({
          eventType: "boss.spawned"
        })
      ])
    });
  });
});

function spawnBoss(): BossSystem {
  const boss = new BossSystem(() => 0);
  const spawn = boss.spawnBoss(0);
  if (!spawn.ok) {
    throw new Error("Expected boss spawn to succeed.");
  }
  return boss;
}

function enterPhase2Ready(): BossSystem {
  const boss = spawnBoss();
  boss.damageBoss({
    amount: CombatNumbersV01.boss.ironmaw.maxHp - CombatNumbersV01.boss.ironmaw.phase2HpThreshold,
    source: "hero",
    player: createBossPlayer(),
    economy: new EconomySystem(),
    serverTimeMs: 1_000
  });
  updateBoss(boss, {
    deltaSeconds: CombatNumbersV01.boss.ironmaw.phaseTransition.stunSeconds
  });
  return boss;
}

function enterPhase2Charge(): BossSystem {
  const boss = enterPhase2Ready();
  updateBoss(boss, {
    deltaSeconds: CombatNumbersV01.boss.ironmaw.charge.firstCastAfterPhase2Seconds
  });
  expect(boss.getSnapshot("BOSS_ACTIVE")).toMatchObject({
    currentSkill: "charge_windup",
    charging: true,
    weakPointActive: true,
    interruptProgress: 0,
    interruptRequired: CombatNumbersV01.boss.ironmaw.charge.requiredInterruptPoints
  });
  return boss;
}

function updateBoss(
  boss: BossSystem,
  overrides: Partial<Parameters<BossSystem["update"]>[0]> & { deltaSeconds: number }
): ReturnType<BossSystem["update"]> {
  return boss.update({
    matchState: "BOSS_ACTIVE",
    deltaSeconds: overrides.deltaSeconds,
    plants: overrides.plants ?? new PlantSystem(),
    enemies: overrides.enemies ?? new EnemySystem(() => 1),
    economy: overrides.economy ?? new EconomySystem(),
    base: overrides.base ?? { hp: CombatNumbersV01.base.maxHp, maxHp: CombatNumbersV01.base.maxHp },
    players: overrides.players ?? [],
    serverTimeMs: overrides.serverTimeMs ?? 1_000
  });
}

function fireHeroBulletAtBossWeakPoint(input: {
  boss: BossSystem;
  economy: EconomySystem;
  enemies: EnemySystem;
  player: BossTestPlayer;
  serverTimeMs: number;
}) {
  const snapshot = input.boss.getSnapshot("BOSS_ACTIVE");
  if (!snapshot?.weakPointActive || snapshot.weakPointX === undefined || snapshot.weakPointY === undefined) {
    throw new Error("Boss weak point must be active before firing.");
  }

  input.player.x = snapshot.weakPointX - 110;
  input.player.y = snapshot.weakPointY;
  input.player.aimX = 1;
  input.player.aimY = 0;

  const projectiles = new ProjectileSystem();
  projectiles.spawnHeroBullet(input.player, { x: 1, y: 0 }, input.serverTimeMs);
  return projectiles.update(
    0.2,
    input.enemies,
    input.economy,
    input.serverTimeMs + 200,
    new Map([[input.player.playerId, input.player]]),
    input.boss
  );
}

function createPeashotterPlant(overrides: Partial<PlantState> = {}): PlantState {
  return {
    id: "plant_peashotter_test",
    type: "peashotter",
    laneIndex: 2,
    columnIndex: 6,
    hp: CombatNumbersV01.plants.peashotter.maxHp,
    maxHp: CombatNumbersV01.plants.peashotter.maxHp,
    alive: true,
    ...overrides
  };
}

function createBossPlayer(overrides: Partial<BossTestPlayer> = {}): BossTestPlayer {
  return {
    playerId: "player_boss",
    slot: 0,
    name: "Boss Tester",
    connected: true,
    x: 820,
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

function runLoopWithRoom(phases: string[]): {
  loop: GameLoop;
  latest: () => GameStateSnapshot;
} {
  const snapshots: GameStateSnapshot[] = [];
  let roomState: RoomState = "COUNTDOWN";
  const roomPayload = (): RoomStatePayload => ({
    matchId: "match_phase_10",
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
    matchId: "match_phase_10",
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
