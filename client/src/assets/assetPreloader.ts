import type Phaser from "phaser";
import {
  UI_ASSET_IDS,
  UiAssetRegistry,
  getUiAssetPublicUrl,
  type UiAssetEntry,
  type UiAssetId
} from "./uiAssetRegistry";

const warnedMissingAssets = new Set<UiAssetId>();

export function preloadUiAssets(scene: Phaser.Scene): void {
  for (const assetId of UI_ASSET_IDS) {
    const entry = UiAssetRegistry[assetId];
    if (entry.status === "missing") {
      warnMissingUiAsset(entry);
      continue;
    }
    if (!scene.textures.exists(entry.key)) {
      scene.load.image(entry.key, getUiAssetPublicUrl(entry));
    }
  }
}

export function hasUiTexture(scene: Phaser.Scene, assetId: UiAssetId): boolean {
  return scene.textures.exists(UiAssetRegistry[assetId].key);
}

export function warnMissingUiAsset(entry: UiAssetEntry): void {
  if (warnedMissingAssets.has(entry.id)) {
    return;
  }
  warnedMissingAssets.add(entry.id);
  console.warn(`[ui-assets] Missing ${entry.id}; using Phaser Graphics fallback.`);
}
