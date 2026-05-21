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

export type AnimationRegistryEntry = {
  id: AnimationId;
  key: string;
  category: AnimationCategory;
  priority: AnimationPriority;
  status: AnimationAssetStatus;
  fallback: AnimationFallback;
  description: string;
};

export const AnimationRegistryV01 = {
  "hero.rangerA.idle": entry("hero.rangerA.idle", "hero_ranger_a_idle_bob", "hero", "fallback_only", "Slot 1 hero idle bob."),
  "hero.rangerA.run": entry("hero.rangerA.run", "hero_ranger_a_run_bob", "hero", "fallback_only", "Slot 1 hero run bob."),
  "hero.rangerA.shoot": entry("hero.rangerA.shoot", "hero_ranger_a_shoot_recoil", "hero", "fallback_only", "Slot 1 hero shoot recoil."),
  "hero.rangerB.idle": entry("hero.rangerB.idle", "hero_ranger_b_idle_bob", "hero", "fallback_only", "Slot 2 hero idle bob."),
  "hero.rangerB.run": entry("hero.rangerB.run", "hero_ranger_b_run_bob", "hero", "fallback_only", "Slot 2 hero run bob."),
  "hero.rangerB.shoot": entry("hero.rangerB.shoot", "hero_ranger_b_shoot_recoil", "hero", "fallback_only", "Slot 2 hero shoot recoil."),
  "plant.sunbloom.idle": entry("plant.sunbloom.idle", "plant_sunbloom_idle_pulse", "plant", "fallback_only", "Sunbloom idle pulse."),
  "plant.sunbloom.produce": entry("plant.sunbloom.produce", "plant_sunbloom_produce_pulse", "plant", "fallback_only", "Sunbloom production pulse."),
  "plant.peashotter.idle": entry("plant.peashotter.idle", "plant_peashotter_idle", "plant", "fallback_only", "Peashotter idle hold."),
  "plant.peashotter.shoot": entry("plant.peashotter.shoot", "plant_peashotter_shoot_squash", "plant", "fallback_only", "Peashotter shoot squash."),
  "plant.barkwall.healthy": entry("plant.barkwall.healthy", "plant_barkwall_healthy", "plant", "fallback_only", "Barkwall healthy stance."),
  "plant.barkwall.damaged": entry("plant.barkwall.damaged", "plant_barkwall_damaged_pulse", "plant", "fallback_only", "Barkwall damaged pulse."),
  "enemy.shambler.walk": entry("enemy.shambler.walk", "enemy_shambler_walk_wobble", "enemy", "fallback_only", "Shambler walk wobble."),
  "enemy.runner.walk": entry("enemy.runner.walk", "enemy_runner_walk_wobble", "enemy", "fallback_only", "Runner quick walk wobble."),
  "enemy.brute.walk": entry("enemy.brute.walk", "enemy_brute_walk_wobble", "enemy", "fallback_only", "Brute heavy walk wobble."),
  "boss.ironmaw.idle": entry("boss.ironmaw.idle", "boss_ironmaw_idle_breathe", "boss", "fallback_only", "Boss idle breathing motion."),
  "boss.ironmaw.chargeWindup": entry("boss.ironmaw.chargeWindup", "boss_ironmaw_charge_windup", "boss", "fallback_only", "Boss charge windup pulse."),
  "fx.muzzleFlash": entry("fx.muzzleFlash", "fx_muzzle_flash_pop", "fx", "integrated", "Muzzle flash sprite pop."),
  "fx.hitSpark": entry("fx.hitSpark", "fx_hit_spark_pop", "fx", "integrated", "Hit spark sprite pop."),
  "fx.sunGain": entry("fx.sunGain", "fx_sun_gain_sparkle", "fx", "integrated", "Sun gain sparkle sprite pop."),
  "fx.plantPlace": entry("fx.plantPlace", "fx_plant_place_ring", "fx", "integrated", "Plant place ring sprite pop."),
  "fx.enemyDeath": entry("fx.enemyDeath", "fx_enemy_death_burst", "fx", "fallback_only", "Enemy death burst using available hit FX fallback."),
  "fx.bossWeakpoint": entry("fx.bossWeakpoint", "fx_boss_weakpoint_pulse", "fx", "integrated", "Boss weak point pulse."),
  "fx.bossChargeWarning": entry("fx.bossChargeWarning", "fx_boss_charge_warning_pulse", "fx", "integrated", "Boss charge warning pulse."),
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
  description: string
): AnimationRegistryEntry {
  return {
    id,
    key,
    category,
    priority: "P0",
    status,
    fallback: "code_tween",
    description
  };
}
