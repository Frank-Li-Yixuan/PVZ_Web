import Phaser from "phaser";
import { hasUiTexture, warnMissingUiAsset } from "../assets/assetPreloader";
import { UiAssetRegistry, type UiAssetId } from "../assets/uiAssetRegistry";

export const BASE_WIDTH = 1280;
export const BASE_HEIGHT = 720;

export type UiPoint = {
  x: number;
  y: number;
};

export function getUiScale(scene: Phaser.Scene): number {
  return Math.min(scene.scale.width / BASE_WIDTH, scene.scale.height / BASE_HEIGHT);
}

export function toScreen(scene: Phaser.Scene, baseX: number, baseY: number): UiPoint {
  const scale = getUiScale(scene);
  return {
    x: scene.scale.width / 2 + (baseX - BASE_WIDTH / 2) * scale,
    y: scene.scale.height / 2 + (baseY - BASE_HEIGHT / 2) * scale
  };
}

export function addCoverBackground(scene: Phaser.Scene, assetId: UiAssetId, fallback: "main" | "save"): void {
  if (hasUiTexture(scene, assetId)) {
    const image = scene.add.image(scene.scale.width / 2, scene.scale.height / 2, UiAssetRegistry[assetId].key);
    const scale = Math.max(scene.scale.width / image.width, scene.scale.height / image.height);
    image.setScale(scale).setDepth(-100);
    return;
  }

  warnMissingUiAsset(UiAssetRegistry[assetId]);
  const graphics = scene.add.graphics().setDepth(-100);
  if (fallback === "main") {
    graphics.fillStyle(0x5da557, 1);
    graphics.fillRect(0, 0, scene.scale.width, scene.scale.height);
    graphics.fillStyle(0x8fd56a, 0.42);
    graphics.fillEllipse(scene.scale.width * 0.15, scene.scale.height * 0.75, scene.scale.width * 0.42, scene.scale.height * 0.28);
    graphics.fillStyle(0x33482d, 0.58);
    graphics.fillRoundedRect(0, scene.scale.height * 0.62, scene.scale.width, scene.scale.height * 0.38, 0);
    graphics.fillStyle(0xf8d56d, 0.22);
    graphics.fillCircle(scene.scale.width * 0.78, scene.scale.height * 0.2, scene.scale.height * 0.18);
  } else {
    graphics.fillStyle(0x486747, 1);
    graphics.fillRect(0, 0, scene.scale.width, scene.scale.height);
    graphics.fillStyle(0xd7bd72, 0.28);
    graphics.fillRoundedRect(
      scene.scale.width * 0.08,
      scene.scale.height * 0.12,
      scene.scale.width * 0.84,
      scene.scale.height * 0.76,
      28
    );
    graphics.fillStyle(0x223524, 0.42);
    graphics.fillRect(0, scene.scale.height * 0.72, scene.scale.width, scene.scale.height * 0.28);
  }
}

export function addFittedImage(
  scene: Phaser.Scene,
  assetId: UiAssetId,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
  depth = 0
): Phaser.GameObjects.Image | undefined {
  if (!hasUiTexture(scene, assetId)) {
    warnMissingUiAsset(UiAssetRegistry[assetId]);
    return undefined;
  }
  const image = scene.add.image(x, y, UiAssetRegistry[assetId].key).setDepth(depth);
  fitImageInto(image, maxWidth, maxHeight);
  return image;
}

export function fitImageInto(image: Phaser.GameObjects.Image, maxWidth: number, maxHeight: number): void {
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  image.setScale(scale);
}

export function addFallbackPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  fill = 0x21351f,
  stroke = 0xf0c94e,
  depth = 0
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics().setDepth(depth);
  graphics.fillStyle(fill, 0.92);
  graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, Math.min(28, height * 0.22));
  graphics.lineStyle(Math.max(2, Math.round(height * 0.04)), stroke, 0.94);
  graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, Math.min(28, height * 0.22));
  return graphics;
}

export function makeText(scene: Phaser.Scene, x: number, y: number, text: string, size: number, color = "#fff4cf") {
  return scene.add
    .text(x, y, text, {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: `${Math.round(size)}px`,
      color,
      stroke: "#2b1a0b",
      strokeThickness: Math.max(2, Math.round(size / 10))
    })
    .setOrigin(0.5);
}
