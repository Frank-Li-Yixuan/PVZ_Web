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

const EXPECTED_ANIMATION_CANDIDATE_SHEETS = [
  ["hero.rangerA.run", "assets/art/animations/heroes/hero_ranger_a_run_sheet.png", 512, 128, 4, 128, 128],
  ["hero.rangerB.run", "assets/art/animations/heroes/hero_ranger_b_run_sheet.png", 512, 128, 4, 128, 128],
  ["plant.sunbloom.produce", "assets/art/animations/plants/plant_sunbloom_produce_sheet.png", 384, 128, 3, 128, 128],
  ["plant.peashotter.shoot", "assets/art/animations/plants/plant_peashotter_shoot_sheet.png", 384, 128, 3, 128, 128],
  ["enemy.shambler.walk", "assets/art/animations/enemies/enemy_shambler_walk_sheet.png", 512, 128, 4, 128, 128],
  ["enemy.runner.walk", "assets/art/animations/enemies/enemy_runner_walk_sheet.png", 512, 128, 4, 128, 128],
  ["enemy.brute.walk", "assets/art/animations/enemies/enemy_brute_walk_sheet.png", 640, 160, 4, 160, 160],
  ["boss.ironmaw.chargeWindup", "assets/art/animations/boss/boss_ironmaw_charge_windup_sheet.png", 2048, 512, 4, 512, 512],
  ["fx.muzzleFlash", "assets/art/animations/fx/fx_muzzle_flash_sheet.png", 256, 64, 4, 64, 64],
  ["fx.hitSpark", "assets/art/animations/fx/fx_hit_spark_sheet.png", 320, 64, 5, 64, 64],
  ["fx.bossWeakpoint", "assets/art/animations/fx/fx_boss_weakpoint_sheet.png", 384, 96, 4, 96, 96],
  ["fx.bossChargeWarning", "assets/art/animations/fx/fx_boss_charge_warning_sheet.png", 512, 64, 4, 128, 64]
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
    const promptPath = resolve(process.cwd(), "assets/art/source_prompts/image_gen_prompts_v0_1.md");
    expect(existsSync(statusPath)).toBe(true);
    expect(existsSync(promptPath)).toBe(true);
    const statusDoc = readFileSync(statusPath, "utf8");
    const promptDoc = readFileSync(promptPath, "utf8");

    for (const animationId of REQUIRED_ANIMATION_IDS) {
      expect(statusDoc).toContain(animationId);
    }
    for (const status of ["missing", "fallback_only", "prompt_ready", "generated", "integrated"]) {
      expect(statusDoc).toContain(status);
    }
    for (const [, assetPath] of EXPECTED_ANIMATION_CANDIDATE_SHEETS) {
      expect(statusDoc).toContain(assetPath);
      expect(promptDoc).toContain(assetPath.split("/").at(-1));
    }
    expect(statusDoc).toContain("No server-authoritative gameplay rules changed");
    expectContainsNoExternalIpTerms(statusDoc);
    expectContainsNoExternalIpTerms(promptDoc);
  });

  test("tracks generated candidate spritesheets with exact horizontal frame dimensions", async () => {
    const { AnimationRegistryV01 } = await loadAnimationRegistry();

    for (const [animationId, assetPath, width, height, frameCount, frameWidth, frameHeight] of EXPECTED_ANIMATION_CANDIDATE_SHEETS) {
      const absolutePath = resolve(process.cwd(), assetPath);
      expect(existsSync(absolutePath), assetPath).toBe(true);
      expect(readPngDimensions(absolutePath)).toEqual({ width, height });

      const entry = AnimationRegistryV01[animationId];
      expect(entry.status).toBe("generated");
      expect(entry.candidateSheet).toEqual({
        path: assetPath,
        frameWidth,
        frameHeight,
        frameCount,
        layout: "horizontal",
        source: "procedural_seed_transform",
        integration: "candidate_only"
      });
    }
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

function readPngDimensions(filePath: string): { width: number; height: number } {
  const header = readFileSync(filePath);
  expect(header.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20)
  };
}
