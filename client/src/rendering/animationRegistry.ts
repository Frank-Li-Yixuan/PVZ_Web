import type Phaser from "phaser";

export const ANIMATION_ASSET_STATUS_VALUES = ["missing", "fallback_only", "prompt_ready", "generated", "integrated"] as const;

export type AnimationAssetStatus = (typeof ANIMATION_ASSET_STATUS_VALUES)[number];

export const P0_ANIMATION_IDS = [
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

export type AnimationId = (typeof P0_ANIMATION_IDS)[number];
export type AnimationPriority = "P0";
export type AnimationCategory = "hero" | "plant" | "enemy" | "boss" | "fx";
export type AnimationFallback = "code_tween";
export type AnimationCandidateSource = "procedural_seed_transform" | "image_gen";

export type AnimationCandidateSheet = {
  path: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  layout: "horizontal";
  source: AnimationCandidateSource;
  integration: "candidate_only";
};

export type AnimationRegistryEntry = {
  id: AnimationId;
  key: string;
  category: AnimationCategory;
  priority: AnimationPriority;
  status: AnimationAssetStatus;
  fallback: AnimationFallback;
  description: string;
  candidateSheet?: AnimationCandidateSheet;
};

export const AnimationRegistryV01 = {
  "hero.rangerA.idle": entry("hero.rangerA.idle", "hero_ranger_a_idle_bob", "hero", "fallback_only", "Slot 1 hero idle bob."),
  "hero.rangerA.run": entry("hero.rangerA.run", "hero_ranger_a_run_bob", "hero", "generated", "Slot 1 hero run bob.", {
    path: "assets/art/animations/heroes/hero_ranger_a_run_sheet.png",
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 4,
    layout: "horizontal",
    source: "procedural_seed_transform",
    integration: "candidate_only"
  }),
  "hero.rangerA.shoot": entry("hero.rangerA.shoot", "hero_ranger_a_shoot_recoil", "hero", "fallback_only", "Slot 1 hero shoot recoil."),
  "hero.rangerB.idle": entry("hero.rangerB.idle", "hero_ranger_b_idle_bob", "hero", "fallback_only", "Slot 2 hero idle bob."),
  "hero.rangerB.run": entry("hero.rangerB.run", "hero_ranger_b_run_bob", "hero", "generated", "Slot 2 hero run bob.", {
    path: "assets/art/animations/heroes/hero_ranger_b_run_sheet.png",
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 4,
    layout: "horizontal",
    source: "procedural_seed_transform",
    integration: "candidate_only"
  }),
  "hero.rangerB.shoot": entry("hero.rangerB.shoot", "hero_ranger_b_shoot_recoil", "hero", "fallback_only", "Slot 2 hero shoot recoil."),
  "plant.sunbloom.idle": entry("plant.sunbloom.idle", "plant_sunbloom_idle_pulse", "plant", "fallback_only", "Sunbloom idle pulse."),
  "plant.sunbloom.produce": entry("plant.sunbloom.produce", "plant_sunbloom_produce_pulse", "plant", "generated", "Sunbloom production pulse.", {
    path: "assets/art/animations/plants/plant_sunbloom_produce_sheet.png",
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 3,
    layout: "horizontal",
    source: "procedural_seed_transform",
    integration: "candidate_only"
  }),
  "plant.peashotter.idle": entry("plant.peashotter.idle", "plant_peashotter_idle", "plant", "fallback_only", "Peashotter idle hold."),
  "plant.peashotter.shoot": entry("plant.peashotter.shoot", "plant_peashotter_shoot_squash", "plant", "generated", "Peashotter shoot squash.", {
    path: "assets/art/animations/plants/plant_peashotter_shoot_sheet.png",
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 3,
    layout: "horizontal",
    source: "procedural_seed_transform",
    integration: "candidate_only"
  }),
  "plant.barkwall.healthy": entry("plant.barkwall.healthy", "plant_barkwall_healthy", "plant", "fallback_only", "Barkwall healthy stance."),
  "plant.barkwall.damaged": entry("plant.barkwall.damaged", "plant_barkwall_damaged_pulse", "plant", "fallback_only", "Barkwall damaged pulse."),
  "enemy.shambler.walk": entry("enemy.shambler.walk", "enemy_shambler_walk_wobble", "enemy", "generated", "Shambler walk wobble.", {
    path: "assets/art/animations/enemies/enemy_shambler_walk_sheet.png",
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 4,
    layout: "horizontal",
    source: "procedural_seed_transform",
    integration: "candidate_only"
  }),
  "enemy.runner.walk": entry("enemy.runner.walk", "enemy_runner_walk_wobble", "enemy", "generated", "Runner quick walk wobble.", {
    path: "assets/art/animations/enemies/enemy_runner_walk_sheet.png",
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 4,
    layout: "horizontal",
    source: "procedural_seed_transform",
    integration: "candidate_only"
  }),
  "enemy.brute.walk": entry("enemy.brute.walk", "enemy_brute_walk_wobble", "enemy", "generated", "Brute heavy walk wobble.", {
    path: "assets/art/animations/enemies/enemy_brute_walk_sheet.png",
    frameWidth: 160,
    frameHeight: 160,
    frameCount: 4,
    layout: "horizontal",
    source: "procedural_seed_transform",
    integration: "candidate_only"
  }),
  "boss.ironmaw.idle": entry("boss.ironmaw.idle", "boss_ironmaw_idle_breathe", "boss", "fallback_only", "Boss idle breathing motion."),
  "boss.ironmaw.chargeWindup": entry("boss.ironmaw.chargeWindup", "boss_ironmaw_charge_windup", "boss", "generated", "Boss charge windup pulse.", {
    path: "assets/art/animations/boss/boss_ironmaw_charge_windup_sheet.png",
    frameWidth: 512,
    frameHeight: 512,
    frameCount: 4,
    layout: "horizontal",
    source: "procedural_seed_transform",
    integration: "candidate_only"
  }),
  "fx.muzzleFlash": entry("fx.muzzleFlash", "fx_muzzle_flash_pop", "fx", "generated", "Muzzle flash sprite pop.", {
    path: "assets/art/animations/fx/fx_muzzle_flash_sheet.png",
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 4,
    layout: "horizontal",
    source: "procedural_seed_transform",
    integration: "candidate_only"
  }),
  "fx.hitSpark": entry("fx.hitSpark", "fx_hit_spark_pop", "fx", "generated", "Hit spark sprite pop.", {
    path: "assets/art/animations/fx/fx_hit_spark_sheet.png",
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 5,
    layout: "horizontal",
    source: "procedural_seed_transform",
    integration: "candidate_only"
  }),
  "fx.sunGain": entry("fx.sunGain", "fx_sun_gain_sparkle", "fx", "integrated", "Sun gain sparkle sprite pop."),
  "fx.plantPlace": entry("fx.plantPlace", "fx_plant_place_ring", "fx", "integrated", "Plant place ring sprite pop."),
  "fx.enemyDeath": entry("fx.enemyDeath", "fx_enemy_death_burst", "fx", "fallback_only", "Enemy death burst using available hit FX fallback."),
  "fx.bossWeakpoint": entry("fx.bossWeakpoint", "fx_boss_weakpoint_pulse", "fx", "generated", "Boss weak point pulse.", {
    path: "assets/art/animations/fx/fx_boss_weakpoint_sheet.png",
    frameWidth: 96,
    frameHeight: 96,
    frameCount: 4,
    layout: "horizontal",
    source: "procedural_seed_transform",
    integration: "candidate_only"
  }),
  "fx.bossChargeWarning": entry("fx.bossChargeWarning", "fx_boss_charge_warning_pulse", "fx", "generated", "Boss charge warning pulse.", {
    path: "assets/art/animations/fx/fx_boss_charge_warning_sheet.png",
    frameWidth: 128,
    frameHeight: 64,
    frameCount: 4,
    layout: "horizontal",
    source: "procedural_seed_transform",
    integration: "candidate_only"
  }),
  "fx.bossInterrupted": entry("fx.bossInterrupted", "fx_boss_interrupted_burst", "fx", "fallback_only", "Boss interrupt burst and screen shake.")
} as const satisfies Record<AnimationId, AnimationRegistryEntry>;

export function getAnimationEntry(animationId: AnimationId): AnimationRegistryEntry {
  return AnimationRegistryV01[animationId];
}

export function registerAnimations(_scene: Phaser.Scene): void {
  // Phase 13C uses static sprites plus code-driven tweens. This hook keeps the
  // scene integration stable for later sprite sheets while remaining safe when
  // no animation assets exist.
}

function entry(
  id: AnimationId,
  key: string,
  category: AnimationCategory,
  status: AnimationAssetStatus,
  description: string,
  candidateSheet?: AnimationCandidateSheet
): AnimationRegistryEntry {
  const entryValue: AnimationRegistryEntry = {
    id,
    key,
    category,
    priority: "P0",
    status,
    fallback: "code_tween",
    description
  };
  if (candidateSheet) {
    entryValue.candidateSheet = candidateSheet;
  }
  return entryValue;
}
