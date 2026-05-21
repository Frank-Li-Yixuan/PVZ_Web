import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import type { BossState, EnemyState, FeedbackEvent, PlayerState } from "../shared/src";

const REQUIRED_PHASE_13C_FILES = [
  "assets/docs/animation_asset_status_v0_1.md",
  "client/src/rendering/animationRegistry.ts",
  "client/src/rendering/entityAnimController.ts",
  "client/src/rendering/fxAnimController.ts"
] as const;

const REQUIRED_ANIMATION_IDS = [
  "hero.rangerA.idle",
  "hero.rangerA.run",
  "hero.rangerA.shoot",
  "hero.rangerB.idle",
  "hero.rangerB.run",
  "hero.rangerB.shoot",
  "plant.sunbloom.idle",
  "plant.sunbloom.produce",
  "plant.peashotter.idle",
  "plant.peashotter.shoot",
  "plant.barkwall.healthy",
  "plant.barkwall.damaged",
  "enemy.shambler.walk",
  "enemy.runner.walk",
  "enemy.brute.walk",
  "boss.ironmaw.idle",
  "boss.ironmaw.chargeWindup",
  "fx.muzzleFlash",
  "fx.hitSpark",
  "fx.sunGain",
  "fx.plantPlace",
  "fx.enemyDeath",
  "fx.bossWeakpoint",
  "fx.bossChargeWarning",
  "fx.bossInterrupted"
] as const;

const EXTERNAL_IP_TERMS = [
  "Plants vs. Zombies",
  "Plants vs Zombies",
  "PVZ",
  "PopCap",
  "Peashooter",
  "Sunflower",
  "Wall-nut"
];

describe("Phase 13C animation pipeline files", () => {
  test("adds required animation pipeline modules and asset-status doc", () => {
    for (const filePath of REQUIRED_PHASE_13C_FILES) {
      expect(existsSync(resolve(process.cwd(), filePath)), filePath).toBe(true);
    }
  });
});

describe("Phase 13C animation registry", () => {
  test("registers every required V0.1 animation id with safe fallback metadata", async () => {
    const { AnimationRegistryV01, P0_ANIMATION_IDS, ANIMATION_ASSET_STATUS_VALUES } = await loadAnimationRegistry();

    expect(P0_ANIMATION_IDS).toEqual(REQUIRED_ANIMATION_IDS);
    expect(ANIMATION_ASSET_STATUS_VALUES).toEqual(["missing", "fallback_only", "prompt_ready", "generated", "integrated"]);

    for (const animationId of REQUIRED_ANIMATION_IDS) {
      const entry = AnimationRegistryV01[animationId];
      expect(entry).toMatchObject({
        id: animationId,
        priority: "P0",
        fallback: "code_tween"
      });
      expect(entry.key.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(0);
      expect(["fallback_only", "prompt_ready", "generated", "integrated"]).toContain(entry.status);
      expectContainsNoExternalIpTerms(`${entry.id} ${entry.key} ${entry.description}`);
    }
  });

  test("documents every required animation id and status value", () => {
    const statusPath = resolve(process.cwd(), "assets/docs/animation_asset_status_v0_1.md");
    expect(existsSync(statusPath)).toBe(true);
    const statusDoc = readFileSync(statusPath, "utf8");

    for (const animationId of REQUIRED_ANIMATION_IDS) {
      expect(statusDoc).toContain(animationId);
    }
    for (const status of ["missing", "fallback_only", "prompt_ready", "generated", "integrated"]) {
      expect(statusDoc).toContain(status);
    }
    expect(statusDoc).toContain("No server-authoritative gameplay rules changed");
    expectContainsNoExternalIpTerms(statusDoc);
  });
});

describe("Phase 13C entity animation state helpers", () => {
  test("derives hero idle/run/reload states from renderer-visible player data", async () => {
    const { getPlayerAnimationState } = await loadEntityAnimController();
    const player = createPlayer({ x: 120, y: 180, reloading: false });

    expect(getPlayerAnimationState(player, { x: 120.1, y: 180.2 }).animationId).toBe("hero.rangerA.idle");
    expect(getPlayerAnimationState(player, { x: 100, y: 180 }).animationId).toBe("hero.rangerA.run");
    expect(getPlayerAnimationState(createPlayer({ slot: 1, reloading: true }))).toMatchObject({
      animationId: "hero.rangerB.idle",
      overlayState: "reload"
    });
  });

  test("derives enemy and boss animation states without changing gameplay state", async () => {
    const { getBossAnimationState, getEnemyAnimationState } = await loadEntityAnimController();

    expect(getEnemyAnimationState(createEnemy({ type: "shambler", state: "MOVING" }))).toMatchObject({
      animationId: "enemy.shambler.walk",
      motionState: "walk"
    });
    expect(getEnemyAnimationState(createEnemy({ type: "runner", state: "ATTACKING_PLANT" }))).toMatchObject({
      animationId: "enemy.runner.walk",
      motionState: "attack"
    });
    expect(getBossAnimationState(createBoss({ currentSkill: "charge_windup", weakPointActive: true }))).toMatchObject({
      animationId: "boss.ironmaw.chargeWindup",
      weakPointPulse: true,
      chargeWarningPulse: true
    });
  });
});

describe("Phase 13C feedback FX mapping", () => {
  test("maps required gameplay feedback events to minimum visual FX", async () => {
    const { feedbackEventToFxAnimation } = await loadFxAnimController();

    expect(feedbackEventToFxAnimation(createFeedback("hero.shoot"))?.animationId).toBe("fx.muzzleFlash");
    expect(feedbackEventToFxAnimation(createFeedback("plant.shoot"))?.animationId).toBe("fx.muzzleFlash");
    expect(feedbackEventToFxAnimation(createFeedback("enemy.hit"))?.animationId).toBe("fx.hitSpark");
    expect(feedbackEventToFxAnimation(createFeedback("enemy.killed"))?.animationId).toBe("fx.enemyDeath");
    expect(feedbackEventToFxAnimation(createFeedback("plant.placed"))?.animationId).toBe("fx.plantPlace");
    expect(feedbackEventToFxAnimation(createFeedback("sun.gained"))?.animationId).toBe("fx.sunGain");
    expect(feedbackEventToFxAnimation(createFeedback("boss.chargeStarted"))?.animationId).toBe("fx.bossChargeWarning");
    expect(feedbackEventToFxAnimation(createFeedback("boss.interrupted"))).toMatchObject({
      animationId: "fx.bossInterrupted",
      screenShake: true
    });
  });
});

async function loadAnimationRegistry(): Promise<typeof import("../client/src/rendering/animationRegistry")> {
  assertPhase13CFileExists("client/src/rendering/animationRegistry.ts");
  return import("../client/src/rendering/animationRegistry");
}

async function loadEntityAnimController(): Promise<typeof import("../client/src/rendering/entityAnimController")> {
  assertPhase13CFileExists("client/src/rendering/entityAnimController.ts");
  return import("../client/src/rendering/entityAnimController");
}

async function loadFxAnimController(): Promise<typeof import("../client/src/rendering/fxAnimController")> {
  assertPhase13CFileExists("client/src/rendering/fxAnimController.ts");
  return import("../client/src/rendering/fxAnimController");
}

function assertPhase13CFileExists(filePath: string): void {
  expect(existsSync(resolve(process.cwd(), filePath)), filePath).toBe(true);
}

function createPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    playerId: "player_1",
    slot: 0,
    name: "Ranger",
    connected: true,
    x: 120,
    y: 180,
    aimX: 1,
    aimY: 0,
    hp: 100,
    maxHp: 100,
    alive: true,
    ammoInMagazine: 6,
    magazineSize: 6,
    reserveAmmo: 24,
    maxReserveAmmo: 24,
    reloading: false,
    ammoPurchaseCooldownRemainingSeconds: 0,
    hasEvolved: false,
    stats: {},
    ...overrides
  };
}

function createEnemy(overrides: Partial<EnemyState> = {}): EnemyState {
  return {
    id: "enemy_1",
    type: "shambler",
    laneIndex: 0,
    x: 700,
    y: 180,
    hp: 60,
    maxHp: 60,
    state: "MOVING",
    ...overrides
  };
}

function createBoss(overrides: Partial<BossState> = {}): BossState {
  return {
    id: "boss_1",
    bossType: "ironmaw_siege_beast",
    x: 780,
    y: 300,
    laneIndex: 2,
    hp: 900,
    maxHp: 900,
    phase: 1,
    weakPointActive: false,
    charging: false,
    interruptProgress: 0,
    interruptRequired: 6,
    ...overrides
  };
}

function createFeedback(eventType: FeedbackEvent["eventType"]): FeedbackEvent {
  return {
    id: `${eventType}_1`,
    eventType,
    serverTimeMs: 1000,
    x: 100,
    y: 100
  };
}

function expectContainsNoExternalIpTerms(value: string): void {
  for (const term of EXTERNAL_IP_TERMS) {
    expect(value).not.toContain(term);
  }
}
