import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GameLoop } from "../server/src/match/GameLoop";
import { EconomySystem } from "../server/src/systems/EconomySystem";
import { EnemySystem } from "../server/src/systems/EnemySystem";
import { ProjectileSystem } from "../server/src/systems/ProjectileSystem";
import { WeaponSystem } from "../server/src/systems/WeaponSystem";
import {
  CombatNumbersV01,
  MapConfigV01,
  getLaneCenterY,
  type GameStateSnapshot,
  type PlayerState,
  type RoomState,
  type RoomStatePayload,
  type ShootRequestPayload
} from "../shared/src";

type WeaponTestPlayer = PlayerState & {
  nextAllowedShotTimeMs?: number;
};

describe("Phase 7 WeaponSystem shooting", () => {
  test("shooting consumes magazine ammo, creates a server-owned hero bullet, and rate limits the next shot", () => {
    const weapons = new WeaponSystem();
    const projectiles = new ProjectileSystem();
    const player = createWeaponPlayer();

    const firstShot = weapons.tryShoot({
      requestId: "request_shoot_1",
      matchState: "WAVE_ACTIVE",
      player,
      aimWorldX: player.x + 100,
      aimWorldY: player.y,
      projectiles,
      serverTimeMs: 1_000
    });

    expect(firstShot.ok).toBe(true);
    if (!firstShot.ok) {
      throw new Error("Expected first shot to be accepted.");
    }
    expect(player.ammoInMagazine).toBe(CombatNumbersV01.weapon.pistol.magazineSize - 1);
    expect(player.stats.shotsFired).toBe(1);
    expect(player.nextAllowedShotTimeMs).toBeGreaterThan(1_000);
    expect(firstShot.accepted).toMatchObject({
      requestId: "request_shoot_1",
      action: "shoot",
      affectedEntityIds: [expect.stringMatching(/^bullet_/)]
    });
    expect(firstShot.feedback).toMatchObject({
      eventType: "hero.shoot",
      playerId: player.playerId
    });
    expect(projectiles.getSnapshot()).toEqual([
      expect.objectContaining({
        id: firstShot.accepted.affectedEntityIds?.[0],
        ownerPlayerId: player.playerId,
        type: "hero_bullet",
        dirX: 1,
        dirY: 0,
        speed: CombatNumbersV01.weapon.pistol.bulletSpeed
      })
    ]);

    const rateLimited = weapons.tryShoot({
      requestId: "request_shoot_rate_limited",
      matchState: "WAVE_ACTIVE",
      player,
      aimWorldX: player.x + 100,
      aimWorldY: player.y,
      projectiles,
      serverTimeMs: 1_001
    });

    expect(rateLimited).toMatchObject({
      ok: false,
      rejected: {
        requestId: "request_shoot_rate_limited",
        action: "shoot",
        reason: "FIRE_RATE_LIMITED"
      }
    });
    expect(projectiles.getSnapshot()).toHaveLength(1);
  });

  test("empty shots and reload-state shots are rejected without spawning bullets", () => {
    const weapons = new WeaponSystem();
    const projectiles = new ProjectileSystem();
    const player = createWeaponPlayer({ ammoInMagazine: 0 });

    const emptyShot = weapons.tryShoot({
      requestId: "request_empty",
      matchState: "WAVE_ACTIVE",
      player,
      aimWorldX: player.x + 100,
      aimWorldY: player.y,
      projectiles,
      serverTimeMs: 2_000
    });

    expect(emptyShot).toMatchObject({
      ok: false,
      rejected: {
        action: "shoot",
        reason: "AMMO_EMPTY"
      },
      feedback: {
        eventType: "hero.dryFire",
        playerId: player.playerId
      }
    });
    expect(projectiles.getSnapshot()).toEqual([]);
    expect(player.stats.shotsFired).toBeUndefined();

    player.ammoInMagazine = 1;
    player.reloading = true;
    player.reloadRemainingSeconds = CombatNumbersV01.weapon.pistol.reloadSeconds;

    expect(
      weapons.tryShoot({
        requestId: "request_during_reload",
        matchState: "WAVE_ACTIVE",
        player,
        aimWorldX: player.x + 100,
        aimWorldY: player.y,
        projectiles,
        serverTimeMs: 2_100
      })
    ).toMatchObject({
      ok: false,
      rejected: {
        action: "shoot",
        reason: "RELOADING"
      }
    });
    expect(projectiles.getSnapshot()).toEqual([]);
  });

  test("hero bullets hit enemies only through server-side projectile collision and update shooter stats", () => {
    const weapons = new WeaponSystem();
    const projectiles = new ProjectileSystem();
    const enemies = new EnemySystem(() => 1);
    const economy = new EconomySystem();
    const laneIndex = 2;
    const player = createWeaponPlayer({
      x: 240,
      y: getLaneCenterY(laneIndex),
      aimX: 1,
      aimY: 0
    });
    const playersById = new Map([[player.playerId, player]]);

    enemies.spawnEnemy({ enemyType: "runner", laneIndex, serverTimeMs: 0 });

    for (let shot = 0; shot < 3; shot += 1) {
      const serverTimeMs = 3_000 + shot * 1_000;
      const result = weapons.tryShoot({
        requestId: `request_hit_${shot}`,
        matchState: "WAVE_ACTIVE",
        player,
        aimWorldX: MapConfigV01.enemySpawnMarker.centerX,
        aimWorldY: player.y,
        projectiles,
        serverTimeMs
      });

      expect(result.ok).toBe(true);
      for (let step = 0; step < 28; step += 1) {
        projectiles.update(0.05, enemies, economy, serverTimeMs + step * 50, playersById);
      }
    }

    expect(enemies.getSnapshot()).toEqual([]);
    expect(projectiles.getSnapshot()).toEqual([]);
    expect(player.stats.shotsFired).toBe(3);
    expect(player.stats.shotsHit).toBe(3);
    expect(player.stats.damageDealt).toBe(CombatNumbersV01.enemies.runner.maxHp);
    expect(player.stats.enemiesKilled).toBe(1);
  });
});

describe("Phase 7 WeaponSystem reload and ammo purchase", () => {
  test("reload starts a timer, blocks duplicate reloads, and transfers reserve ammo on completion", () => {
    const weapons = new WeaponSystem();
    const player = createWeaponPlayer({
      ammoInMagazine: 3,
      reserveAmmo: 10
    });

    const reload = weapons.tryReload({
      requestId: "request_reload",
      matchState: "WAVE_ACTIVE",
      player,
      serverTimeMs: 4_000
    });

    expect(reload.ok).toBe(true);
    if (!reload.ok) {
      throw new Error("Expected reload to start.");
    }
    expect(player.reloading).toBe(true);
    expect(player.reloadRemainingSeconds).toBe(CombatNumbersV01.weapon.pistol.reloadSeconds);
    expect(reload.feedback).toMatchObject({
      eventType: "hero.reloadStart",
      playerId: player.playerId
    });
    expect(
      weapons.tryReload({
        requestId: "request_reload_again",
        matchState: "WAVE_ACTIVE",
        player,
        serverTimeMs: 4_050
      })
    ).toMatchObject({
      ok: false,
      rejected: {
        reason: "RELOADING"
      }
    });

    weapons.update(CombatNumbersV01.weapon.pistol.reloadSeconds / 2, [player], 4_600);
    expect(player.reloading).toBe(true);
    expect(player.reloadRemainingSeconds).toBeCloseTo(CombatNumbersV01.weapon.pistol.reloadSeconds / 2, 3);

    const events = weapons.update(CombatNumbersV01.weapon.pistol.reloadSeconds / 2, [player], 5_200);

    expect(player.reloading).toBe(false);
    expect(player.reloadRemainingSeconds).toBeUndefined();
    expect(player.ammoInMagazine).toBe(CombatNumbersV01.weapon.pistol.magazineSize);
    expect(player.reserveAmmo).toBe(5);
    expect(events).toEqual([
      expect.objectContaining({
        eventType: "hero.reloadComplete",
        playerId: player.playerId
      })
    ]);
  });

  test("reload rejects full magazines, empty reserve, dead players, and invalid match states", () => {
    const weapons = new WeaponSystem();

    expect(
      weapons.tryReload({
        requestId: "request_full_magazine",
        matchState: "WAVE_ACTIVE",
        player: createWeaponPlayer(),
        serverTimeMs: 5_000
      })
    ).toMatchObject({
      ok: false,
      rejected: {
        reason: "UNKNOWN_ERROR",
        message: expect.stringContaining("already full")
      }
    });

    expect(
      weapons.tryReload({
        requestId: "request_no_reserve",
        matchState: "WAVE_ACTIVE",
        player: createWeaponPlayer({ ammoInMagazine: 3, reserveAmmo: 0 }),
        serverTimeMs: 5_100
      })
    ).toMatchObject({
      ok: false,
      rejected: {
        reason: "RESERVE_AMMO_EMPTY"
      }
    });

    expect(
      weapons.tryReload({
        requestId: "request_dead_reload",
        matchState: "WAVE_ACTIVE",
        player: createWeaponPlayer({ alive: false }),
        serverTimeMs: 5_200
      })
    ).toMatchObject({
      ok: false,
      rejected: {
        reason: "PLAYER_DEAD"
      }
    });

    expect(
      weapons.tryReload({
        requestId: "request_countdown_reload",
        matchState: "COUNTDOWN",
        player: createWeaponPlayer({ ammoInMagazine: 3 }),
        serverTimeMs: 5_300
      })
    ).toMatchObject({
      ok: false,
      rejected: {
        reason: "NOT_IN_VALID_MATCH_STATE"
      }
    });
  });

  test("buy ammo spends shared sun, caps reserve ammo, starts cooldown, and updates stats", () => {
    const weapons = new WeaponSystem();
    const economy = new EconomySystem(100);
    const player = createWeaponPlayer({ reserveAmmo: 20 });

    const bought = weapons.tryBuyAmmo({
      requestId: "request_buy_ammo",
      matchState: "WAVE_ACTIVE",
      player,
      economy,
      serverTimeMs: 6_000
    });

    expect(bought.ok).toBe(true);
    if (!bought.ok) {
      throw new Error("Expected ammo purchase to succeed.");
    }
    expect(economy.getSnapshot()).toMatchObject({
      sharedSun: 50,
      totalSunSpent: CombatNumbersV01.weapon.ammoPack.sunCost
    });
    expect(player.reserveAmmo).toBe(CombatNumbersV01.weapon.pistol.maxReserveAmmo);
    expect(player.ammoPurchaseCooldownRemainingSeconds).toBe(CombatNumbersV01.weapon.ammoPack.cooldownSeconds);
    expect(player.stats.ammoPurchased).toBe(1);
    expect(player.stats.sunSpent).toBe(CombatNumbersV01.weapon.ammoPack.sunCost);

    expect(
      weapons.tryBuyAmmo({
        requestId: "request_buy_cooldown",
        matchState: "WAVE_ACTIVE",
        player: createWeaponPlayer({ reserveAmmo: 0, ammoPurchaseCooldownRemainingSeconds: 5 }),
        economy,
        serverTimeMs: 6_100
      })
    ).toMatchObject({
      ok: false,
      rejected: {
        reason: "AMMO_PURCHASE_COOLDOWN"
      }
    });

    expect(
      weapons.tryBuyAmmo({
        requestId: "request_reserve_full",
        matchState: "WAVE_ACTIVE",
        player: createWeaponPlayer({ reserveAmmo: CombatNumbersV01.weapon.pistol.maxReserveAmmo }),
        economy,
        serverTimeMs: 6_200
      })
    ).toMatchObject({
      ok: false,
      rejected: {
        reason: "RESERVE_AMMO_FULL"
      }
    });

    expect(
      weapons.tryBuyAmmo({
        requestId: "request_no_sun",
        matchState: "WAVE_ACTIVE",
        player: createWeaponPlayer({ reserveAmmo: 0 }),
        economy: new EconomySystem(0),
        serverTimeMs: 6_300
      })
    ).toMatchObject({
      ok: false,
      rejected: {
        reason: "NOT_ENOUGH_SUN"
      }
    });

    const cooldownPlayer = createWeaponPlayer({ reserveAmmo: 0, ammoPurchaseCooldownRemainingSeconds: 1 });
    weapons.update(1, [cooldownPlayer], 7_000);
    expect(cooldownPlayer.ammoPurchaseCooldownRemainingSeconds).toBe(0);
  });
});

describe("Phase 7 GameLoop weapon integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(500_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("shoot, reload, and buy ammo mutate authoritative snapshots", () => {
    const harness = runLoopWithRoom();
    harness.loop.start();
    vi.advanceTimersByTime(CombatNumbersV01.match.countdownSeconds * 1000);

    const localPlayer = harness.loop.getCurrentSnapshot().players[0];
    expect(localPlayer).toBeDefined();
    if (!localPlayer) {
      throw new Error("Expected local player in snapshot.");
    }
    harness.loop.applyPlayerAimInput(localPlayer.playerId, {
      worldX: localPlayer.x + 100,
      worldY: localPlayer.y
    });

    const shot = harness.loop.applyShootAction(localPlayer.playerId, {
      requestId: "request_loop_shoot",
      aimWorldX: localPlayer.x + 100,
      aimWorldY: localPlayer.y
    });

    expect(shot.ok).toBe(true);
    expect(harness.loop.getCurrentSnapshot()).toMatchObject({
      players: [
        expect.objectContaining({
          ammoInMagazine: CombatNumbersV01.weapon.pistol.magazineSize - 1,
          reserveAmmo: CombatNumbersV01.weapon.pistol.initialReserveAmmo,
          stats: expect.objectContaining({ shotsFired: 1 })
        }),
        expect.any(Object)
      ],
      bullets: [
        expect.objectContaining({
          type: "hero_bullet",
          ownerPlayerId: localPlayer.playerId
        })
      ]
    });

    const bought = harness.loop.applyBuyAmmoAction(localPlayer.playerId, {
      requestId: "request_loop_buy"
    });

    expect(bought.ok).toBe(true);
    expect(harness.loop.getCurrentSnapshot()).toMatchObject({
      economy: {
        sharedSun: CombatNumbersV01.economy.initialSharedSun - CombatNumbersV01.weapon.ammoPack.sunCost
      },
      players: [
        expect.objectContaining({
          reserveAmmo: CombatNumbersV01.weapon.pistol.maxReserveAmmo,
          ammoPurchaseCooldownRemainingSeconds: CombatNumbersV01.weapon.ammoPack.cooldownSeconds,
          stats: expect.objectContaining({ ammoPurchased: 1 })
        }),
        expect.any(Object)
      ]
    });

    const reload = harness.loop.applyReloadAction(localPlayer.playerId, {
      requestId: "request_loop_reload"
    });

    expect(reload.ok).toBe(true);
    expect(harness.loop.getCurrentSnapshot().players[0]).toMatchObject({
      reloading: true,
      reloadRemainingSeconds: CombatNumbersV01.weapon.pistol.reloadSeconds
    });

    vi.advanceTimersByTime(CombatNumbersV01.weapon.pistol.reloadSeconds * 1000);

    expect(harness.loop.getCurrentSnapshot().players[0]).toMatchObject({
      ammoInMagazine: CombatNumbersV01.weapon.pistol.magazineSize,
      reserveAmmo: CombatNumbersV01.weapon.pistol.maxReserveAmmo - 1,
      reloading: false
    });
  });

  test("shoot requests carry only aim intent and never client-reported hit targets", () => {
    const request = {
      requestId: "request_intent_only",
      aimWorldX: 500,
      aimWorldY: 250
    } satisfies ShootRequestPayload;

    expect("enemyId" in request).toBe(false);
    expect("damage" in request).toBe(false);
  });
});

function createWeaponPlayer(overrides: Partial<WeaponTestPlayer> = {}): WeaponTestPlayer {
  return {
    playerId: "player_weapon",
    slot: 0,
    name: "Shooter",
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
    matchId: "match_phase_7",
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
    matchId: "match_phase_7",
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
