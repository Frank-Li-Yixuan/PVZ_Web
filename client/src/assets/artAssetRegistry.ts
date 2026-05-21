import type { BossType, EnemyType, PlantType, PlayerSlot, ProjectileType } from "@sprout-and-steel/shared";

export const ART_ASSET_STATUS_VALUES = [
  "missing",
  "placeholder",
  "prompt_ready",
  "generated",
  "integrated",
  "approved",
  "rejected"
] as const;

export type ArtAssetStatus = (typeof ART_ASSET_STATUS_VALUES)[number];

export const P0_ART_ASSET_IDS = [
  "hero_ranger_a",
  "hero_ranger_b",
  "plant_sunbloom",
  "plant_peashotter",
  "plant_barkwall",
  "enemy_shambler",
  "enemy_runner",
  "enemy_brute",
  "boss_ironmaw",
  "projectile_hero_bullet",
  "projectile_pea",
  "tile_ground_lane",
  "tile_plant_cell",
  "base_greenhouse_core",
  "ui_icon_sun",
  "ui_icon_ammo",
  "ui_icon_hp",
  "fx_hit_spark",
  "fx_muzzle_flash",
  "fx_sun_gain",
  "fx_plant_place",
  "fx_boss_weakpoint",
  "fx_boss_charge_warning"
] as const;

export type ArtAssetId = (typeof P0_ART_ASSET_IDS)[number];

export const BATCH_A_ART_ASSET_IDS = [
  "hero_ranger_a",
  "hero_ranger_b",
  "plant_sunbloom",
  "plant_peashotter",
  "plant_barkwall",
  "enemy_shambler",
  "enemy_runner",
  "enemy_brute",
  "boss_ironmaw"
] as const satisfies readonly ArtAssetId[];

export type BatchAArtAssetId = (typeof BATCH_A_ART_ASSET_IDS)[number];

export const BATCH_B_ART_ASSET_IDS = [
  "tile_ground_lane",
  "tile_plant_cell",
  "base_greenhouse_core",
  "projectile_hero_bullet",
  "projectile_pea",
  "fx_muzzle_flash",
  "fx_hit_spark",
  "fx_sun_gain",
  "fx_plant_place",
  "fx_boss_weakpoint",
  "fx_boss_charge_warning"
] as const satisfies readonly ArtAssetId[];

export type BatchBArtAssetId = (typeof BATCH_B_ART_ASSET_IDS)[number];
export type ArtAssetPriority = "P0";
export type ArtAssetCategory = "hero" | "plant" | "enemy" | "boss" | "projectile" | "map" | "base" | "ui" | "fx";
export type ArtAssetSource = "placeholder" | "image-gen" | "game-studio" | "manual";
export type ArtAssetFallback = "phaser_graphics";

export type ArtAssetEntry = {
  id: ArtAssetId;
  key: string;
  category: ArtAssetCategory;
  priority: ArtAssetPriority;
  status: ArtAssetStatus;
  source: ArtAssetSource;
  path: string;
  fallback: ArtAssetFallback;
  description: string;
};

export const ArtAssetRegistryV01 = {
  hero_ranger_a: entry({
    id: "hero_ranger_a",
    key: "hero_ranger_a_idle",
    category: "hero",
    status: "integrated",
    source: "image-gen",
    path: "assets/art/sprites/heroes/hero_ranger_a_idle.png",
    description: "Cool-accent greenhouse defender hero for player slot 1."
  }),
  hero_ranger_b: entry({
    id: "hero_ranger_b",
    key: "hero_ranger_b_idle",
    category: "hero",
    status: "integrated",
    source: "image-gen",
    path: "assets/art/sprites/heroes/hero_ranger_b_idle.png",
    description: "Warm-accent greenhouse defender hero for player slot 2."
  }),
  plant_sunbloom: entry({
    id: "plant_sunbloom",
    key: "plant_sunbloom_idle",
    category: "plant",
    status: "integrated",
    source: "image-gen",
    path: "assets/art/sprites/plants/plant_sunbloom_idle.png",
    description: "Solar economy plant with a glowing round energy core."
  }),
  plant_peashotter: entry({
    id: "plant_peashotter",
    key: "plant_peashotter_idle",
    category: "plant",
    status: "integrated",
    source: "image-gen",
    path: "assets/art/sprites/plants/plant_peashotter_idle.png",
    description: "Bio-seed launcher plant with a clear forward barrel silhouette."
  }),
  plant_barkwall: entry({
    id: "plant_barkwall",
    key: "plant_barkwall_idle",
    category: "plant",
    status: "integrated",
    source: "image-gen",
    path: "assets/art/sprites/plants/plant_barkwall_idle.png",
    description: "Defensive bark shield plant with a broad blocking profile."
  }),
  enemy_shambler: entry({
    id: "enemy_shambler",
    key: "enemy_shambler_idle",
    category: "enemy",
    status: "integrated",
    source: "image-gen",
    path: "assets/art/sprites/enemies/enemy_shambler_idle.png",
    description: "Standard polluted lane enemy with medium size and speed."
  }),
  enemy_runner: entry({
    id: "enemy_runner",
    key: "enemy_runner_idle",
    category: "enemy",
    status: "integrated",
    source: "image-gen",
    path: "assets/art/sprites/enemies/enemy_runner_idle.png",
    description: "Fast slim polluted enemy with a forward-leaning silhouette."
  }),
  enemy_brute: entry({
    id: "enemy_brute",
    key: "enemy_brute_idle",
    category: "enemy",
    status: "integrated",
    source: "image-gen",
    path: "assets/art/sprites/enemies/enemy_brute_idle.png",
    description: "Large armored polluted enemy with a heavy blocking profile."
  }),
  boss_ironmaw: entry({
    id: "boss_ironmaw",
    key: "boss_ironmaw_phase1",
    category: "boss",
    status: "integrated",
    source: "image-gen",
    path: "assets/art/sprites/boss/boss_ironmaw_phase1.png",
    description: "Final siege beast boss with rusted armor and a bright weak point."
  }),
  projectile_hero_bullet: entry({
    id: "projectile_hero_bullet",
    key: "projectile_hero_bullet",
    category: "projectile",
    status: "integrated",
    source: "manual",
    path: "assets/art/sprites/projectiles/projectile_hero_bullet.png",
    description: "Small bright hero bullet streak sprite."
  }),
  projectile_pea: entry({
    id: "projectile_pea",
    key: "projectile_pea",
    category: "projectile",
    status: "integrated",
    source: "manual",
    path: "assets/art/sprites/projectiles/projectile_pea.png",
    description: "Small green bio-energy plant projectile sprite."
  }),
  tile_ground_lane: entry({
    id: "tile_ground_lane",
    key: "tile_ground_lane",
    category: "map",
    status: "integrated",
    source: "manual",
    path: "assets/art/sprites/environment/tile_ground_lane.png",
    description: "Muted low-contrast lane ground tile used behind gameplay entities."
  }),
  tile_plant_cell: entry({
    id: "tile_plant_cell",
    key: "tile_plant_cell",
    category: "map",
    status: "integrated",
    source: "manual",
    path: "assets/art/sprites/environment/tile_plant_cell.png",
    description: "Subtle transparent plantable cell overlay."
  }),
  base_greenhouse_core: entry({
    id: "base_greenhouse_core",
    key: "base_greenhouse_core",
    category: "base",
    status: "integrated",
    source: "manual",
    path: "assets/art/sprites/environment/base_greenhouse_core.png",
    description: "Left-side greenhouse core base sprite."
  }),
  ui_icon_sun: entry({
    id: "ui_icon_sun",
    key: "ui_icon_sun",
    category: "ui",
    status: "placeholder",
    source: "placeholder",
    path: "assets/art/placeholders/ui/ui_icon_sun_placeholder.png",
    description: "Shared sunlight resource icon placeholder."
  }),
  ui_icon_ammo: entry({
    id: "ui_icon_ammo",
    key: "ui_icon_ammo",
    category: "ui",
    status: "placeholder",
    source: "placeholder",
    path: "assets/art/placeholders/ui/ui_icon_ammo_placeholder.png",
    description: "Hero ammo icon placeholder."
  }),
  ui_icon_hp: entry({
    id: "ui_icon_hp",
    key: "ui_icon_hp",
    category: "ui",
    status: "placeholder",
    source: "placeholder",
    path: "assets/art/placeholders/ui/ui_icon_hp_placeholder.png",
    description: "Health icon placeholder."
  }),
  fx_hit_spark: entry({
    id: "fx_hit_spark",
    key: "fx_hit_spark",
    category: "fx",
    status: "integrated",
    source: "manual",
    path: "assets/art/sprites/effects/fx_hit_spark.png",
    description: "Small bright hit spark effect sprite."
  }),
  fx_muzzle_flash: entry({
    id: "fx_muzzle_flash",
    key: "fx_muzzle_flash",
    category: "fx",
    status: "integrated",
    source: "manual",
    path: "assets/art/sprites/effects/fx_muzzle_flash.png",
    description: "Small orange-yellow muzzle flash effect sprite."
  }),
  fx_sun_gain: entry({
    id: "fx_sun_gain",
    key: "fx_sun_gain",
    category: "fx",
    status: "integrated",
    source: "manual",
    path: "assets/art/sprites/effects/fx_sun_gain.png",
    description: "Warm sunlight gain sparkle effect sprite."
  }),
  fx_plant_place: entry({
    id: "fx_plant_place",
    key: "fx_plant_place",
    category: "fx",
    status: "integrated",
    source: "manual",
    path: "assets/art/sprites/effects/fx_plant_place.png",
    description: "Soft green plant placement ring effect sprite."
  }),
  fx_boss_weakpoint: entry({
    id: "fx_boss_weakpoint",
    key: "fx_boss_weakpoint",
    category: "fx",
    status: "integrated",
    source: "manual",
    path: "assets/art/sprites/effects/fx_boss_weakpoint.png",
    description: "Bright boss weak point marker overlay sprite."
  }),
  fx_boss_charge_warning: entry({
    id: "fx_boss_charge_warning",
    key: "fx_boss_charge_warning",
    category: "fx",
    status: "integrated",
    source: "manual",
    path: "assets/art/sprites/effects/fx_boss_charge_warning.png",
    description: "High-visibility red-orange boss charge warning marker."
  })
} as const satisfies Record<ArtAssetId, ArtAssetEntry>;

const HERO_ASSET_BY_SLOT = {
  0: "hero_ranger_a",
  1: "hero_ranger_b"
} as const satisfies Record<PlayerSlot, ArtAssetId>;

const PLANT_ASSET_BY_TYPE = {
  sunbloom: "plant_sunbloom",
  peashotter: "plant_peashotter",
  barkwall: "plant_barkwall"
} as const satisfies Record<PlantType, ArtAssetId>;

const ENEMY_ASSET_BY_TYPE = {
  shambler: "enemy_shambler",
  runner: "enemy_runner",
  brute: "enemy_brute"
} as const satisfies Record<EnemyType, ArtAssetId>;

const BOSS_ASSET_BY_TYPE = {
  ironmaw_siege_beast: "boss_ironmaw"
} as const satisfies Record<BossType, ArtAssetId>;

const PROJECTILE_ASSET_BY_TYPE = {
  hero_bullet: "projectile_hero_bullet",
  pea_projectile: "projectile_pea"
} as const satisfies Record<ProjectileType, ArtAssetId>;

const UI_ICON_ASSET_BY_TYPE = {
  sun: "ui_icon_sun",
  ammo: "ui_icon_ammo",
  hp: "ui_icon_hp"
} as const satisfies Record<UiIconAssetType, ArtAssetId>;

const FX_ASSET_BY_TYPE = {
  hit_spark: "fx_hit_spark",
  muzzle_flash: "fx_muzzle_flash",
  sun_gain: "fx_sun_gain",
  plant_place: "fx_plant_place",
  boss_weakpoint: "fx_boss_weakpoint",
  boss_charge_warning: "fx_boss_charge_warning"
} as const satisfies Record<FxAssetType, ArtAssetId>;

export type UiIconAssetType = "sun" | "ammo" | "hp";
export type FxAssetType = "hit_spark" | "muzzle_flash" | "sun_gain" | "plant_place" | "boss_weakpoint" | "boss_charge_warning";

export function getHeroAssetKey(slot: PlayerSlot): ArtAssetId {
  return HERO_ASSET_BY_SLOT[slot];
}

export function getPlantAssetKey(plantType: PlantType): ArtAssetId {
  return PLANT_ASSET_BY_TYPE[plantType];
}

export function getEnemyAssetKey(enemyType: EnemyType): ArtAssetId {
  return ENEMY_ASSET_BY_TYPE[enemyType];
}

export function getBossAssetKey(bossType: BossType): ArtAssetId {
  return BOSS_ASSET_BY_TYPE[bossType];
}

export function getProjectileAssetKey(projectileType: ProjectileType): ArtAssetId {
  return PROJECTILE_ASSET_BY_TYPE[projectileType];
}

export function getUiIconAssetKey(iconType: UiIconAssetType): ArtAssetId {
  return UI_ICON_ASSET_BY_TYPE[iconType];
}

export function getFxAssetKey(fxType: FxAssetType): ArtAssetId {
  return FX_ASSET_BY_TYPE[fxType];
}

export function getArtAssetEntry(assetId: ArtAssetId): ArtAssetEntry {
  return ArtAssetRegistryV01[assetId];
}

export function getArtAssetPublicUrl(entry: ArtAssetEntry): string {
  return `/${entry.path.replace(/^assets\//, "")}`;
}

export function shouldLoadArtAssetImage(entry: ArtAssetEntry): boolean {
  return ["generated", "integrated", "approved"].includes(entry.status) && entry.path.startsWith("assets/art/sprites/");
}

function entry(config: Omit<ArtAssetEntry, "priority" | "fallback">): ArtAssetEntry {
  return {
    ...config,
    priority: "P0",
    fallback: "phaser_graphics"
  };
}
