import Phaser from "phaser";
import { preloadUiAssets, hasUiTexture } from "../assets/assetPreloader";
import { UiAssetKeys, UiAssetRegistry, type UiAssetId } from "../assets/uiAssetRegistry";
import {
  addCoverBackground,
  addFallbackPanel,
  addFittedImage,
  fitImageInto,
  getUiScale,
  makeText,
  toScreen
} from "./uiSceneHelpers";

export class MainMenuScene extends Phaser.Scene {
  private settingsOverlay: Phaser.GameObjects.Container | undefined;

  constructor() {
    super("MainMenuScene");
  }

  preload(): void {
    preloadUiAssets(this);
  }

  create(): void {
    document.body.dataset.uiFlow = "menu";
    this.cameras.main.setBackgroundColor("#050805");
    addCoverBackground(this, UiAssetKeys.mainMenuBackground, "main");

    const uiScale = getUiScale(this);
    const titleBackplate = toScreen(this, 640, 150);
    addFittedImage(this, UiAssetKeys.titleBackplate, titleBackplate.x, titleBackplate.y, 720 * uiScale, 230 * uiScale, 2) ??
      addFallbackPanel(this, titleBackplate.x, titleBackplate.y, 720 * uiScale, 180 * uiScale, 0x5f3b16, 0xf4c84d, 2);

    const titleLogo = addFittedImage(
      this,
      UiAssetKeys.titleLogo,
      toScreen(this, 640, 132).x,
      toScreen(this, 640, 132).y,
      520 * uiScale,
      165 * uiScale,
      4
    );
    if (titleLogo) {
      this.tweens.add({
        targets: titleLogo,
        y: titleLogo.y - 6 * uiScale,
        duration: 2400,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    } else {
      makeText(this, titleBackplate.x, titleBackplate.y - 14 * uiScale, "PVE联机版", 58 * uiScale).setDepth(4);
    }

    const dividerPoint = toScreen(this, 640, 250);
    addFittedImage(this, UiAssetKeys.dividerHorizontal, dividerPoint.x, dividerPoint.y, 560 * uiScale, 46 * uiScale, 3);

    const panelPoint = toScreen(this, 640, 450);
    addFittedImage(this, UiAssetKeys.mainMenuButtonPanel, panelPoint.x, panelPoint.y, 410 * uiScale, 430 * uiScale, 1) ??
      addFallbackPanel(this, panelPoint.x, panelPoint.y, 410 * uiScale, 380 * uiScale, 0x22351d, 0xe8c64d, 1);

    this.createButton({
      x: toScreen(this, 640, 388).x,
      y: toScreen(this, 640, 388).y,
      width: 390 * uiScale,
      height: 120 * uiScale,
      normal: UiAssetKeys.startButtonNormal,
      hover: UiAssetKeys.startButtonHover,
      pressed: UiAssetKeys.startButtonPressed,
      fallbackText: "开始游戏",
      onClick: () => this.scene.start("SaveSelectScene")
    });

    this.createButton({
      x: toScreen(this, 640, 505).x,
      y: toScreen(this, 640, 505).y,
      width: 300 * uiScale,
      height: 95 * uiScale,
      normal: UiAssetKeys.settingsButtonNormal,
      hover: UiAssetKeys.settingsButtonHover,
      pressed: UiAssetKeys.settingsButtonPressed,
      fallbackText: "设置",
      onClick: () => this.openSettingsOverlay()
    });

    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-ESC", this.closeSettingsOverlay, this);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off("keydown-ESC", this.closeSettingsOverlay, this);
    });
  }

  private createButton(config: {
    x: number;
    y: number;
    width: number;
    height: number;
    normal: UiAssetId;
    hover: UiAssetId;
    pressed: UiAssetId;
    fallbackText: string;
    onClick: () => void;
  }): void {
    if (!hasUiTexture(this, config.normal)) {
      const fallback = addFallbackPanel(this, config.x, config.y, config.width, config.height, 0x4f8d2f, 0xf2c94c, 10);
      const label = makeText(this, config.x, config.y, config.fallbackText, config.height * 0.33).setDepth(11);
      const zone = this.add.zone(config.x, config.y, config.width, config.height).setInteractive({ useHandCursor: true });
      zone.on("pointerover", () => {
        fallback.setScale(1.03);
        label.setScale(1.03);
      });
      zone.on("pointerout", () => {
        fallback.setScale(1);
        label.setScale(1);
      });
      zone.on("pointerdown", () => {
        fallback.setScale(0.97);
        label.setScale(0.97);
      });
      zone.on("pointerup", config.onClick);
      return;
    }

    const image = this.add.image(config.x, config.y, UiAssetRegistry[config.normal].key).setDepth(10);
    const applyState = (assetId: UiAssetId, visualScale: number): void => {
      const resolved = hasUiTexture(this, assetId) ? assetId : config.normal;
      image.setTexture(UiAssetRegistry[resolved].key);
      fitImageInto(image, config.width, config.height);
      image.setScale(image.scaleX * visualScale, image.scaleY * visualScale);
    };

    applyState(config.normal, 1);
    image.setInteractive({ useHandCursor: true });
    image.on("pointerover", () => applyState(config.hover, 1.03));
    image.on("pointerout", () => applyState(config.normal, 1));
    image.on("pointerdown", () => applyState(config.pressed, 0.97));
    image.on("pointerup", () => {
      applyState(config.hover, 1.03);
      config.onClick();
    });
  }

  private openSettingsOverlay(): void {
    if (this.settingsOverlay) {
      return;
    }

    const { width, height } = this.scale;
    const uiScale = getUiScale(this);
    const overlay = this.add.container(0, 0).setDepth(1000);
    const outside = this.add.rectangle(0, 0, width, height, 0x000000, 0.58).setOrigin(0).setInteractive();
    outside.on("pointerdown", () => this.closeSettingsOverlay());
    overlay.add(outside);

    const panelWidth = Math.min(560 * uiScale, width - 64 * uiScale);
    const panelHeight = Math.min(310 * uiScale, height - 80 * uiScale);
    const panelX = width / 2;
    const panelY = height / 2;
    const panelImage = addFittedImage(this, UiAssetKeys.darkOverlayPanel, panelX, panelY, panelWidth, panelHeight, 1001);
    if (panelImage) {
      overlay.add(panelImage);
    } else {
      overlay.add(addFallbackPanel(this, panelX, panelY, panelWidth, panelHeight, 0x1d1d28, 0xe7b84a, 1001));
    }

    const blocker = this.add.zone(panelX, panelY, panelWidth, panelHeight).setInteractive();
    blocker.on("pointerdown", (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
    });
    overlay.add(blocker);

    overlay.add(makeText(this, panelX, panelY - 58 * uiScale, "设置", 42 * uiScale).setDepth(1002));
    overlay.add(makeText(this, panelX, panelY + 4 * uiScale, "暂未开放", 28 * uiScale, "#f2e6c8").setDepth(1002));
    overlay.add(makeText(this, panelX, panelY + 72 * uiScale, "按 ESC 返回", 18 * uiScale, "#d5c59c").setDepth(1002));

    const closeText = makeText(this, panelX, panelY + 116 * uiScale, "关闭", 22 * uiScale, "#fff2a6")
      .setDepth(1002)
      .setInteractive({ useHandCursor: true });
    closeText.on("pointerup", () => this.closeSettingsOverlay());
    overlay.add(closeText);

    this.settingsOverlay = overlay;
  }

  private closeSettingsOverlay(): void {
    this.settingsOverlay?.destroy(true);
    this.settingsOverlay = undefined;
  }
}
