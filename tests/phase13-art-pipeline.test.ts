import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  ART_ASSET_STATUS_VALUES,
  ArtAssetRegistryV01,
  P0_ART_ASSET_IDS,
  getBossAssetKey,
  getEnemyAssetKey,
  getFxAssetKey,
  getHeroAssetKey,
  getPlantAssetKey,
  getProjectileAssetKey,
  getUiIconAssetKey
} from "../client/src/assets/artAssetRegistry";
import { RenderScaleV01 } from "../client/src/assets/renderScaleV01";

const EXPECTED_P0_IDS = [
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
  "fx_boss_weakpoint"
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

describe("Phase 13 art asset registry", () => {
  test("registers every P0 gameplay asset with fallback metadata and safe paths", () => {
    expect(P0_ART_ASSET_IDS).toEqual(EXPECTED_P0_IDS);
    expect(ART_ASSET_STATUS_VALUES).toEqual([
      "missing",
      "placeholder",
      "prompt_ready",
      "generated",
      "integrated",
      "approved",
      "rejected"
    ]);

    for (const assetId of EXPECTED_P0_IDS) {
      const entry = ArtAssetRegistryV01[assetId];
      expect(entry).toMatchObject({
        id: assetId,
        priority: "P0",
        fallback: "phaser_graphics"
      });
      expect(["placeholder", "prompt_ready", "integrated", "generated", "approved"]).toContain(entry.status);
      expect(entry.key.length).toBeGreaterThan(0);
      expect(entry.path).toMatch(/^assets\/art\/(sprites|placeholders)\//);
      expect(entry.description.length).toBeGreaterThan(0);
      expectContainsNoExternalIpTerms(`${entry.id} ${entry.key} ${entry.path} ${entry.description}`);
    }
  });

  test("maps runtime entity types to centralized art asset keys", () => {
    expect(getHeroAssetKey(0)).toBe("hero_ranger_a");
    expect(getHeroAssetKey(1)).toBe("hero_ranger_b");
    expect(getPlantAssetKey("sunbloom")).toBe("plant_sunbloom");
    expect(getPlantAssetKey("peashotter")).toBe("plant_peashotter");
    expect(getPlantAssetKey("barkwall")).toBe("plant_barkwall");
    expect(getEnemyAssetKey("shambler")).toBe("enemy_shambler");
    expect(getEnemyAssetKey("runner")).toBe("enemy_runner");
    expect(getEnemyAssetKey("brute")).toBe("enemy_brute");
    expect(getBossAssetKey("ironmaw_siege_beast")).toBe("boss_ironmaw");
    expect(getProjectileAssetKey("hero_bullet")).toBe("projectile_hero_bullet");
    expect(getProjectileAssetKey("pea_projectile")).toBe("projectile_pea");
    expect(getUiIconAssetKey("sun")).toBe("ui_icon_sun");
    expect(getUiIconAssetKey("ammo")).toBe("ui_icon_ammo");
    expect(getUiIconAssetKey("hp")).toBe("ui_icon_hp");
    expect(getFxAssetKey("hit_spark")).toBe("fx_hit_spark");
    expect(getFxAssetKey("muzzle_flash")).toBe("fx_muzzle_flash");
    expect(getFxAssetKey("boss_weakpoint")).toBe("fx_boss_weakpoint");
  });
});

describe("Phase 13 render scale", () => {
  test("centralizes visible dimensions, anchors, and fallback colors by entity type", () => {
    expect(RenderScaleV01.heroes.slot0.width).toBeGreaterThan(0);
    expect(RenderScaleV01.heroes.slot1.height).toBeGreaterThan(0);
    expect(RenderScaleV01.plants.sunbloom.bodyRadius).toBeGreaterThan(0);
    expect(RenderScaleV01.plants.peashotter.bodyWidth).toBeGreaterThan(0);
    expect(RenderScaleV01.plants.barkwall.bodyHeight).toBeGreaterThan(0);
    expect(RenderScaleV01.enemies.shambler.width).toBeGreaterThan(0);
    expect(RenderScaleV01.enemies.runner.width).toBeLessThan(RenderScaleV01.enemies.brute.width);
    expect(RenderScaleV01.boss.width).toBeGreaterThan(RenderScaleV01.enemies.brute.width);
    expect(RenderScaleV01.projectiles.hero_bullet.radius).toBeGreaterThan(0);
    expect(RenderScaleV01.projectiles.pea_projectile.radius).toBeGreaterThan(0);
    expect(RenderScaleV01.map.laneCornerRadius).toBeGreaterThan(0);
    expect(RenderScaleV01.ui.iconSize).toBeGreaterThan(0);
    expect(RenderScaleV01.fx.bossWeakPointRadius).toBeGreaterThan(0);
  });
});

describe("Phase 13 art pipeline docs", () => {
  test("documents prompt-ready Batch A and status tracking for every P0 asset", () => {
    const promptPath = resolve(process.cwd(), "assets/art/source_prompts/image_gen_prompts_v0_1.md");
    const statusPath = resolve(process.cwd(), "assets/docs/asset_status_v0_1.md");

    expect(existsSync(promptPath)).toBe(true);
    expect(existsSync(statusPath)).toBe(true);

    const promptDoc = readFileSync(promptPath, "utf8");
    const statusDoc = readFileSync(statusPath, "utf8");

    expect(promptDoc).toContain("Batch A");
    expect(promptDoc).toContain("Original IP constraints");
    expect(promptDoc).toContain("transparent background");
    expect(promptDoc).toContain("No text, no watermark, no logo");
    expectContainsNoExternalIpTerms(promptDoc);

    for (const assetId of [
      "hero_ranger_a",
      "hero_ranger_b",
      "plant_sunbloom",
      "plant_peashotter",
      "plant_barkwall",
      "enemy_shambler",
      "enemy_runner",
      "enemy_brute",
      "boss_ironmaw"
    ]) {
      expect(promptDoc).toContain(assetId);
    }

    for (const status of ART_ASSET_STATUS_VALUES) {
      expect(statusDoc).toContain(status);
    }

    for (const assetId of EXPECTED_P0_IDS) {
      expect(statusDoc).toContain(assetId);
    }

    expectContainsNoExternalIpTerms(statusDoc);
  });
});

function expectContainsNoExternalIpTerms(value: string): void {
  for (const term of EXTERNAL_IP_TERMS) {
    expect(value).not.toContain(term);
  }
}
