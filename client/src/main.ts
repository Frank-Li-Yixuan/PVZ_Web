import Phaser from "phaser";
import { io } from "socket.io-client";
import {
  C2S,
  CombatNumbersV01,
  MapConfigV01,
  NetworkTimingV01,
  Phase0RuntimeConfig,
  PROJECT_NAME,
  PROJECT_VERSION,
  S2C,
  clampPointToMapBounds,
  getPlantCellAtWorldPoint,
  getPlantCellCenter,
  type ActionAcceptedPayload,
  type ActionRejectedPayload,
  type BossState,
  type BulletState,
  type DebugCommandPayload,
  type EnemyState,
  type EvolutionPath,
  type FeedbackEvent,
  type CreateRoomRequest,
  type EvolveRequestPayload,
  type GameStateSnapshot,
  type JoinRoomRequest,
  type MatchEndedPayload,
  type MatchPhaseChangedEvent,
  type MoveInputPayload,
  type BuyAmmoRequestPayload,
  type PlantRequestPayload,
  type PlantState,
  type PlantType,
  type PlayerState,
  type ReloadRequestPayload,
  type RoomCreatedPayload,
  type RoomErrorPayload,
  type RoomJoinedPayload,
  type RoomStatePayload,
  type ShootRequestPayload,
  type Vector2
} from "@sprout-and-steel/shared";
import { AudioManager } from "./audio/AudioManager";
import {
  audioEventIdFromActionRejected,
  audioEventIdFromMatchResult,
  audioEventIdsFromFeedback,
  type AudioEventId
} from "./audio/audioEvents";
import {
  ArtAssetRegistryV01,
  P0_ART_ASSET_IDS,
  type FxAssetType,
  getArtAssetPublicUrl,
  getBossAssetKey,
  getEnemyAssetKey,
  getFxAssetKey,
  getHeroAssetKey,
  getPlantAssetKey,
  getProjectileAssetKey,
  shouldLoadArtAssetImage
} from "./assets/artAssetRegistry";
import { RenderScaleV01 } from "./assets/renderScaleV01";
import "./styles.css";

let battleScene: BattleScene | undefined;
let sendMoveInput: (payload: MoveInputPayload) => void = () => {};
let sendAimInput: (worldPoint: Vector2) => void = () => {};
let sendPlantRequest: (payload: PlantRequestPayload) => void = () => {};
let sendShootRequest: (payload: ShootRequestPayload) => void = () => {};
let sendReloadRequest: (payload: ReloadRequestPayload) => void = () => {};
let sendBuyAmmoRequest: (payload: BuyAmmoRequestPayload) => void = () => {};
let sendEvolveRequest: (payload: EvolveRequestPayload) => void = () => {};
let sendDebugCommand: (payload: DebugCommandPayload) => void = () => {};
let getLocalPlayerId: () => string | undefined = () => undefined;
let selectedPlantType: PlantType = "sunbloom";
let evolutionPanelOpen = false;
let clientRequestSequence = 0;
let currentHoverCellLabel = "-";
const audioManager = new AudioManager();
audioManager.installUnlockListeners();

const PLANT_HOTKEYS = {
  ONE: "sunbloom",
  TWO: "peashotter",
  THREE: "barkwall"
} as const satisfies Record<"ONE" | "TWO" | "THREE", PlantType>;

const PLANT_LABELS: Record<PlantType, string> = {
  sunbloom: "1 Sunbloom",
  peashotter: "2 Peashotter",
  barkwall: "3 Barkwall"
};

class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create(): void {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#16201d");

    const graphics = this.add.graphics();
    graphics.fillStyle(0x23342e, 1);
    graphics.fillRoundedRect(84, 82, width - 168, height - 164, 18);
    graphics.lineStyle(2, 0x6f8d66, 0.7);
    graphics.strokeRoundedRect(84, 82, width - 168, height - 164, 18);

    graphics.fillStyle(0xf3c84b, 1);
    graphics.fillCircle(width / 2 - 290, 394, 36);
    graphics.fillStyle(0x64bf6a, 1);
    graphics.fillEllipse(width / 2 - 290, 440, 90, 32);

    graphics.fillStyle(0x55bdd2, 1);
    graphics.fillCircle(width / 2 + 290, 404, 30);
    graphics.lineStyle(8, 0xe8dfbd, 1);
    graphics.lineBetween(width / 2 + 310, 397, width / 2 + 376, 367);

    this.add
      .text(width / 2, 146, PROJECT_NAME, {
        fontFamily: "Arial, sans-serif",
        fontSize: "56px",
        color: "#f7f2df"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 212, "V0.1 Cooperative Plant Defense", {
        fontFamily: "Arial, sans-serif",
        fontSize: "22px",
        color: "#cfe4ca"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 306, `Phase 11 results UI build ${PROJECT_VERSION}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
        color: "#f3c84b"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 374, "Create or join a room to test plants, enemies, and hero ammo.", {
        fontFamily: "Arial, sans-serif",
        fontSize: "17px",
        color: "#d9e3d3"
      })
      .setOrigin(0.5);
  }
}

type MovementKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
};

type SnapshotBufferEntry = {
  snapshot: GameStateSnapshot;
  receivedAtMs: number;
};

type PlayerView = {
  body: Phaser.GameObjects.Ellipse;
  ring: Phaser.GameObjects.Ellipse;
  aim: Phaser.GameObjects.Graphics;
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
};

type PlantView = {
  graphics: Phaser.GameObjects.Graphics;
  sprite: Phaser.GameObjects.Image;
};

type EnemyView = {
  graphics: Phaser.GameObjects.Graphics;
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
};

type BulletView = {
  graphics: Phaser.GameObjects.Graphics;
  sprite: Phaser.GameObjects.Image;
};

type BossView = {
  graphics: Phaser.GameObjects.Graphics;
  sprite: Phaser.GameObjects.Image;
  weakPointSprite: Phaser.GameObjects.Image;
  chargeWarningSprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
};

type FeedbackFxSpec = {
  fxType: FxAssetType;
  height: number;
  width?: number;
  durationMs: number;
  alpha?: number;
  startScale?: number;
  endScale?: number;
  depth?: number;
  rotation?: number;
};

class BattleScene extends Phaser.Scene {
  private movementKeys: MovementKeys | undefined;
  private readonly playerViews = new Map<string, PlayerView>();
  private readonly plantViews = new Map<string, PlantView>();
  private readonly enemyViews = new Map<string, EnemyView>();
  private readonly bulletViews = new Map<string, BulletView>();
  private bossView: BossView | undefined;
  private readonly snapshotBuffer: SnapshotBufferEntry[] = [];
  private readonly localPredictedPositions = new Map<string, Vector2>();
  private hoverGraphics: Phaser.GameObjects.Graphics | undefined;
  private hoverCell: ReturnType<typeof getPlantCellAtWorldPoint>;
  private latestSnapshot: GameStateSnapshot | undefined;
  private baseHpText: Phaser.GameObjects.Text | undefined;
  private phaseBannerText: Phaser.GameObjects.Text | undefined;
  private lastInputSentAtMs = 0;
  private currentMoveDir: MoveInputPayload = { dirX: 0, dirY: 0 };

  constructor() {
    super("BattleScene");
  }

  preload(): void {
    for (const assetId of P0_ART_ASSET_IDS) {
      const entry = ArtAssetRegistryV01[assetId];
      if (shouldLoadArtAssetImage(entry)) {
        this.load.image(entry.key, getArtAssetPublicUrl(entry));
      }
    }
  }

  create(): void {
    battleScene = this;
    this.cameras.main.setBackgroundColor("#14201c");
    this.drawBattlefield();
    this.hoverGraphics = this.add.graphics().setDepth(12);

    if (this.input.keyboard) {
      this.movementKeys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
      }) as MovementKeys;
      this.input.keyboard.on("keydown-ONE", () => selectPlantType(PLANT_HOTKEYS.ONE));
      this.input.keyboard.on("keydown-TWO", () => selectPlantType(PLANT_HOTKEYS.TWO));
      this.input.keyboard.on("keydown-THREE", () => selectPlantType(PLANT_HOTKEYS.THREE));
      this.input.keyboard.on("keydown-E", () => this.trySendPlantRequest());
      this.input.keyboard.on("keydown-R", () => this.trySendReloadRequest());
      this.input.keyboard.on("keydown-Q", () => this.trySendBuyAmmoRequest());
      this.input.keyboard.on("keydown-F", () => toggleEvolutionPanel());
    }

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.trySendShootRequest(pointer);
      }
    });

    this.add
      .text(20, 18, `${PROJECT_NAME} V0.1`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
        color: "#f7f2df"
      })
      .setDepth(20);

    const width = MapConfigV01.worldWidthPx;
    this.phaseBannerText = this.add
      .text(width / 2, 84, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "28px",
        color: "#f7f2df",
        backgroundColor: "#101513"
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(45);
  }

  update(_time: number, deltaMs: number): void {
    this.captureAndSendInput();
    this.updatePlantHover();
    this.renderSnapshot(performance.now(), deltaMs / 1000);
  }

  pushSnapshot(snapshot: GameStateSnapshot): void {
    this.latestSnapshot = snapshot;
    this.snapshotBuffer.push({
      snapshot,
      receivedAtMs: performance.now()
    });

    for (const event of snapshot.events ?? []) {
      this.pushFeedback(event);
    }

    while (this.snapshotBuffer.length > 30) {
      this.snapshotBuffer.shift();
    }
  }

  pushFeedback(event: FeedbackEvent): void {
    playAudioEvents(audioEventIdsFromFeedback(event));

    const x = event.x ?? this.latestSnapshot?.players[0]?.x ?? MapConfigV01.worldWidthPx / 2;
    const y = event.y ?? this.latestSnapshot?.players[0]?.y ?? MapConfigV01.worldHeightPx / 2;
    this.showFeedbackFx(event, x, y);

    const label = feedbackLabel(event);
    if (!label) {
      return;
    }

    const text = this.add
      .text(x, y - 26, label.text, {
        fontFamily: "Arial, sans-serif",
        fontSize: label.size,
        color: label.color,
        backgroundColor: "#101513"
      })
      .setOrigin(0.5)
      .setDepth(40);

    this.tweens.add({
      targets: text,
      y: text.y - 22,
      alpha: 0,
      duration: label.durationMs,
      ease: "Sine.easeOut",
      onComplete: () => text.destroy()
    });
  }

  private showFeedbackFx(event: FeedbackEvent, x: number, y: number): void {
    const spec = feedbackFxSpec(event);
    if (!spec) {
      return;
    }

    const asset = ArtAssetRegistryV01[getFxAssetKey(spec.fxType)];
    if (!this.textures.exists(asset.key)) {
      return;
    }

    const sprite = this.add
      .image(x, y, asset.key)
      .setName(`${asset.key}_${event.eventType}`)
      .setDepth(spec.depth ?? 39)
      .setAlpha(spec.alpha ?? 0.95)
      .setRotation(spec.rotation ?? 0);
    if (spec.width !== undefined) {
      sprite.setDisplaySize(spec.width, spec.height);
    } else {
      fitImageToHeight(sprite, spec.height);
    }
    sprite.setScale(sprite.scaleX * (spec.startScale ?? 1), sprite.scaleY * (spec.startScale ?? 1));

    this.tweens.add({
      targets: sprite,
      alpha: 0,
      scaleX: sprite.scaleX * (spec.endScale ?? 1.25),
      scaleY: sprite.scaleY * (spec.endScale ?? 1.25),
      duration: spec.durationMs,
      ease: "Sine.easeOut",
      onComplete: () => sprite.destroy()
    });
  }

  showPhaseBanner(event: MatchPhaseChangedEvent): void {
    const banner = this.phaseBannerText;
    const text = phaseBannerLabel(event);
    if (!banner || !text) {
      return;
    }

    banner.setText(text);
    banner.setAlpha(1);
    this.tweens.killTweensOf(banner);
    this.tweens.add({
      targets: banner,
      alpha: 0,
      duration: 1300,
      delay: 750,
      ease: "Sine.easeOut"
    });
  }

  private drawBattlefield(): void {
    const graphics = this.add.graphics();
    const laneAsset = ArtAssetRegistryV01.tile_ground_lane;
    const cellAsset = ArtAssetRegistryV01.tile_plant_cell;
    const baseAsset = ArtAssetRegistryV01.base_greenhouse_core;
    const mapScale = RenderScaleV01.map;
    graphics.setName(`${laneAsset.key}_${cellAsset.key}_${baseAsset.key}`);

    graphics.fillStyle(mapScale.worldBackground, 1);
    graphics.fillRect(0, 0, MapConfigV01.worldWidthPx, MapConfigV01.worldHeightPx);

    const laneTextureExists = this.textures.exists(laneAsset.key);
    const cellTextureExists = this.textures.exists(cellAsset.key);
    const baseTextureExists = this.textures.exists(baseAsset.key);

    for (const laneIndex of MapConfigV01.laneIndices) {
      const laneY = MapConfigV01.plantGrid.originY + laneIndex * MapConfigV01.laneHeightPx;
      const laneX = MapConfigV01.plantGrid.originX - mapScale.laneInsetX;
      const laneTop = laneY + mapScale.laneInsetY;
      const laneWidth = MapConfigV01.cellWidthPx * MapConfigV01.plantableColumnCount + mapScale.laneInsetX * 2;
      const laneHeight = MapConfigV01.laneHeightPx - mapScale.laneInsetY * 2;
      if (laneTextureExists) {
        this.add
          .image(laneX + laneWidth / 2, laneTop + laneHeight / 2, laneAsset.key)
          .setName(`${laneAsset.key}_${laneIndex}`)
          .setDepth(1)
          .setDisplaySize(laneWidth, laneHeight)
          .setAlpha(laneIndex % 2 === 0 ? 0.94 : 0.86);
      } else {
        graphics.fillStyle(laneIndex % 2 === 0 ? mapScale.laneEvenColor : mapScale.laneOddColor, 1);
        graphics.fillRoundedRect(laneX, laneTop, laneWidth, laneHeight, mapScale.laneCornerRadius);
      }

      for (const columnIndex of MapConfigV01.columnIndices) {
        const x = MapConfigV01.plantGrid.originX + columnIndex * MapConfigV01.cellWidthPx;
        const cellX = x + mapScale.cellInsetX;
        const cellY = laneY + mapScale.cellInsetY;
        const cellWidth = MapConfigV01.cellWidthPx - mapScale.cellInsetX * 2;
        const cellHeight = MapConfigV01.laneHeightPx - mapScale.cellInsetY * 2;
        if (cellTextureExists) {
          this.add
            .image(cellX + cellWidth / 2, cellY + cellHeight / 2, cellAsset.key)
            .setName(`${cellAsset.key}_${laneIndex}_${columnIndex}`)
            .setDepth(2)
            .setDisplaySize(cellWidth, cellHeight)
            .setAlpha(0.72);
        } else {
          graphics.fillStyle(mapScale.cellFillColor, mapScale.cellFillAlpha);
          graphics.fillRoundedRect(cellX, cellY, cellWidth, cellHeight, mapScale.cellCornerRadius);
          graphics.lineStyle(1, mapScale.cellOutlineColor, mapScale.cellOutlineAlpha);
          graphics.strokeRoundedRect(cellX, cellY, cellWidth, cellHeight, mapScale.cellCornerRadius);
        }
      }
    }

    if (baseTextureExists) {
      this.add
        .image(MapConfigV01.base.centerX, MapConfigV01.base.centerY + 2, baseAsset.key)
        .setName(baseAsset.key)
        .setDepth(6)
        .setDisplaySize(MapConfigV01.base.width + 42, MapConfigV01.base.height + 28);
    } else {
      graphics.fillStyle(mapScale.baseFillColor, 1);
      graphics.fillRoundedRect(
        MapConfigV01.base.centerX - MapConfigV01.base.width / 2,
        MapConfigV01.base.centerY - MapConfigV01.base.height / 2,
        MapConfigV01.base.width,
        MapConfigV01.base.height,
        8
      );
      graphics.lineStyle(3, mapScale.baseOutlineColor, 0.7);
      graphics.strokeRoundedRect(
        MapConfigV01.base.centerX - MapConfigV01.base.width / 2,
        MapConfigV01.base.centerY - MapConfigV01.base.height / 2,
        MapConfigV01.base.width,
        MapConfigV01.base.height,
        8
      );
    }

    graphics.fillStyle(mapScale.spawnFillColor, 1);
    graphics.fillRoundedRect(
      MapConfigV01.enemySpawnMarker.centerX - MapConfigV01.enemySpawnMarker.width / 2,
      MapConfigV01.enemySpawnMarker.centerY - MapConfigV01.enemySpawnMarker.height / 2,
      MapConfigV01.enemySpawnMarker.width,
      MapConfigV01.enemySpawnMarker.height,
      6
    );

    this.add
      .text(MapConfigV01.base.centerX, 58, "BASE", {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#f7f2df"
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.baseHpText = this.add
      .text(MapConfigV01.base.centerX, MapConfigV01.base.centerY - MapConfigV01.base.height / 2 - 18, "HP -", {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#f7f2df",
        backgroundColor: "#101513"
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.add
      .text(MapConfigV01.enemySpawnMarker.centerX, 58, "SPAWN", {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#ffbfcc"
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  private captureAndSendInput(): void {
    const nowMs = performance.now();
    if (nowMs - this.lastInputSentAtMs < 1000 / NetworkTimingV01.clientInputRate) {
      return;
    }
    this.lastInputSentAtMs = nowMs;

    const move = this.readMovementInput();
    this.currentMoveDir = move;
    sendMoveInput(move);

    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    sendAimInput({ x: worldPoint.x, y: worldPoint.y });
  }

  private readMovementInput(): MoveInputPayload {
    if (!this.movementKeys) {
      return { dirX: 0, dirY: 0 };
    }

    return {
      dirX: Number(this.movementKeys.right.isDown) - Number(this.movementKeys.left.isDown),
      dirY: Number(this.movementKeys.down.isDown) - Number(this.movementKeys.up.isDown)
    };
  }

  private renderSnapshot(nowMs: number, deltaSeconds: number): void {
    const snapshot = this.latestSnapshot;
    if (!snapshot) {
      return;
    }

    const localPlayerId = getLocalPlayerId();
    const renderedPlayerIds = new Set<string>();

    for (const player of snapshot.players) {
      const renderPlayer =
        player.playerId === localPlayerId
          ? this.getLocalPredictedPlayer(player, deltaSeconds)
          : this.getInterpolatedRemotePlayer(player.playerId, nowMs) ?? player;

      this.renderPlayer(renderPlayer, player.playerId === localPlayerId);
      renderedPlayerIds.add(player.playerId);
    }

    for (const [playerId, view] of this.playerViews) {
      if (!renderedPlayerIds.has(playerId)) {
        view.body.destroy();
        view.ring.destroy();
        view.aim.destroy();
        view.sprite.destroy();
        view.label.destroy();
        this.playerViews.delete(playerId);
        this.localPredictedPositions.delete(playerId);
      }
    }

    this.renderPlants(snapshot.plants);
    this.renderEnemies(snapshot.enemies);
    this.renderBullets(snapshot.bullets);
    this.renderBoss(snapshot.boss);
    this.renderBase(snapshot);
    this.renderHoverHighlight(snapshot);
  }

  private getLocalPredictedPlayer(player: PlayerState, deltaSeconds: number): PlayerState {
    const predicted = this.localPredictedPositions.get(player.playerId) ?? { x: player.x, y: player.y };
    const normalized = normalizeInput(this.currentMoveDir);
    const moved = clampPointToMapBounds(
      {
        x: predicted.x + normalized.x * CombatNumbersV01.hero.moveSpeed * deltaSeconds,
        y: predicted.y + normalized.y * CombatNumbersV01.hero.moveSpeed * deltaSeconds
      },
      CombatNumbersV01.hero.collisionRadius
    );
    const corrected = {
      x: Phaser.Math.Linear(moved.x, player.x, 0.18),
      y: Phaser.Math.Linear(moved.y, player.y, 0.18)
    };
    this.localPredictedPositions.set(player.playerId, corrected);

    return {
      ...player,
      x: corrected.x,
      y: corrected.y
    };
  }

  private getInterpolatedRemotePlayer(playerId: string, nowMs: number): PlayerState | undefined {
    const latestEntry = this.snapshotBuffer.at(-1);
    if (!latestEntry) {
      return undefined;
    }

    const estimatedServerNowMs = latestEntry.snapshot.serverTimeMs + (nowMs - latestEntry.receivedAtMs);
    const renderServerTimeMs = estimatedServerNowMs - NetworkTimingV01.interpolationDelayMs;
    let previous: SnapshotBufferEntry | undefined;
    let next: SnapshotBufferEntry | undefined;

    for (const entry of this.snapshotBuffer) {
      if (entry.snapshot.serverTimeMs <= renderServerTimeMs) {
        previous = entry;
      }
      if (entry.snapshot.serverTimeMs >= renderServerTimeMs) {
        next = entry;
        break;
      }
    }

    const previousPlayer = previous?.snapshot.players.find((player) => player.playerId === playerId);
    const nextPlayer = next?.snapshot.players.find((player) => player.playerId === playerId);
    if (!previous || !next || !previousPlayer || !nextPlayer || previous === next) {
      return nextPlayer ?? previousPlayer;
    }

    const durationMs = next.snapshot.serverTimeMs - previous.snapshot.serverTimeMs;
    const t = durationMs <= 0 ? 0 : Phaser.Math.Clamp((renderServerTimeMs - previous.snapshot.serverTimeMs) / durationMs, 0, 1);

    return {
      ...nextPlayer,
      x: Phaser.Math.Linear(previousPlayer.x, nextPlayer.x, t),
      y: Phaser.Math.Linear(previousPlayer.y, nextPlayer.y, t),
      aimX: Phaser.Math.Linear(previousPlayer.aimX, nextPlayer.aimX, t),
      aimY: Phaser.Math.Linear(previousPlayer.aimY, nextPlayer.aimY, t)
    };
  }

  private renderPlayer(player: PlayerState, isLocal: boolean): void {
    const view = this.getPlayerView(player);
    const asset = ArtAssetRegistryV01[getHeroAssetKey(player.slot)];
    const renderScale = player.slot === 0 ? RenderScaleV01.heroes.slot0 : RenderScaleV01.heroes.slot1;
    const bodyColor = renderScale.color;
    const hasSprite = this.textures.exists(asset.key);

    view.sprite.setTexture(asset.key);
    view.sprite.setVisible(hasSprite);
    if (hasSprite) {
      view.sprite.setPosition(player.x, player.y + 3);
      view.sprite.setOrigin(0.5, 0.68);
      fitImageToHeight(view.sprite, renderScale.spriteHeight);
    }

    view.body.setVisible(!hasSprite);
    view.body.setName(asset.key);
    view.body.setFillStyle(bodyColor, isLocal ? 1 : 0.82);
    view.body.setPosition(player.x, player.y);
    view.ring.setPosition(player.x, player.y);
    view.ring.setStrokeStyle(isLocal ? 3 : 2, isLocal ? 0xf7f2df : 0x1d2521, 0.9);
    view.label.setText(isLocal ? `P${player.slot + 1} YOU` : `P${player.slot + 1}`);
    view.label.setPosition(player.x, player.y + renderScale.labelOffsetY);

    view.aim.clear();
    view.aim.lineStyle(3, bodyColor, 0.9);
    view.aim.lineBetween(
      player.x,
      player.y,
      player.x + player.aimX * renderScale.aimLength,
      player.y + player.aimY * renderScale.aimLength
    );
  }

  private getPlayerView(player: PlayerState): PlayerView {
    const existing = this.playerViews.get(player.playerId);
    if (existing) {
      return existing;
    }

    const asset = ArtAssetRegistryV01[getHeroAssetKey(player.slot)];
    const renderScale = player.slot === 0 ? RenderScaleV01.heroes.slot0 : RenderScaleV01.heroes.slot1;
    const aim = this.add.graphics().setDepth(14).setName(`${asset.key}_aim`);
    const ring = this.add.ellipse(player.x, player.y, renderScale.ringWidth, renderScale.ringHeight).setDepth(15);
    const body = this.add.ellipse(player.x, player.y, renderScale.width, renderScale.height).setDepth(16).setName(asset.key);
    const sprite = this.add.image(player.x, player.y, asset.key).setDepth(16).setVisible(false);
    const label = this.add
      .text(player.x, player.y + renderScale.labelOffsetY, `P${player.slot + 1}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        color: "#f7f2df",
        backgroundColor: RenderScaleV01.ui.textBackground
      })
      .setOrigin(0.5)
      .setDepth(17);
    const view = { body, ring, aim, sprite, label };
    this.playerViews.set(player.playerId, view);
    return view;
  }

  private updatePlantHover(): void {
    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const nextCell = getPlantCellAtWorldPoint(worldPoint);
    const nextLabel = nextCell ? `Lane ${nextCell.laneIndex + 1}, Col ${nextCell.columnIndex + 1}` : "-";

    this.hoverCell = nextCell;
    if (currentHoverCellLabel !== nextLabel) {
      currentHoverCellLabel = nextLabel;
      renderMatchDebug();
    }
  }

  private trySendPlantRequest(): void {
    if (isTextInputFocused()) {
      return;
    }

    if (!this.hoverCell) {
      showActionToast("No plantable cell selected.");
      return;
    }

    sendPlantRequest({
      requestId: createClientRequestId(),
      plantType: selectedPlantType,
      laneIndex: this.hoverCell.laneIndex,
      columnIndex: this.hoverCell.columnIndex
    });
  }

  private trySendShootRequest(pointer: Phaser.Input.Pointer): void {
    if (isTextInputFocused()) {
      return;
    }

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    sendShootRequest({
      requestId: createClientRequestId(),
      aimWorldX: worldPoint.x,
      aimWorldY: worldPoint.y
    });
  }

  private trySendReloadRequest(): void {
    if (isTextInputFocused()) {
      return;
    }

    sendReloadRequest({
      requestId: createClientRequestId()
    });
  }

  private trySendBuyAmmoRequest(): void {
    if (isTextInputFocused()) {
      return;
    }

    sendBuyAmmoRequest({
      requestId: createClientRequestId()
    });
  }

  private renderPlants(plants: PlantState[]): void {
    const renderedPlantIds = new Set<string>();

    for (const plant of plants) {
      const view = this.getPlantView(plant);
      const asset = ArtAssetRegistryV01[getPlantAssetKey(plant.type)];
      if (this.textures.exists(asset.key)) {
        renderPlantSprite(view, plant, asset.key);
      } else {
        view.sprite.setVisible(false);
        drawPlantPlaceholder(view.graphics, plant);
      }
      renderedPlantIds.add(plant.id);
    }

    for (const [plantId, view] of this.plantViews) {
      if (!renderedPlantIds.has(plantId)) {
        view.graphics.destroy();
        view.sprite.destroy();
        this.plantViews.delete(plantId);
      }
    }
  }

  private renderEnemies(enemies: EnemyState[]): void {
    const renderedEnemyIds = new Set<string>();

    for (const enemy of enemies) {
      const view = this.getEnemyView(enemy);
      const asset = ArtAssetRegistryV01[getEnemyAssetKey(enemy.type)];
      if (this.textures.exists(asset.key)) {
        renderEnemySprite(view, enemy, asset.key);
      } else {
        view.sprite.setVisible(false);
        drawEnemyPlaceholder(view.graphics, enemy);
      }
      view.label.setText(enemyLabel(enemy));
      view.label.setPosition(enemy.x, enemy.y + 25);
      renderedEnemyIds.add(enemy.id);
    }

    for (const [enemyId, view] of this.enemyViews) {
      if (!renderedEnemyIds.has(enemyId)) {
        view.graphics.destroy();
        view.sprite.destroy();
        view.label.destroy();
        this.enemyViews.delete(enemyId);
      }
    }
  }

  private getEnemyView(enemy: EnemyState): EnemyView {
    const existing = this.enemyViews.get(enemy.id);
    if (existing) {
      return existing;
    }

    const view = {
      graphics: this.add.graphics().setDepth(19),
      sprite: this.add.image(enemy.x, enemy.y, ArtAssetRegistryV01[getEnemyAssetKey(enemy.type)].key).setDepth(18).setVisible(false),
      label: this.add
        .text(enemy.x, enemy.y + 25, enemyLabel(enemy), {
          fontFamily: "Arial, sans-serif",
          fontSize: "10px",
          color: "#ffdde4",
          backgroundColor: RenderScaleV01.ui.textBackground
        })
        .setOrigin(0.5)
        .setDepth(20)
    };
    this.enemyViews.set(enemy.id, view);
    return view;
  }

  private renderBullets(bullets: BulletState[]): void {
    const renderedBulletIds = new Set<string>();

    for (const bullet of bullets) {
      const view = this.getBulletView(bullet);
      const asset = ArtAssetRegistryV01[getProjectileAssetKey(bullet.type)];
      if (this.textures.exists(asset.key)) {
        renderBulletSprite(view, bullet, asset.key);
      } else {
        view.sprite.setVisible(false);
        drawBulletPlaceholder(view.graphics, bullet);
      }
      renderedBulletIds.add(bullet.id);
    }

    for (const [bulletId, view] of this.bulletViews) {
      if (!renderedBulletIds.has(bulletId)) {
        view.graphics.destroy();
        view.sprite.destroy();
        this.bulletViews.delete(bulletId);
      }
    }
  }

  private renderBoss(boss: BossState | undefined): void {
    if (!boss) {
      if (this.bossView) {
        this.bossView.graphics.destroy();
        this.bossView.sprite.destroy();
        this.bossView.weakPointSprite.destroy();
        this.bossView.chargeWarningSprite.destroy();
        this.bossView.label.destroy();
        this.bossView = undefined;
      }
      return;
    }

    const view = this.getBossView(boss);
    const asset = ArtAssetRegistryV01[getBossAssetKey(boss.bossType)];
    if (this.textures.exists(asset.key)) {
      renderBossSprite(view, boss, asset.key);
    } else {
      view.sprite.setVisible(false);
      drawBossPlaceholder(view.graphics, boss);
    }
    renderBossMechanicSprites(this, view, boss);
    view.label.setText(bossLabel(boss));
    view.label.setPosition(boss.x, boss.y + 72);
  }

  private getBossView(boss: BossState): BossView {
    if (this.bossView) {
      return this.bossView;
    }

    this.bossView = {
      graphics: this.add.graphics().setDepth(17),
      sprite: this.add.image(boss.x, boss.y, ArtAssetRegistryV01[getBossAssetKey(boss.bossType)].key).setDepth(17).setVisible(false),
      weakPointSprite: this.add.image(boss.x, boss.y, ArtAssetRegistryV01[getFxAssetKey("boss_weakpoint")].key).setDepth(23).setVisible(false),
      chargeWarningSprite: this.add
        .image(boss.x, boss.y, ArtAssetRegistryV01[getFxAssetKey("boss_charge_warning")].key)
        .setDepth(16)
        .setVisible(false),
      label: this.add
        .text(boss.x, boss.y + 72, bossLabel(boss), {
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          color: "#ffd7b8",
          backgroundColor: "#101513"
        })
        .setOrigin(0.5)
        .setDepth(19)
    };
    return this.bossView;
  }

  private getBulletView(bullet: BulletState): BulletView {
    const existing = this.bulletViews.get(bullet.id);
    if (existing) {
      return existing;
    }

    const view = {
      graphics: this.add.graphics().setDepth(22),
      sprite: this.add.image(bullet.x, bullet.y, ArtAssetRegistryV01[getProjectileAssetKey(bullet.type)].key).setDepth(23).setVisible(false)
    };
    this.bulletViews.set(bullet.id, view);
    return view;
  }

  private renderBase(snapshot: GameStateSnapshot): void {
    if (!this.baseHpText) {
      return;
    }

    const danger = snapshot.base.hp <= Math.ceil(snapshot.base.maxHp * 0.3);
    this.baseHpText.setText(`HP ${snapshot.base.hp}/${snapshot.base.maxHp}`);
    this.baseHpText.setColor(danger ? "#ffb3a5" : "#f7f2df");
  }

  private getPlantView(plant: PlantState): PlantView {
    const existing = this.plantViews.get(plant.id);
    if (existing) {
      return existing;
    }

    const view = {
      graphics: this.add.graphics().setDepth(13),
      sprite: this.add.image(0, 0, ArtAssetRegistryV01[getPlantAssetKey(plant.type)].key).setDepth(14).setVisible(false)
    };
    this.plantViews.set(plant.id, view);
    return view;
  }

  private renderHoverHighlight(snapshot: GameStateSnapshot): void {
    const graphics = this.hoverGraphics;
    if (!graphics) {
      return;
    }

    graphics.clear();
    if (!this.hoverCell) {
      return;
    }

    const left = MapConfigV01.plantGrid.originX + this.hoverCell.columnIndex * MapConfigV01.cellWidthPx;
    const top = MapConfigV01.plantGrid.originY + this.hoverCell.laneIndex * MapConfigV01.laneHeightPx;
    const occupied = snapshot.plants.some(
      (plant) =>
        plant.alive && plant.laneIndex === this.hoverCell?.laneIndex && plant.columnIndex === this.hoverCell.columnIndex
    );
    const localPlayer = snapshot.players.find((player) => player.playerId === getLocalPlayerId());
    const center = getPlantCellCenter(this.hoverCell);
    const tooFar = localPlayer
      ? Math.hypot(localPlayer.x - center.x, localPlayer.y - center.y) > CombatNumbersV01.hero.interactRange
      : false;
    const color = occupied ? 0xef6f61 : tooFar ? 0xf2a64b : 0xf3c84b;

    graphics.lineStyle(3, color, 0.95);
    graphics.strokeRoundedRect(left + 5, top + 6, MapConfigV01.cellWidthPx - 10, MapConfigV01.laneHeightPx - 12, 6);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 960,
  height: 540,
  backgroundColor: "#16201d",
  scene: [BattleScene],
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
});

const serverUrl = `http://${Phase0RuntimeConfig.serverHost}:${Phase0RuntimeConfig.serverPort}`;
const socket = io(serverUrl, {
  autoConnect: true
});

type LobbyClientState = {
  matchId: string | undefined;
  playerId: string | undefined;
  playerSlot: number | undefined;
  ready: boolean;
  room: RoomStatePayload | undefined;
};

type MatchClientState = {
  latestSnapshot: GameStateSnapshot | undefined;
  latestPhaseChanged: MatchPhaseChangedEvent | undefined;
  matchEnded: MatchEndedPayload | undefined;
  snapshotReceivedAtMs: number[];
  snapshotRateHz: number;
};

const lobbyState: LobbyClientState = {
  matchId: undefined,
  playerId: undefined,
  playerSlot: undefined,
  room: undefined,
  ready: false
};

const matchState: MatchClientState = {
  latestSnapshot: undefined,
  latestPhaseChanged: undefined,
  matchEnded: undefined,
  snapshotReceivedAtMs: [],
  snapshotRateHz: 0
};

const lobby = createLobbyUi();

document.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.closest("button")) {
    playAudioEvent("ui.click");
  }
});

socket.on("connect", () => {
  lobby.status.textContent = `Connected ${socket.id ?? ""}`;
  lobby.error.textContent = "";
});

socket.on("connect_error", (error) => {
  lobby.status.textContent = "Disconnected";
  lobby.error.textContent = error.message;
});

socket.on("disconnect", (reason) => {
  lobby.status.textContent = `Disconnected: ${reason}`;
});

socket.on(S2C.ROOM_CREATED, (payload: RoomCreatedPayload) => {
  enterRoom(payload);
});

socket.on(S2C.ROOM_JOINED, (payload: RoomJoinedPayload) => {
  enterRoom(payload);
});

socket.on(S2C.ROOM_STATE, (payload: RoomStatePayload) => {
  lobbyState.room = payload;
  lobbyState.matchId = payload.matchId;
  const self = payload.players.find((player) => player.playerId === lobbyState.playerId);
  if (self) {
    lobbyState.ready = self.ready;
  }
  renderLobby();
});

socket.on(S2C.MATCH_PHASE_CHANGED, (payload: MatchPhaseChangedEvent) => {
  matchState.latestPhaseChanged = payload;
  battleScene?.showPhaseBanner(payload);
  const label = phaseBannerLabel(payload);
  if (label) {
    showActionToast(label);
  }
  renderMatchDebug();
});

socket.on(S2C.STATE_SNAPSHOT, (payload: GameStateSnapshot) => {
  const wasEvolutionUnlocked = matchState.latestSnapshot?.wave.evolutionUnlocked ?? false;
  matchState.latestSnapshot = payload;
  battleScene?.pushSnapshot(payload);
  recordSnapshotReceived();
  if (!wasEvolutionUnlocked && payload.wave.evolutionUnlocked) {
    showActionToast("Evolution unlocked.");
  }
  renderMatchDebug();
});

socket.on(S2C.MATCH_ENDED, (payload: MatchEndedPayload) => {
  matchState.matchEnded = payload;
  matchState.latestSnapshot = payload.finalSnapshot;
  playAudioEvent(audioEventIdFromMatchResult(payload.result));
  battleScene?.pushSnapshot(payload.finalSnapshot);
  showMatchResult(payload);
  renderMatchDebug();
});

socket.on(S2C.ROOM_ERROR, (payload: RoomErrorPayload) => {
  playAudioEvent("ui.error");
  lobby.error.textContent = `${payload.reason}: ${payload.message}`;
});

socket.on(S2C.ACTION_ACCEPTED, (payload: ActionAcceptedPayload) => {
  if (payload.action === "plant") {
    showActionToast("Plant placed.");
    return;
  }
  if (payload.action === "reload") {
    showActionToast("Reloading.");
    return;
  }
  if (payload.action === "buyAmmo") {
    showActionToast("Ammo purchased.");
    return;
  }
  if (payload.action === "evolve") {
    evolutionPanelOpen = false;
    showActionToast("Evolution selected.");
    renderMatchDebug();
  }
});

socket.on(S2C.ACTION_REJECTED, (payload: ActionRejectedPayload) => {
  playAudioEvent(audioEventIdFromActionRejected());
  showActionToast(`${payload.reason}: ${payload.message}`);
});

socket.on(S2C.FEEDBACK_EVENT, (payload: FeedbackEvent) => {
  battleScene?.pushFeedback(payload);
  if (payload.eventType === "sun.gained" && typeof payload.data?.amount === "number") {
    showActionToast(`Sun +${payload.data.amount}`);
    return;
  }
  if (payload.eventType === "base.damaged" && typeof payload.data?.damage === "number") {
    showActionToast(`Base -${payload.data.damage}`);
    return;
  }
  if (payload.eventType === "enemy.killed") {
    showActionToast("Enemy down.");
    return;
  }
  if (payload.eventType === "hero.dryFire") {
    showActionToast("Ammo empty.");
    return;
  }
  if (payload.eventType === "hero.reloadComplete") {
    showActionToast("Reload complete.");
    return;
  }
  if (payload.eventType === "hero.evolved") {
    const path = typeof payload.data?.path === "string" ? payload.data.path : "Hero";
    showActionToast(`${path} evolved.`);
    return;
  }
  if (payload.eventType === "boss.spawned") {
    showActionToast("Ironmaw arrived.");
    return;
  }
  if (payload.eventType === "boss.phaseChanged") {
    const phase = typeof payload.data?.phase === "number" ? `Phase ${payload.data.phase}` : "Boss";
    const skill = typeof payload.data?.skill === "string" ? ` ${payload.data.skill}` : "";
    showActionToast(`${phase}${skill}`);
    return;
  }
  if (payload.eventType === "boss.chargeStarted") {
    showActionToast("Boss charge warning.");
    return;
  }
  if (payload.eventType === "boss.interrupted") {
    showActionToast("Boss interrupted.");
    return;
  }
  if (payload.eventType === "match.victory") {
    showActionToast("Victory.");
    return;
  }
  if (payload.eventType === "match.defeat") {
    showActionToast("Defeat.");
  }
});

lobby.createButton.addEventListener("click", () => {
  lobby.error.textContent = "";
  const request: CreateRoomRequest = {
    playerName: lobby.playerNameInput.value,
    clientVersion: PROJECT_VERSION
  };

  socket.emit(C2S.ROOM_CREATE, request, (payload: RoomCreatedPayload | RoomErrorPayload) => {
    if (isRoomError(payload)) {
      lobby.error.textContent = `${payload.reason}: ${payload.message}`;
      return;
    }
    enterRoom(payload);
  });
});

lobby.joinButton.addEventListener("click", () => {
  lobby.error.textContent = "";
  const matchId = lobby.joinMatchInput.value.trim();
  if (!matchId) {
    lobby.error.textContent = "Enter a match id.";
    return;
  }

  const request: JoinRoomRequest = {
    matchId,
    playerName: lobby.playerNameInput.value,
    clientVersion: PROJECT_VERSION
  };

  socket.emit(C2S.ROOM_JOIN, request, (payload: RoomJoinedPayload | RoomErrorPayload) => {
    if (isRoomError(payload)) {
      lobby.error.textContent = `${payload.reason}: ${payload.message}`;
      return;
    }
    enterRoom(payload);
  });
});

lobby.readyButton.addEventListener("click", () => {
  if (!lobbyState.matchId) {
    lobby.error.textContent = "Create or join a room first.";
    return;
  }

  socket.emit(C2S.PLAYER_READY, {
    ready: !lobbyState.ready
  });
});

lobby.leaveButton.addEventListener("click", () => {
  socket.emit(C2S.ROOM_LEAVE);
  lobbyState.matchId = undefined;
  lobbyState.playerId = undefined;
  lobbyState.playerSlot = undefined;
  lobbyState.ready = false;
  lobbyState.room = undefined;
  resetMatchDebug();
  lobby.error.textContent = "";
  renderLobby();
});

lobby.spawnShamblerButton.addEventListener("click", () => sendSpawnEnemyDebug("shambler"));
lobby.spawnRunnerButton.addEventListener("click", () => sendSpawnEnemyDebug("runner"));
lobby.spawnBruteButton.addEventListener("click", () => sendSpawnEnemyDebug("brute"));
lobby.startBossButton.addEventListener("click", () => sendDebugCommand({ command: "startBoss" }));
lobby.forceVictoryButton.addEventListener("click", () => sendDebugCommand({ command: "forceVictory" }));
lobby.forceDefeatButton.addEventListener("click", () => sendDebugCommand({ command: "forceDefeat" }));
lobby.evolveFirepowerButton.addEventListener("click", () => sendEvolutionPath("firepower"));
lobby.evolveControlButton.addEventListener("click", () => sendEvolutionPath("control"));
lobby.evolveSupportButton.addEventListener("click", () => sendEvolutionPath("support"));

renderLobby();

sendMoveInput = (payload: MoveInputPayload) => {
  if (!lobbyState.matchId) {
    return;
  }

  socket.emit(C2S.INPUT_MOVE, payload);
};

sendAimInput = (worldPoint: Vector2) => {
  if (!lobbyState.matchId) {
    return;
  }

  socket.emit(C2S.INPUT_AIM, {
    worldX: worldPoint.x,
    worldY: worldPoint.y
  });
};

getLocalPlayerId = () => lobbyState.playerId;

sendPlantRequest = (payload: PlantRequestPayload) => {
  if (!lobbyState.matchId) {
    showActionToast("Create or join a room first.");
    return;
  }

  socket.emit(C2S.ACTION_PLANT, payload);
};

sendShootRequest = (payload: ShootRequestPayload) => {
  if (!lobbyState.matchId) {
    showActionToast("Create or join a room first.");
    return;
  }

  socket.emit(C2S.ACTION_SHOOT, payload);
};

sendReloadRequest = (payload: ReloadRequestPayload) => {
  if (!lobbyState.matchId) {
    showActionToast("Create or join a room first.");
    return;
  }

  socket.emit(C2S.ACTION_RELOAD, payload);
};

sendBuyAmmoRequest = (payload: BuyAmmoRequestPayload) => {
  if (!lobbyState.matchId) {
    showActionToast("Create or join a room first.");
    return;
  }

  socket.emit(C2S.ACTION_BUY_AMMO, payload);
};

sendEvolveRequest = (payload: EvolveRequestPayload) => {
  if (!lobbyState.matchId) {
    showActionToast("Create or join a room first.");
    return;
  }

  socket.emit(C2S.ACTION_EVOLVE, payload);
};

sendDebugCommand = (payload: DebugCommandPayload) => {
  if (!lobbyState.matchId) {
    showActionToast("Create or join a room first.");
    return;
  }

  socket.emit(C2S.DEBUG_COMMAND, payload, (result: { ok: boolean; reason?: string }) => {
    if (!result.ok) {
      playAudioEvent("ui.error");
      showActionToast(`Debug rejected: ${result.reason ?? "UNKNOWN"}`);
      return;
    }
    if (payload.command === "spawnEnemy") {
      showActionToast(`Spawned ${payload.enemyType}.`);
      return;
    }
    if (payload.command === "startBoss") {
      showActionToast("Boss started.");
      return;
    }
    if (payload.command === "forceVictory") {
      showActionToast("Victory forced.");
      return;
    }
    if (payload.command === "forceDefeat") {
      showActionToast("Defeat forced.");
    }
  });
};

function enterRoom(payload: RoomCreatedPayload | RoomJoinedPayload): void {
  if (lobbyState.matchId !== payload.matchId) {
    resetMatchDebug();
  }
  lobbyState.matchId = payload.matchId;
  lobbyState.playerId = payload.playerId;
  lobbyState.playerSlot = payload.playerSlot;
  lobby.joinMatchInput.value = payload.matchId;
  lobby.error.textContent = "";
  renderLobby();
}

function selectPlantType(plantType: PlantType): void {
  if (isTextInputFocused()) {
    return;
  }

  selectedPlantType = plantType;
  renderMatchDebug();
}

function toggleEvolutionPanel(): void {
  if (isTextInputFocused()) {
    return;
  }

  evolutionPanelOpen = !evolutionPanelOpen;
  renderMatchDebug();
}

function sendEvolutionPath(path: EvolutionPath): void {
  sendEvolveRequest({
    requestId: createClientRequestId(),
    path
  });
}

function sendSpawnEnemyDebug(enemyType: "shambler" | "runner" | "brute"): void {
  const requestedLane = Number(lobby.debugLaneInput.value);
  const laneIndex = Math.min(4, Math.max(0, Math.trunc(Number.isFinite(requestedLane) ? requestedLane - 1 : 2)));
  lobby.debugLaneInput.value = String(laneIndex + 1);
  sendDebugCommand({
    command: "spawnEnemy",
    enemyType,
    laneIndex
  });
}

function renderLobby(): void {
  lobby.matchId.textContent = lobbyState.matchId ?? "No room";
  lobby.slot.textContent = lobbyState.playerSlot === undefined ? "-" : String(lobbyState.playerSlot);
  lobby.roomState.textContent = lobbyState.room?.roomState ?? "-";
  lobby.readyButton.textContent = lobbyState.ready ? "Cancel Ready" : "Ready";
  lobby.readyButton.disabled = lobbyState.matchId === undefined;
  lobby.leaveButton.disabled = lobbyState.matchId === undefined;

  const players = lobbyState.room?.players ?? [];
  lobby.players.replaceChildren(
    ...[0, 1].map((slot) => {
      const player = players.find((candidate) => candidate.slot === slot);
      const item = document.createElement("li");
      item.className = "player-row";
      item.dataset.testid = `slot-${slot}`;
      item.textContent = player
        ? `Slot ${slot}: ${player.name} | ${player.connected ? "connected" : "offline"} | ${
            player.ready ? "ready" : "not ready"
          }`
        : `Slot ${slot}: empty`;
      return item;
    })
  );
  renderMatchDebug();
}

function renderMatchDebug(): void {
  const snapshot = matchState.latestSnapshot;
  const displayedMatchState =
    snapshot?.matchState ?? matchState.latestPhaseChanged?.nextState ?? lobbyState.room?.roomState ?? "-";
  const remainingSeconds = snapshot?.time.stateRemainingSeconds;
  const wave = snapshot?.wave;
  const localPlayer = snapshot?.players.find((player) => player.playerId === lobbyState.playerId);
  const evolutionCost = CombatNumbersV01.evolution.sunCost;
  const evolutionUnlocked = wave?.evolutionUnlocked ?? false;
  const hasEvolved = localPlayer?.hasEvolved ?? false;
  const hasEnoughEvolutionSun = (snapshot?.economy.sharedSun ?? 0) >= evolutionCost;
  const canAttemptEvolution = lobbyState.matchId !== undefined && !hasEvolved;

  lobby.matchState.textContent = displayedMatchState;
  lobby.phaseTimer.textContent = remainingSeconds === undefined ? "-" : `${remainingSeconds.toFixed(1)}s`;
  lobby.currentWave.textContent = wave ? `${wave.currentWaveIndex}/${wave.totalWaves}` : "-";
  lobby.prepTimer.textContent =
    snapshot?.matchState === "WAVE_PREP" && remainingSeconds !== undefined ? `${remainingSeconds.toFixed(1)}s` : "-";
  lobby.baseHp.textContent = snapshot ? `${snapshot.base.hp}/${snapshot.base.maxHp}` : "-";
  setMeter(lobby.baseHpMeter, snapshot?.base.hp, snapshot?.base.maxHp);
  lobby.playerHp.textContent = localPlayer ? `${localPlayer.hp}/${localPlayer.maxHp}` : "-";
  lobby.evolutionUnlocked.textContent = evolutionUnlocked ? "Unlocked" : "Locked";
  lobby.evolutionPath.textContent = localPlayer?.evolutionPath ?? (hasEvolved ? "Selected" : "None");
  lobby.evolutionCost.textContent = String(evolutionCost);
  lobby.evolutionAvailability.textContent = hasEvolved
    ? "Selected"
    : evolutionUnlocked
      ? hasEnoughEvolutionSun
        ? "Available"
        : "Need sun"
      : "Locked";
  lobby.evolutionPanel.hidden = !evolutionPanelOpen;
  for (const [button, path] of [
    [lobby.evolveFirepowerButton, "firepower"],
    [lobby.evolveControlButton, "control"],
    [lobby.evolveSupportButton, "support"]
  ] as const) {
    button.disabled = !canAttemptEvolution;
    button.dataset.selected = localPlayer?.evolutionPath === path ? "true" : "false";
  }
  lobby.debugMatchId.textContent = snapshot?.matchId ?? lobbyState.matchId ?? "-";
  lobby.debugPlayerId.textContent = lobbyState.playerId ?? "-";
  lobby.debugSlot.textContent = lobbyState.playerSlot === undefined ? "-" : String(lobbyState.playerSlot);
  lobby.debugMatchState.textContent = displayedMatchState;
  lobby.debugWave.textContent = wave
    ? `W${wave.currentWaveIndex}/${wave.totalWaves} spawn ${wave.spawnedInWave} remaining ${wave.enemiesRemainingInWave} done ${String(
        wave.waveSpawnComplete
      )}`
    : "-";
  lobby.debugServerSeq.textContent = snapshot?.serverSeq === undefined ? "-" : String(snapshot.serverSeq);
  lobby.debugSnapshotRate.textContent = `${matchState.snapshotRateHz.toFixed(1)} Hz`;

  lobby.debugPosition.textContent = localPlayer ? `${localPlayer.x.toFixed(1)}, ${localPlayer.y.toFixed(1)}` : "-";
  lobby.debugAim.textContent = localPlayer ? `${localPlayer.aimX.toFixed(2)}, ${localPlayer.aimY.toFixed(2)}` : "-";
  lobby.debugEntities.textContent = snapshot
    ? `P:${snapshot.players.length} Pl:${snapshot.plants.length} E:${snapshot.enemies.length} B:${snapshot.bullets.length} Boss:${
        snapshot.boss ? 1 : 0
      }`
    : "-";
  lobby.sharedSun.textContent = snapshot ? String(snapshot.economy.sharedSun) : "-";
  lobby.ammoMagazine.textContent = localPlayer
    ? `${localPlayer.ammoInMagazine}/${localPlayer.magazineSize}`
    : "-";
  lobby.ammoReserve.textContent = localPlayer ? `${localPlayer.reserveAmmo}/${localPlayer.maxReserveAmmo}` : "-";
  lobby.reloadState.textContent = localPlayer?.reloading
    ? `${(localPlayer.reloadRemainingSeconds ?? 0).toFixed(1)}s`
    : "Ready";
  lobby.ammoCooldown.textContent =
    localPlayer && localPlayer.ammoPurchaseCooldownRemainingSeconds > 0
      ? `${localPlayer.ammoPurchaseCooldownRemainingSeconds.toFixed(1)}s`
      : "Ready";
  lobby.bossHp.textContent = snapshot?.boss ? `${snapshot.boss.hp}/${snapshot.boss.maxHp}` : "-";
  setMeter(lobby.bossHpMeter, snapshot?.boss?.hp, snapshot?.boss?.maxHp);
  lobby.bossPhase.textContent = snapshot?.boss ? `Phase ${snapshot.boss.phase}` : "-";
  lobby.bossSkill.textContent = snapshot?.boss?.currentSkill ?? "-";
  lobby.bossInterrupt.textContent = snapshot?.boss
    ? `${snapshot.boss.interruptProgress}/${snapshot.boss.interruptRequired}`
    : "-";
  setMeter(lobby.bossInterruptMeter, snapshot?.boss?.interruptProgress, snapshot?.boss?.interruptRequired);
  lobby.bossChargeWarning.hidden = !(snapshot?.boss?.charging || snapshot?.boss?.currentSkill === "charge_windup");
  lobby.selectedPlant.textContent = PLANT_LABELS[selectedPlantType];
  lobby.hoverCell.textContent = currentHoverCellLabel;
}

function recordSnapshotReceived(): void {
  const nowMs = performance.now();
  matchState.snapshotReceivedAtMs.push(nowMs);
  matchState.snapshotReceivedAtMs = matchState.snapshotReceivedAtMs.filter((timestamp) => nowMs - timestamp <= 1200);

  const samples = matchState.snapshotReceivedAtMs;
  if (samples.length < 2) {
    matchState.snapshotRateHz = 0;
    return;
  }

  const first = samples[0];
  const last = samples.at(-1);
  if (first === undefined || last === undefined || last <= first) {
    matchState.snapshotRateHz = 0;
    return;
  }

  matchState.snapshotRateHz = ((samples.length - 1) * 1000) / (last - first);
}

function resetMatchDebug(): void {
  matchState.latestSnapshot = undefined;
  matchState.latestPhaseChanged = undefined;
  matchState.matchEnded = undefined;
  matchState.snapshotReceivedAtMs = [];
  matchState.snapshotRateHz = 0;
  lobby.resultScreen.hidden = true;
}

function showMatchResult(payload: MatchEndedPayload): void {
  const stats = payload.stats;
  lobby.resultScreen.hidden = false;
  lobby.resultScreen.dataset.result = payload.result;
  lobby.resultTitle.textContent = payload.result === "VICTORY" ? "Victory" : "Defeat";
  lobby.resultStats.replaceChildren(
    resultStat("Time", formatSeconds(stats.clearTimeSeconds)),
    resultStat("Final wave", String(stats.finalWave)),
    resultStat("Base HP", `${stats.baseHpRemaining}/${payload.finalSnapshot.base.maxHp}`),
    resultStat("Sun earned", String(stats.totalSunEarned)),
    resultStat("Sun spent", String(stats.totalSunSpent)),
    resultStat("Plants", String(stats.totalPlantsPlaced)),
    resultStat("Enemy KOs", String(stats.totalEnemiesKilled)),
    resultStat("Boss damage", String(stats.bossDamageTotal))
  );
  lobby.resultPlayers.replaceChildren(
    ...stats.players.map((player) => {
      const card = document.createElement("article");
      card.className = "result-player";
      const title = document.createElement("h3");
      title.textContent = `P${player.slot + 1} ${player.name}`;
      const rows = document.createElement("dl");
      rows.className = "result-player-grid";
      rows.replaceChildren(
        resultStat("Damage", String(player.damageDealt)),
        resultStat("Kills", String(player.enemiesKilled)),
        resultStat("Shots", `${player.shotsHit}/${player.shotsFired}`),
        resultStat("Ammo buys", String(player.ammoPurchases)),
        resultStat("Sun spent", String(player.sunSpentByActions)),
        resultStat("Plants", String(player.plantsPlaced)),
        resultStat("Deaths", String(player.deaths)),
        resultStat("Evolution", player.evolutionPath ?? "None")
      );
      card.replaceChildren(title, rows);
      return card;
    })
  );
}

function playAudioEvent(id: AudioEventId | undefined): void {
  if (!id) {
    return;
  }

  audioManager.play(id);
}

function playAudioEvents(ids: AudioEventId[]): void {
  for (const id of ids) {
    playAudioEvent(id);
  }
}

function resultStat(label: string, value: string): HTMLDivElement {
  const row = document.createElement("div");
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  description.textContent = value;
  row.replaceChildren(term, description);
  return row;
}

function setMeter(element: HTMLElement, current: number | undefined, max: number | undefined): void {
  if (current === undefined || max === undefined || max <= 0) {
    element.style.width = "0%";
    return;
  }

  const ratio = Math.max(0, Math.min(1, current / max));
  element.style.width = `${(ratio * 100).toFixed(1)}%`;
}

function formatSeconds(seconds: number): string {
  return `${seconds.toFixed(1)}s`;
}

function createClientRequestId(): string {
  clientRequestSequence += 1;
  return `client_${Date.now()}_${clientRequestSequence}`;
}

function showActionToast(message: string): void {
  lobby.actionToast.textContent = message;
  lobby.actionToast.classList.add("visible");
  window.setTimeout(() => {
    if (lobby.actionToast.textContent === message) {
      lobby.actionToast.classList.remove("visible");
    }
  }, 1800);
}

function enemyLabel(enemy: EnemyState): string {
  const prefix = enemy.type === "shambler" ? "S" : enemy.type === "runner" ? "R" : "B";
  return `${prefix} ${enemy.hp}/${enemy.maxHp}${enemy.slowed ? " slow" : ""}`;
}

function bossLabel(boss: BossState): string {
  const skill = boss.currentSkill ? ` ${boss.currentSkill}` : "";
  return `Ironmaw P${boss.phase} ${boss.hp}/${boss.maxHp}${skill}`;
}

function renderPlantSprite(view: PlantView, plant: PlantState, textureKey: string): void {
  const center = getPlantCellCenter({
    laneIndex: plant.laneIndex as 0 | 1 | 2 | 3 | 4,
    columnIndex: plant.columnIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6
  });
  const plantScale = RenderScaleV01.plants[plant.type];

  view.graphics.clear();
  view.sprite.setTexture(textureKey);
  view.sprite.setVisible(true);
  view.sprite.setPosition(center.x, center.y + 5);
  view.sprite.setOrigin(0.5, 0.72);
  fitImageToHeight(view.sprite, plantScale.spriteHeight);
  drawHpBar(view.graphics, center.x, center.y + plantScale.hpBarOffsetY, plantScale.hpBarWidth, plant.hp, plant.maxHp, plantScale.hpColor);
}

function renderEnemySprite(view: EnemyView, enemy: EnemyState, textureKey: string): void {
  const enemyScale = RenderScaleV01.enemies[enemy.type];

  view.graphics.clear();
  view.sprite.setTexture(textureKey);
  view.sprite.setVisible(true);
  view.sprite.setPosition(enemy.x, enemy.y + 8);
  view.sprite.setOrigin(0.5, 0.7);
  fitImageToHeight(view.sprite, enemyScale.spriteHeight);
  if (enemy.state === "ATTACKING_PLANT") {
    view.graphics.lineStyle(3, 0xffd56b, 0.9);
    view.graphics.strokeEllipse(enemy.x, enemy.y + 2, enemyScale.width + 18, enemyScale.height + 14);
  }
  if (enemy.slowed) {
    view.graphics.lineStyle(3, 0x8fc4ff, 0.9);
    view.graphics.strokeEllipse(
      enemy.x,
      enemy.y + 2,
      enemyScale.width + RenderScaleV01.fx.slowOutlineExtraWidth,
      enemyScale.height + RenderScaleV01.fx.slowOutlineExtraHeight
    );
  }
  drawHpBar(
    view.graphics,
    enemy.x,
    enemy.y - enemyScale.height / 2 - 9,
    enemyScale.width + enemyScale.hpBarWidthExtra,
    enemy.hp,
    enemy.maxHp,
    0xff8f7e
  );
}

function renderBossSprite(view: BossView, boss: BossState, textureKey: string): void {
  const bossScale = RenderScaleV01.boss;

  view.graphics.clear();
  view.sprite.setTexture(textureKey);
  view.sprite.setVisible(true);
  view.sprite.setPosition(boss.x, boss.y + 18);
  view.sprite.setOrigin(0.5, 0.65);
  fitImageToHeight(view.sprite, bossScale.spriteHeight);

  if (boss.currentSkill === "charge_windup") {
    view.graphics.lineStyle(4, 0xffd56b, 0.62);
    view.graphics.lineBetween(
      boss.x - CombatNumbersV01.boss.ironmaw.charge.failedChargeDistance,
      boss.y,
      boss.x + CombatNumbersV01.boss.ironmaw.collisionRadius,
      boss.y
    );
    view.graphics.strokeCircle(boss.x, boss.y, CombatNumbersV01.boss.ironmaw.collisionRadius + 10);
  }

  if (boss.weakPointActive && boss.weakPointX !== undefined && boss.weakPointY !== undefined) {
    view.graphics.fillStyle(0xffef93, 0.96);
    view.graphics.fillCircle(boss.weakPointX, boss.weakPointY, RenderScaleV01.fx.bossWeakPointRadius);
    view.graphics.lineStyle(3, 0xff7f6e, 0.95);
    view.graphics.strokeCircle(boss.weakPointX, boss.weakPointY, RenderScaleV01.fx.bossWeakPointOutlineRadius);
  }

  drawHpBar(
    view.graphics,
    boss.x,
    boss.y + bossScale.hpBarOffsetY,
    bossScale.hpBarWidth,
    boss.hp,
    boss.maxHp,
    boss.phase === 2 ? 0xff8f7e : 0xd7a96b
  );
  if (boss.interruptRequired > 0 && (boss.charging || boss.interruptProgress > 0)) {
    drawHpBar(
      view.graphics,
      boss.x,
      boss.y + bossScale.interruptBarOffsetY,
      bossScale.interruptBarWidth,
      boss.interruptProgress,
      boss.interruptRequired,
      0x8fc4ff
    );
  }
}

function renderBossMechanicSprites(scene: Phaser.Scene, view: BossView, boss: BossState): void {
  const weakPointAsset = ArtAssetRegistryV01[getFxAssetKey("boss_weakpoint")];
  const weakPointVisible =
    boss.weakPointActive &&
    boss.weakPointX !== undefined &&
    boss.weakPointY !== undefined &&
    scene.textures.exists(weakPointAsset.key);
  view.weakPointSprite.setVisible(weakPointVisible);
  if (weakPointVisible) {
    view.weakPointSprite.setTexture(weakPointAsset.key);
    view.weakPointSprite.setPosition(boss.weakPointX, boss.weakPointY);
    view.weakPointSprite.setOrigin(0.5);
    view.weakPointSprite.setAlpha(0.96);
    fitImageToHeight(view.weakPointSprite, RenderScaleV01.fx.bossWeakPointSpriteHeight);
  }

  const chargeAsset = ArtAssetRegistryV01[getFxAssetKey("boss_charge_warning")];
  const chargeVisible = boss.currentSkill === "charge_windup" && scene.textures.exists(chargeAsset.key);
  view.chargeWarningSprite.setVisible(chargeVisible);
  if (chargeVisible) {
    const chargeDistance = CombatNumbersV01.boss.ironmaw.charge.failedChargeDistance;
    view.chargeWarningSprite.setTexture(chargeAsset.key);
    view.chargeWarningSprite.setPosition(boss.x - chargeDistance / 2, boss.y + 2);
    view.chargeWarningSprite.setOrigin(0.5);
    view.chargeWarningSprite.setRotation(Math.PI);
    view.chargeWarningSprite.setAlpha(0.82);
    view.chargeWarningSprite.setDisplaySize(
      Math.max(RenderScaleV01.fx.bossChargeWarningWidth, chargeDistance + CombatNumbersV01.boss.ironmaw.collisionRadius),
      RenderScaleV01.fx.bossChargeWarningHeight
    );
  }
}

function renderBulletSprite(view: BulletView, bullet: BulletState, textureKey: string): void {
  const projectileScale = RenderScaleV01.projectiles[bullet.type];
  view.graphics.clear();
  view.sprite.setTexture(textureKey);
  view.sprite.setVisible(true);
  view.sprite.setPosition(bullet.x, bullet.y);
  view.sprite.setOrigin(0.5);
  view.sprite.setRotation(Math.atan2(bullet.dirY, bullet.dirX));
  fitImageToHeight(view.sprite, projectileScale.spriteHeight);
}

function fitImageToHeight(image: Phaser.GameObjects.Image, displayHeight: number): void {
  const sourceHeight = image.height || displayHeight;
  const sourceWidth = image.width || displayHeight;
  const displayWidth = (sourceWidth / sourceHeight) * displayHeight;
  image.setDisplaySize(displayWidth, displayHeight);
}

function drawBossPlaceholder(graphics: Phaser.GameObjects.Graphics, boss: BossState): void {
  graphics.clear();
  const asset = ArtAssetRegistryV01[getBossAssetKey(boss.bossType)];
  const bossScale = RenderScaleV01.boss;
  const weakPointScale = RenderScaleV01.fx;
  graphics.setName(asset.key);
  const bodyColor = boss.phase === 2 ? bossScale.phase2Color : bossScale.phase1Color;
  const outlineColor = boss.currentSkill === "charge_windup" ? 0xffd56b : 0x25131b;

  graphics.fillStyle(0x08100c, 0.32);
  graphics.fillEllipse(boss.x, boss.y + bossScale.shadowOffsetY, bossScale.shadowWidth, bossScale.shadowHeight);

  if (boss.currentSkill === "charge_windup") {
    graphics.lineStyle(4, 0xffd56b, 0.62);
    graphics.lineBetween(
      boss.x - CombatNumbersV01.boss.ironmaw.charge.failedChargeDistance,
      boss.y,
      boss.x + CombatNumbersV01.boss.ironmaw.collisionRadius,
      boss.y
    );
    graphics.strokeCircle(boss.x, boss.y, CombatNumbersV01.boss.ironmaw.collisionRadius + 10);
  }

  graphics.fillStyle(bodyColor, 1);
  graphics.fillRoundedRect(
    boss.x - bossScale.width / 2,
    boss.y - bossScale.height / 2,
    bossScale.width,
    bossScale.height,
    bossScale.cornerRadius
  );
  graphics.fillStyle(bossScale.headColor, 1);
  graphics.fillRoundedRect(
    boss.x - bossScale.headWidth / 2,
    boss.y + bossScale.headOffsetY,
    bossScale.headWidth,
    bossScale.headHeight,
    bossScale.headCornerRadius
  );
  graphics.fillStyle(bossScale.eyeColor, 1);
  graphics.fillCircle(boss.x - bossScale.eyeOffsetX, boss.y + bossScale.eyeOffsetY, bossScale.eyeRadius);
  graphics.fillCircle(boss.x + bossScale.eyeOffsetX, boss.y + bossScale.eyeOffsetY, bossScale.eyeRadius);
  graphics.lineStyle(4, outlineColor, 0.95);
  graphics.strokeRoundedRect(
    boss.x - bossScale.width / 2,
    boss.y - bossScale.height / 2,
    bossScale.width,
    bossScale.height,
    bossScale.cornerRadius
  );

  if (boss.weakPointActive && boss.weakPointX !== undefined && boss.weakPointY !== undefined) {
    graphics.setName(`${asset.key}_${ArtAssetRegistryV01[getFxAssetKey("boss_weakpoint")].key}`);
    graphics.fillStyle(0xffef93, 0.96);
    graphics.fillCircle(boss.weakPointX, boss.weakPointY, weakPointScale.bossWeakPointRadius);
    graphics.lineStyle(3, 0xff7f6e, 0.95);
    graphics.strokeCircle(boss.weakPointX, boss.weakPointY, weakPointScale.bossWeakPointOutlineRadius);
  }

  drawHpBar(
    graphics,
    boss.x,
    boss.y + bossScale.hpBarOffsetY,
    bossScale.hpBarWidth,
    boss.hp,
    boss.maxHp,
    boss.phase === 2 ? 0xff8f7e : 0xd7a96b
  );
  if (boss.interruptRequired > 0 && (boss.charging || boss.interruptProgress > 0)) {
    drawHpBar(
      graphics,
      boss.x,
      boss.y + bossScale.interruptBarOffsetY,
      bossScale.interruptBarWidth,
      boss.interruptProgress,
      boss.interruptRequired,
      0x8fc4ff
    );
  }
}

function drawEnemyPlaceholder(graphics: Phaser.GameObjects.Graphics, enemy: EnemyState): void {
  graphics.clear();
  const asset = ArtAssetRegistryV01[getEnemyAssetKey(enemy.type)];
  const enemyScale = RenderScaleV01.enemies[enemy.type];
  graphics.setName(asset.key);

  graphics.fillStyle(0x08100c, 0.26);
  graphics.fillEllipse(
    enemy.x,
    enemy.y + enemyScale.shadowOffsetY,
    enemyScale.width + enemyScale.shadowExtraWidth,
    enemyScale.shadowHeight
  );
  graphics.fillStyle(enemyScale.color, 1);
  graphics.fillRoundedRect(
    enemy.x - enemyScale.width / 2,
    enemy.y - enemyScale.height / 2,
    enemyScale.width,
    enemyScale.height,
    7
  );
  graphics.fillStyle(0x191a18, 1);
  graphics.fillCircle(enemy.x - enemyScale.eyeOffsetX, enemy.y + enemyScale.eyeOffsetY, enemyScale.eyeRadius);
  graphics.fillCircle(enemy.x + enemyScale.eyeOffsetX, enemy.y + enemyScale.eyeOffsetY, enemyScale.eyeRadius);
  graphics.lineStyle(2, enemy.state === "ATTACKING_PLANT" ? 0xffd56b : 0x1a261f, 0.95);
  graphics.strokeRoundedRect(
    enemy.x - enemyScale.width / 2,
    enemy.y - enemyScale.height / 2,
    enemyScale.width,
    enemyScale.height,
    7
  );
  if (enemy.slowed) {
    graphics.lineStyle(3, 0x8fc4ff, 0.9);
    graphics.strokeEllipse(
      enemy.x,
      enemy.y + 2,
      enemyScale.width + RenderScaleV01.fx.slowOutlineExtraWidth,
      enemyScale.height + RenderScaleV01.fx.slowOutlineExtraHeight
    );
  }
  drawHpBar(
    graphics,
    enemy.x,
    enemy.y - enemyScale.height / 2 - 9,
    enemyScale.width + enemyScale.hpBarWidthExtra,
    enemy.hp,
    enemy.maxHp,
    0xff8f7e
  );
}

function drawBulletPlaceholder(graphics: Phaser.GameObjects.Graphics, bullet: BulletState): void {
  graphics.clear();
  const asset = ArtAssetRegistryV01[getProjectileAssetKey(bullet.type)];
  const projectileScale = RenderScaleV01.projectiles[bullet.type];
  graphics.setName(asset.key);
  graphics.fillStyle(projectileScale.color, 1);
  graphics.fillCircle(bullet.x, bullet.y, projectileScale.radius);
  graphics.lineStyle(2, 0xf7f2df, 0.6);
  graphics.strokeCircle(bullet.x, bullet.y, projectileScale.radius + projectileScale.outlineRadiusExtra);
}

function drawPlantPlaceholder(graphics: Phaser.GameObjects.Graphics, plant: PlantState): void {
  const asset = ArtAssetRegistryV01[getPlantAssetKey(plant.type)];
  const center = getPlantCellCenter({
    laneIndex: plant.laneIndex as 0 | 1 | 2 | 3 | 4,
    columnIndex: plant.columnIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6
  });

  graphics.clear();
  graphics.setName(asset.key);
  graphics.fillStyle(0x08100c, 0.22);

  if (plant.type === "sunbloom") {
    const plantScale = RenderScaleV01.plants.sunbloom;
    graphics.fillEllipse(center.x, center.y + plantScale.shadowOffsetY, plantScale.shadowWidth, plantScale.shadowHeight);
    graphics.fillStyle(plantScale.leafColor, 1);
    graphics.fillEllipse(
      center.x - plantScale.leafOffsetX,
      center.y + plantScale.leafOffsetY,
      plantScale.leafWidth,
      plantScale.leafHeight
    );
    graphics.fillEllipse(
      center.x + plantScale.leafOffsetX,
      center.y + plantScale.leafOffsetY,
      plantScale.leafWidth,
      plantScale.leafHeight
    );
    graphics.fillStyle(plantScale.bodyColor, 1);
    graphics.fillCircle(center.x, center.y - 2, plantScale.bodyRadius);
    graphics.lineStyle(3, 0xffef93, 0.9);
    graphics.strokeCircle(center.x, center.y - 2, plantScale.outlineRadius);
    drawHpBar(graphics, center.x, center.y + plantScale.hpBarOffsetY, plantScale.hpBarWidth, plant.hp, plant.maxHp, plantScale.hpColor);
    return;
  }

  if (plant.type === "peashotter") {
    const plantScale = RenderScaleV01.plants.peashotter;
    graphics.fillEllipse(center.x, center.y + plantScale.shadowOffsetY, plantScale.shadowWidth, plantScale.shadowHeight);
    graphics.fillStyle(plantScale.bodyColor, 1);
    graphics.fillEllipse(
      center.x + plantScale.bodyOffsetX,
      center.y + plantScale.bodyOffsetY,
      plantScale.bodyWidth,
      plantScale.bodyHeight
    );
    graphics.fillStyle(plantScale.barrelColor, 1);
    graphics.fillRoundedRect(
      center.x + plantScale.barrelOffsetX,
      center.y + plantScale.barrelOffsetY,
      plantScale.barrelWidth,
      plantScale.barrelHeight,
      8
    );
    graphics.fillStyle(0xd9f7f2, 1);
    graphics.fillCircle(
      center.x + plantScale.muzzleOffsetX,
      center.y + plantScale.muzzleOffsetY,
      plantScale.muzzleRadius
    );
    drawHpBar(graphics, center.x, center.y + plantScale.hpBarOffsetY, plantScale.hpBarWidth, plant.hp, plant.maxHp, plantScale.hpColor);
    return;
  }

  const plantScale = RenderScaleV01.plants.barkwall;
  graphics.fillEllipse(center.x, center.y + plantScale.shadowOffsetY, plantScale.shadowWidth, plantScale.shadowHeight);
  graphics.fillStyle(plantScale.bodyColor, 1);
  graphics.fillRoundedRect(
    center.x - plantScale.bodyWidth / 2,
    center.y - plantScale.bodyHeight / 2 + 1,
    plantScale.bodyWidth,
    plantScale.bodyHeight,
    8
  );
  graphics.lineStyle(3, plantScale.grooveColor, 0.9);
  graphics.lineBetween(center.x - 10, center.y - 20, center.x - 18, center.y + 20);
  graphics.lineBetween(center.x + 10, center.y - 22, center.x + 6, center.y + 22);
  drawHpBar(graphics, center.x, center.y + plantScale.hpBarOffsetY, plantScale.hpBarWidth, plant.hp, plant.maxHp, plantScale.hpColor);
}

function drawHpBar(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  hp: number,
  maxHp: number,
  color: number
): void {
  const ratio = maxHp <= 0 ? 0 : Phaser.Math.Clamp(hp / maxHp, 0, 1);
  const barScale = RenderScaleV01.hpBar;
  graphics.fillStyle(barScale.backgroundColor, 0.9);
  graphics.fillRoundedRect(x - width / 2, y, width, barScale.height, 2);
  graphics.fillStyle(color, 0.95);
  graphics.fillRoundedRect(x - width / 2, y, Math.max(0, width * ratio), barScale.height, 2);
}

function phaseBannerLabel(event: MatchPhaseChangedEvent): string | undefined {
  if (event.nextState === "WAVE_PREP") {
    return `Wave ${event.waveIndex ?? "-"} Prep`;
  }
  if (event.nextState === "WAVE_ACTIVE") {
    return `Wave ${event.waveIndex ?? "-"} Start`;
  }
  if (event.nextState === "WAVE_CLEAR") {
    return `Wave ${event.waveIndex ?? "-"} Clear`;
  }
  if (event.nextState === "BOSS_PREP") {
    return "Boss Prep";
  }
  if (event.nextState === "BOSS_ACTIVE") {
    return "Boss Fight";
  }
  if (event.nextState === "DEFEAT") {
    return "Defeat";
  }
  if (event.nextState === "VICTORY") {
    return "Victory";
  }
  return undefined;
}

function feedbackFxSpec(event: FeedbackEvent): FeedbackFxSpec | undefined {
  if (event.eventType === "hero.shoot" || event.eventType === "plant.shoot") {
    return {
      fxType: "muzzle_flash",
      height: RenderScaleV01.fx.muzzleFlashSpriteHeight,
      durationMs: 180,
      startScale: 0.9,
      endScale: 1.35,
      rotation: typeof event.data?.dirY === "number" && typeof event.data?.dirX === "number" ? Math.atan2(event.data.dirY, event.data.dirX) : 0
    };
  }
  if (event.eventType === "plant.placed") {
    return {
      fxType: "plant_place",
      height: RenderScaleV01.fx.plantPlaceSpriteHeight,
      durationMs: 520,
      alpha: 0.86,
      startScale: 0.82,
      endScale: 1.2,
      depth: 24
    };
  }
  if (event.eventType === "sun.gained") {
    return {
      fxType: "sun_gain",
      height: RenderScaleV01.fx.sunGainSpriteHeight,
      durationMs: 560,
      startScale: 0.82,
      endScale: 1.25,
      depth: 42
    };
  }
  if (
    event.eventType === "enemy.hit" ||
    event.eventType === "enemy.killed" ||
    event.eventType === "base.damaged" ||
    event.eventType === "boss.interrupted" ||
    event.eventType === "boss.chargeFailed"
  ) {
    return {
      fxType: "hit_spark",
      height: RenderScaleV01.fx.hitSparkSpriteHeight,
      durationMs: 300,
      startScale: 0.85,
      endScale: 1.4,
      depth: 41
    };
  }
  if (event.eventType === "boss.weakPointExposed") {
    return {
      fxType: "boss_weakpoint",
      height: RenderScaleV01.fx.bossWeakPointSpriteHeight,
      durationMs: 680,
      alpha: 0.96,
      startScale: 0.85,
      endScale: 1.15,
      depth: 43
    };
  }
  if (event.eventType === "boss.chargeStarted") {
    return {
      fxType: "boss_charge_warning",
      width: RenderScaleV01.fx.bossChargeWarningWidth,
      height: RenderScaleV01.fx.bossChargeWarningHeight,
      durationMs: 760,
      alpha: 0.9,
      startScale: 0.96,
      endScale: 1.04,
      rotation: Math.PI,
      depth: 38
    };
  }
  return undefined;
}

function feedbackLabel(event: FeedbackEvent): { text: string; color: string; size: string; durationMs: number } | undefined {
  if (event.eventType === "hero.shoot") {
    return { text: "bang", color: "#fff1a6", size: "12px", durationMs: 220 };
  }
  if (event.eventType === "hero.dryFire") {
    return { text: "empty", color: "#ffb3a5", size: "12px", durationMs: 420 };
  }
  if (event.eventType === "hero.reloadStart") {
    return { text: "reload", color: "#cfe4ca", size: "12px", durationMs: 460 };
  }
  if (event.eventType === "hero.reloadComplete") {
    return { text: "ready", color: "#8de36c", size: "12px", durationMs: 420 };
  }
  if (event.eventType === "hero.evolved") {
    return { text: "evolved", color: "#f3c84b", size: "14px", durationMs: 700 };
  }
  if (event.eventType === "wave.started") {
    const waveIndex = typeof event.data?.waveIndex === "number" ? event.data.waveIndex : "-";
    return { text: `Wave ${waveIndex}`, color: "#f3c84b", size: "18px", durationMs: 700 };
  }
  if (event.eventType === "enemy.spawned") {
    return { text: "spawn", color: "#ffbfcc", size: "12px", durationMs: 360 };
  }
  if (event.eventType === "enemy.hit") {
    return { text: "hit", color: "#ffdf75", size: "12px", durationMs: 360 };
  }
  if (event.eventType === "enemy.killed") {
    return { text: "KO", color: "#ff8f7e", size: "16px", durationMs: 520 };
  }
  if (event.eventType === "plant.destroyed") {
    return { text: "plant lost", color: "#ffb3a5", size: "13px", durationMs: 620 };
  }
  if (event.eventType === "base.damaged") {
    return { text: "BASE HIT", color: "#ff8f7e", size: "16px", durationMs: 680 };
  }
  if (event.eventType === "boss.spawned") {
    return { text: "IRONMAW", color: "#ffd7b8", size: "20px", durationMs: 900 };
  }
  if (event.eventType === "boss.phaseChanged") {
    const phase = typeof event.data?.phase === "number" ? `P${event.data.phase}` : "Boss";
    const skill = typeof event.data?.skill === "string" ? ` ${event.data.skill}` : "";
    return { text: `${phase}${skill}`, color: "#f3c84b", size: "16px", durationMs: 760 };
  }
  if (event.eventType === "boss.weakPointExposed") {
    return { text: "weak point", color: "#ffef93", size: "14px", durationMs: 620 };
  }
  if (event.eventType === "boss.chargeStarted") {
    return { text: "CHARGE", color: "#ff8f7e", size: "18px", durationMs: 760 };
  }
  if (event.eventType === "boss.interrupted") {
    return { text: "INTERRUPT", color: "#8fc4ff", size: "18px", durationMs: 760 };
  }
  if (event.eventType === "boss.chargeFailed") {
    return { text: "dash", color: "#ffb3a5", size: "14px", durationMs: 620 };
  }
  if (event.eventType === "match.victory") {
    return { text: "VICTORY", color: "#f3c84b", size: "24px", durationMs: 1200 };
  }
  if (event.eventType === "match.defeat") {
    return { text: "DEFEAT", color: "#ff8f7e", size: "24px", durationMs: 1200 };
  }
  return undefined;
}

function isTextInputFocused(): boolean {
  const active = document.activeElement;
  return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
}

function isRoomError(payload: RoomCreatedPayload | RoomJoinedPayload | RoomErrorPayload): payload is RoomErrorPayload {
  return "reason" in payload;
}

function createLobbyUi(): {
  status: HTMLDivElement;
  error: HTMLDivElement;
  playerNameInput: HTMLInputElement;
  joinMatchInput: HTMLInputElement;
  createButton: HTMLButtonElement;
  joinButton: HTMLButtonElement;
  readyButton: HTMLButtonElement;
  leaveButton: HTMLButtonElement;
  matchId: HTMLSpanElement;
  slot: HTMLSpanElement;
  roomState: HTMLSpanElement;
  players: HTMLUListElement;
  matchState: HTMLSpanElement;
  phaseTimer: HTMLSpanElement;
  currentWave: HTMLSpanElement;
  prepTimer: HTMLSpanElement;
  baseHp: HTMLSpanElement;
  baseHpMeter: HTMLSpanElement;
  playerHp: HTMLSpanElement;
  evolutionUnlocked: HTMLSpanElement;
  evolutionPath: HTMLSpanElement;
  evolutionPanel: HTMLElement;
  evolutionCost: HTMLSpanElement;
  evolutionAvailability: HTMLSpanElement;
  evolveFirepowerButton: HTMLButtonElement;
  evolveControlButton: HTMLButtonElement;
  evolveSupportButton: HTMLButtonElement;
  debugMatchId: HTMLSpanElement;
  debugPlayerId: HTMLSpanElement;
  debugSlot: HTMLSpanElement;
  debugMatchState: HTMLSpanElement;
  debugWave: HTMLSpanElement;
  debugServerSeq: HTMLSpanElement;
  debugSnapshotRate: HTMLSpanElement;
  debugPosition: HTMLSpanElement;
  debugAim: HTMLSpanElement;
  debugEntities: HTMLSpanElement;
  sharedSun: HTMLSpanElement;
  selectedPlant: HTMLSpanElement;
  hoverCell: HTMLSpanElement;
  ammoMagazine: HTMLSpanElement;
  ammoReserve: HTMLSpanElement;
  reloadState: HTMLSpanElement;
  ammoCooldown: HTMLSpanElement;
  bossHp: HTMLSpanElement;
  bossHpMeter: HTMLSpanElement;
  bossPhase: HTMLSpanElement;
  bossSkill: HTMLSpanElement;
  bossInterrupt: HTMLSpanElement;
  bossInterruptMeter: HTMLSpanElement;
  bossChargeWarning: HTMLDivElement;
  debugLaneInput: HTMLInputElement;
  spawnShamblerButton: HTMLButtonElement;
  spawnRunnerButton: HTMLButtonElement;
  spawnBruteButton: HTMLButtonElement;
  startBossButton: HTMLButtonElement;
  forceVictoryButton: HTMLButtonElement;
  forceDefeatButton: HTMLButtonElement;
  actionToast: HTMLDivElement;
  resultScreen: HTMLElement;
  resultTitle: HTMLHeadingElement;
  resultStats: HTMLDivElement;
  resultPlayers: HTMLDivElement;
} {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) {
    throw new Error("App root is missing.");
  }

  const panel = document.createElement("section");
  panel.className = "lobby-panel";
  panel.dataset.testid = "lobby-panel";
  panel.innerHTML = `
    <div class="lobby-header">
      <h2>Online Room</h2>
      <div class="connection-status" data-testid="connection-status">Connecting...</div>
    </div>
    <label>
      Player
      <input data-testid="player-name" value="Player" maxlength="20" />
    </label>
    <div class="button-row">
      <button type="button" data-testid="create-room">Create</button>
    </div>
    <label>
      Match ID
      <input data-testid="join-match-id" placeholder="room_..." />
    </label>
    <div class="button-row">
      <button type="button" data-testid="join-room">Join</button>
      <button type="button" data-testid="leave-room">Leave</button>
    </div>
    <dl class="room-meta">
      <div><dt>Match</dt><dd data-testid="current-match-id">No room</dd></div>
      <div><dt>Slot</dt><dd data-testid="current-slot">-</dd></div>
      <div><dt>State</dt><dd data-testid="room-state">-</dd></div>
    </dl>
    <ul class="player-list" data-testid="player-list"></ul>
    <button type="button" class="ready-button" data-testid="ready-button">Ready</button>
    <section class="match-status" aria-label="Match status">
      <h3>Match</h3>
      <dl class="room-meta">
        <div><dt>State</dt><dd data-testid="match-state">-</dd></div>
        <div><dt>Timer</dt><dd data-testid="phase-timer">-</dd></div>
        <div><dt>Wave</dt><dd data-testid="current-wave">-</dd></div>
        <div><dt>Prep</dt><dd data-testid="prep-timer">-</dd></div>
        <div><dt>Base HP</dt><dd><span data-testid="base-hp">-</span><span class="meter"><span data-testid="base-hp-meter"></span></span></dd></div>
        <div><dt>Player HP</dt><dd data-testid="player-hp">-</dd></div>
        <div><dt>Evolution</dt><dd data-testid="evolution-unlocked">Locked</dd></div>
        <div><dt>Path</dt><dd data-testid="evolution-path">None</dd></div>
      </dl>
    </section>
    <section class="plant-hud" aria-label="Planting">
      <h3>Planting</h3>
      <dl class="room-meta">
        <div><dt>Sun</dt><dd data-testid="shared-sun">-</dd></div>
        <div><dt>Selected</dt><dd data-testid="selected-plant">1 Sunbloom</dd></div>
        <div><dt>Cell</dt><dd data-testid="hover-cell">-</dd></div>
      </dl>
    </section>
    <section class="weapon-hud" aria-label="Weapon">
      <h3>Weapon</h3>
      <dl class="room-meta">
        <div><dt>Magazine</dt><dd data-testid="ammo-magazine">-</dd></div>
        <div><dt>Reserve</dt><dd data-testid="ammo-reserve">-</dd></div>
        <div><dt>Reload</dt><dd data-testid="reload-state">-</dd></div>
        <div><dt>Buy CD</dt><dd data-testid="ammo-cooldown">-</dd></div>
      </dl>
    </section>
    <section class="boss-hud" aria-label="Boss">
      <h3>Boss</h3>
      <dl class="room-meta">
        <div><dt>HP</dt><dd><span data-testid="boss-hp">-</span><span class="meter boss-meter"><span data-testid="boss-hp-meter"></span></span></dd></div>
        <div><dt>Phase</dt><dd data-testid="boss-phase">-</dd></div>
        <div><dt>Skill</dt><dd data-testid="boss-skill">-</dd></div>
        <div><dt>Interrupt</dt><dd><span data-testid="boss-interrupt">-</span><span class="meter interrupt-meter"><span data-testid="boss-interrupt-meter"></span></span></dd></div>
      </dl>
      <div class="boss-charge-warning" data-testid="boss-charge-warning" hidden>Charge warning</div>
    </section>
    <section class="evolution-hud" data-testid="evolution-panel" aria-label="Evolution paths" hidden>
      <h3>Evolution</h3>
      <dl class="room-meta">
        <div><dt>Cost</dt><dd data-testid="evolution-cost">200</dd></div>
        <div><dt>Status</dt><dd data-testid="evolution-availability">Locked</dd></div>
      </dl>
      <div class="evolution-actions">
        <button type="button" data-testid="evolve-firepower">Firepower</button>
        <button type="button" data-testid="evolve-control">Control</button>
        <button type="button" data-testid="evolve-support">Support</button>
      </div>
    </section>
    <section class="controls-help" aria-label="Controls">
      <h3>Controls</h3>
      <div class="controls-grid">
        <kbd>WASD</kbd><span>Move</span>
        <kbd>Mouse</kbd><span>Aim / shoot</span>
        <kbd>E</kbd><span>Plant selected</span>
        <kbd>1 2 3</kbd><span>Select plant</span>
        <kbd>R</kbd><span>Reload</span>
        <kbd>Q</kbd><span>Buy ammo</span>
        <kbd>F</kbd><span>Evolution</span>
      </div>
    </section>
    <section class="debug-overlay" aria-label="Debug overlay">
      <h3>Debug</h3>
      <dl class="debug-grid">
        <div><dt>matchId</dt><dd data-testid="debug-match-id">-</dd></div>
        <div><dt>playerId</dt><dd data-testid="debug-player-id">-</dd></div>
        <div><dt>slot</dt><dd data-testid="debug-slot">-</dd></div>
        <div><dt>matchState</dt><dd data-testid="debug-match-state">-</dd></div>
        <div><dt>wave</dt><dd data-testid="debug-wave">-</dd></div>
        <div><dt>serverSeq</dt><dd data-testid="debug-server-seq">-</dd></div>
        <div><dt>snapshot</dt><dd data-testid="debug-snapshot-rate">0.0 Hz</dd></div>
        <div><dt>position</dt><dd data-testid="debug-position">-</dd></div>
        <div><dt>aim</dt><dd data-testid="debug-aim">-</dd></div>
        <div><dt>entities</dt><dd data-testid="debug-entities">-</dd></div>
      </dl>
      <div class="debug-actions">
        <label>
          Spawn lane
          <input data-testid="debug-lane" type="number" min="1" max="5" value="3" />
        </label>
        <div class="button-row">
          <button type="button" data-testid="spawn-shambler">Shambler</button>
          <button type="button" data-testid="spawn-runner">Runner</button>
          <button type="button" data-testid="spawn-brute">Brute</button>
          <button type="button" data-testid="start-boss">Start Boss</button>
        </div>
        <div class="button-row">
          <button type="button" data-testid="force-victory">Force Victory</button>
          <button type="button" data-testid="force-defeat">Force Defeat</button>
        </div>
      </div>
    </section>
    <div class="action-toast" data-testid="action-toast"></div>
    <section class="result-screen" data-testid="result-screen" hidden>
      <div class="result-dialog">
        <p class="result-kicker">Match Result</p>
        <h2 data-testid="result-title">-</h2>
        <div class="result-stats" data-testid="result-stats"></div>
        <div class="result-players" data-testid="result-players"></div>
      </div>
    </section>
    <div class="lobby-error" data-testid="lobby-error"></div>
  `;
  app.append(panel);

  return {
    status: requiredElement(panel, "[data-testid='connection-status']"),
    error: requiredElement(panel, "[data-testid='lobby-error']"),
    playerNameInput: requiredElement(panel, "[data-testid='player-name']"),
    joinMatchInput: requiredElement(panel, "[data-testid='join-match-id']"),
    createButton: requiredElement(panel, "[data-testid='create-room']"),
    joinButton: requiredElement(panel, "[data-testid='join-room']"),
    readyButton: requiredElement(panel, "[data-testid='ready-button']"),
    leaveButton: requiredElement(panel, "[data-testid='leave-room']"),
    matchId: requiredElement(panel, "[data-testid='current-match-id']"),
    slot: requiredElement(panel, "[data-testid='current-slot']"),
    roomState: requiredElement(panel, "[data-testid='room-state']"),
    players: requiredElement(panel, "[data-testid='player-list']"),
    matchState: requiredElement(panel, "[data-testid='match-state']"),
    phaseTimer: requiredElement(panel, "[data-testid='phase-timer']"),
    currentWave: requiredElement(panel, "[data-testid='current-wave']"),
    prepTimer: requiredElement(panel, "[data-testid='prep-timer']"),
    baseHp: requiredElement(panel, "[data-testid='base-hp']"),
    baseHpMeter: requiredElement(panel, "[data-testid='base-hp-meter']"),
    playerHp: requiredElement(panel, "[data-testid='player-hp']"),
    evolutionUnlocked: requiredElement(panel, "[data-testid='evolution-unlocked']"),
    evolutionPath: requiredElement(panel, "[data-testid='evolution-path']"),
    evolutionPanel: requiredElement(panel, "[data-testid='evolution-panel']"),
    evolutionCost: requiredElement(panel, "[data-testid='evolution-cost']"),
    evolutionAvailability: requiredElement(panel, "[data-testid='evolution-availability']"),
    evolveFirepowerButton: requiredElement(panel, "[data-testid='evolve-firepower']"),
    evolveControlButton: requiredElement(panel, "[data-testid='evolve-control']"),
    evolveSupportButton: requiredElement(panel, "[data-testid='evolve-support']"),
    debugMatchId: requiredElement(panel, "[data-testid='debug-match-id']"),
    debugPlayerId: requiredElement(panel, "[data-testid='debug-player-id']"),
    debugSlot: requiredElement(panel, "[data-testid='debug-slot']"),
    debugMatchState: requiredElement(panel, "[data-testid='debug-match-state']"),
    debugWave: requiredElement(panel, "[data-testid='debug-wave']"),
    debugServerSeq: requiredElement(panel, "[data-testid='debug-server-seq']"),
    debugSnapshotRate: requiredElement(panel, "[data-testid='debug-snapshot-rate']"),
    debugPosition: requiredElement(panel, "[data-testid='debug-position']"),
    debugAim: requiredElement(panel, "[data-testid='debug-aim']"),
    debugEntities: requiredElement(panel, "[data-testid='debug-entities']"),
    sharedSun: requiredElement(panel, "[data-testid='shared-sun']"),
    selectedPlant: requiredElement(panel, "[data-testid='selected-plant']"),
    hoverCell: requiredElement(panel, "[data-testid='hover-cell']"),
    ammoMagazine: requiredElement(panel, "[data-testid='ammo-magazine']"),
    ammoReserve: requiredElement(panel, "[data-testid='ammo-reserve']"),
    reloadState: requiredElement(panel, "[data-testid='reload-state']"),
    ammoCooldown: requiredElement(panel, "[data-testid='ammo-cooldown']"),
    bossHp: requiredElement(panel, "[data-testid='boss-hp']"),
    bossHpMeter: requiredElement(panel, "[data-testid='boss-hp-meter']"),
    bossPhase: requiredElement(panel, "[data-testid='boss-phase']"),
    bossSkill: requiredElement(panel, "[data-testid='boss-skill']"),
    bossInterrupt: requiredElement(panel, "[data-testid='boss-interrupt']"),
    bossInterruptMeter: requiredElement(panel, "[data-testid='boss-interrupt-meter']"),
    bossChargeWarning: requiredElement(panel, "[data-testid='boss-charge-warning']"),
    debugLaneInput: requiredElement(panel, "[data-testid='debug-lane']"),
    spawnShamblerButton: requiredElement(panel, "[data-testid='spawn-shambler']"),
    spawnRunnerButton: requiredElement(panel, "[data-testid='spawn-runner']"),
    spawnBruteButton: requiredElement(panel, "[data-testid='spawn-brute']"),
    startBossButton: requiredElement(panel, "[data-testid='start-boss']"),
    forceVictoryButton: requiredElement(panel, "[data-testid='force-victory']"),
    forceDefeatButton: requiredElement(panel, "[data-testid='force-defeat']"),
    actionToast: requiredElement(panel, "[data-testid='action-toast']"),
    resultScreen: requiredElement(panel, "[data-testid='result-screen']"),
    resultTitle: requiredElement(panel, "[data-testid='result-title']"),
    resultStats: requiredElement(panel, "[data-testid='result-stats']"),
    resultPlayers: requiredElement(panel, "[data-testid='result-players']")
  };
}

function requiredElement<TElement extends Element>(root: ParentNode, selector: string): TElement {
  const element = root.querySelector<TElement>(selector);
  if (!element) {
    throw new Error(`Missing lobby element: ${selector}`);
  }
  return element;
}

function normalizeInput(input: MoveInputPayload): Vector2 {
  const length = Math.hypot(input.dirX, input.dirY);
  if (length === 0 || !Number.isFinite(length)) {
    return { x: 0, y: 0 };
  }

  return {
    x: input.dirX / length,
    y: input.dirY / length
  };
}
