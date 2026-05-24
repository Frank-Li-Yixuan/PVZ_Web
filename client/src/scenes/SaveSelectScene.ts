import Phaser from "phaser";
import { preloadUiAssets, hasUiTexture } from "../assets/assetPreloader";
import { UiAssetKeys, UiAssetRegistry, type UiAssetId } from "../assets/uiAssetRegistry";
import { SAVE_SELECTED_EVENT, setActiveSave } from "../save/ActiveSaveStore";
import { SaveManager, type SaveDataV01, type SaveSlotId, type SaveSlotState } from "../save/SaveManager";
import {
  addCoverBackground,
  addFallbackPanel,
  addFittedImage,
  getUiScale,
  makeText,
  toScreen
} from "./uiSceneHelpers";

export class SaveSelectScene extends Phaser.Scene {
  private readonly saveManager = new SaveManager();
  private readonly slotContainers: Phaser.GameObjects.Container[] = [];

  constructor() {
    super("SaveSelectScene");
  }

  preload(): void {
    preloadUiAssets(this);
  }

  create(): void {
    document.body.dataset.uiFlow = "save";
    this.cameras.main.setBackgroundColor("#07120a");
    addCoverBackground(this, UiAssetKeys.saveSelectBackground, "save");

    const uiScale = getUiScale(this);
    const framePoint = toScreen(this, 640, 380);
    addFittedImage(this, UiAssetKeys.saveSelectFrame, framePoint.x, framePoint.y, 1060 * uiScale, 635 * uiScale, 1) ??
      addFallbackPanel(this, framePoint.x, framePoint.y, 1040 * uiScale, 600 * uiScale, 0x5f4220, 0xf0c64e, 1);

    const titlePoint = toScreen(this, 640, 116);
    addFittedImage(this, UiAssetKeys.dividerHorizontal, titlePoint.x, titlePoint.y + 48 * uiScale, 520 * uiScale, 42 * uiScale, 2);
    makeText(this, titlePoint.x, titlePoint.y, "选择存档", 38 * uiScale).setDepth(3);

    this.renderSlots();
  }

  private renderSlots(): void {
    for (const container of this.slotContainers) {
      container.destroy(true);
    }
    this.slotContainers.length = 0;

    const uiScale = getUiScale(this);
    const slots = this.saveManager.getAllSlots();
    const slotWidth = Math.min(this.scale.width * 0.7, 760 * uiScale);
    const slotHeight = Math.max(96 * uiScale, 128 * uiScale);

    slots.forEach((slot, index) => {
      const point = toScreen(this, 640, 260 + index * 140);
      const container = this.add.container(point.x, point.y).setDepth(10 + index);
      this.slotContainers.push(container);
      this.renderSlot(container, slot, slotWidth, slotHeight);
    });
  }

  private renderSlot(
    container: Phaser.GameObjects.Container,
    slot: SaveSlotState,
    slotWidth: number,
    slotHeight: number
  ): void {
    const uiScale = getUiScale(this);
    const backgroundAsset = slot.exists ? UiAssetKeys.saveSlotFilledNoText : UiAssetKeys.saveSlotEmptyNoText;
    const background = this.addSlotBackground(backgroundAsset, slotWidth, slotHeight);
    container.add(background);

    if (slot.exists) {
      this.renderFilledSlot(container, slot, slotWidth, slotHeight, uiScale);
    } else {
      this.renderEmptySlot(container, slot.slotId, slotWidth, uiScale);
    }

    const zone = this.add.zone(0, 0, slotWidth, slotHeight).setInteractive({ useHandCursor: true });
    zone.on("pointerover", () => {
      container.setScale(1.015);
      if (background instanceof Phaser.GameObjects.Image) {
        background.setTint(0xffffdd);
      }
    });
    zone.on("pointerout", () => {
      container.setScale(1);
      if (background instanceof Phaser.GameObjects.Image) {
        background.clearTint();
      }
    });
    zone.on("pointerdown", () => container.setScale(0.99));
    zone.on("pointerup", () => this.selectSlot(slot.slotId));
    container.add(zone);
  }

  private addSlotBackground(
    assetId: UiAssetId,
    slotWidth: number,
    slotHeight: number
  ): Phaser.GameObjects.Image | Phaser.GameObjects.Graphics {
    if (hasUiTexture(this, assetId)) {
      return this.add.image(0, 0, UiAssetRegistry[assetId].key).setDisplaySize(slotWidth, slotHeight).setDepth(0);
    }
    return addFallbackPanel(this, 0, 0, slotWidth, slotHeight, 0x5f3f1d, 0xe9c34d, 0);
  }

  private renderEmptySlot(
    container: Phaser.GameObjects.Container,
    slotId: SaveSlotId,
    slotWidth: number,
    uiScale: number
  ): void {
    const plus = this.addIcon(UiAssetKeys.iconCreateSave, -slotWidth * 0.34, 0, 58 * uiScale, 58 * uiScale, 2);
    if (plus) {
      container.add(plus);
    }
    container.add(makeText(this, -slotWidth * 0.03, -4 * uiScale, "创建存档", 34 * uiScale).setDepth(3));
    container.add(makeText(this, slotWidth * 0.35, 32 * uiScale, `槽位 ${slotId}`, 16 * uiScale, "#5c3a17").setDepth(3));
  }

  private renderFilledSlot(
    container: Phaser.GameObjects.Container,
    save: SaveDataV01,
    slotWidth: number,
    slotHeight: number,
    uiScale: number
  ): void {
    const fileIcon = this.addIcon(UiAssetKeys.iconSaveFile, -slotWidth * 0.42, -20 * uiScale, 44 * uiScale, 44 * uiScale, 2);
    const playersIcon = this.addIcon(UiAssetKeys.iconTwoPlayers, -slotWidth * 0.42, 26 * uiScale, 42 * uiScale, 42 * uiScale, 2);
    if (fileIcon) {
      container.add(fileIcon);
    }
    if (playersIcon) {
      container.add(playersIcon);
    }

    const leftPanel = this.addLocalPanel(-slotWidth * 0.31, 0, slotWidth * 0.42, slotHeight * 0.66, 0xffefbd, 0.82);
    const rightPanel = this.addLocalPanel(slotWidth * 0.25, 0, slotWidth * 0.33, slotHeight * 0.62, 0xfff3c9, 0.76);
    container.add(leftPanel);
    container.add(rightPanel);

    const leftX = -slotWidth * 0.48;
    container.add(this.addSlotText(leftX, -slotHeight * 0.23, save.saveName, 20 * uiScale, "#3f2b18").setOrigin(0, 0.5));
    container.add(this.addSlotText(leftX, 0, `更新 ${formatDate(save.updatedAt)}`, 13 * uiScale, "#4d3923").setOrigin(0, 0.5));
    container.add(
      this.addSlotText(
        leftX,
        slotHeight * 0.22,
        `${save.players.playerA.displayName} / ${save.players.playerB.displayName}`,
        13 * uiScale,
        "#4d3923"
      ).setOrigin(0, 0.5)
    );

    const progress = `通关 ${save.progression.completedRuns} | ${save.world.currentStageId} | ${save.progression.lastResult ?? "未开始"}`;
    container.add(this.addSlotText(slotWidth * 0.1, slotHeight * 0.2, progress, 13 * uiScale, "#4d3923").setOrigin(0, 0.5));
    container.add(makeText(this, slotWidth * 0.28, -slotHeight * 0.17, "载入存档", 24 * uiScale, "#fff4cf").setDepth(4));
  }

  private addInfoTag(x: number, y: number, width: number, height: number): Phaser.GameObjects.Image | Phaser.GameObjects.Graphics {
    if (hasUiTexture(this, UiAssetKeys.smallInfoTag)) {
      return this.add.image(x, y, UiAssetRegistry[UiAssetKeys.smallInfoTag].key).setDisplaySize(width, height).setDepth(3);
    }
    return addFallbackPanel(this, x, y, width, height, 0x75501e, 0xf3d15a, 3);
  }

  private addLocalPanel(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    alpha: number
  ): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics().setDepth(3);
    graphics.fillStyle(color, alpha);
    graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, Math.max(8, height * 0.16));
    graphics.lineStyle(2, 0x75501e, 0.35);
    graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, Math.max(8, height * 0.16));
    return graphics;
  }

  private addSlotText(x: number, y: number, text: string, size: number, color: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        fontFamily: '"Microsoft YaHei", Arial, sans-serif',
        fontSize: `${Math.round(size)}px`,
        color,
        stroke: "#fff1c6",
        strokeThickness: Math.max(1, Math.round(size / 12))
      })
      .setDepth(4);
  }

  private addIcon(
    assetId: UiAssetId,
    x: number,
    y: number,
    maxWidth: number,
    maxHeight: number,
    depth: number
  ): Phaser.GameObjects.Image | undefined {
    if (!hasUiTexture(this, assetId)) {
      return undefined;
    }
    const icon = this.add.image(x, y, UiAssetRegistry[assetId].key).setDepth(depth);
    const scale = Math.min(maxWidth / icon.width, maxHeight / icon.height);
    icon.setScale(scale);
    return icon;
  }

  private selectSlot(slotId: SaveSlotId): void {
    const save = this.saveManager.loadSave(slotId) ?? this.saveManager.createSave(slotId);
    setActiveSave(save);
    this.renderSlots();

    this.time.delayedCall(140, () => {
      window.dispatchEvent(new CustomEvent<SaveDataV01>(SAVE_SELECTED_EVENT, { detail: save }));
      this.scene.start("BattleScene");
    });
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
