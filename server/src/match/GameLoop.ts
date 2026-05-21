import {
  CombatNumbersV01,
  NetworkTimingV01,
  clampPointToMapBounds,
  getPlayerSpawnPosition,
  normalizeVector,
  type BaseState,
  type DebugCommandPayload,
  type FeedbackEvent,
  type AimInputPayload,
  type EvolveRequestPayload,
  type GameStateSnapshot,
  type MatchEndedPayload,
  type MatchId,
  type MatchPhaseChangedEvent,
  type MatchResult,
  type MatchResultStats,
  type MoveInputPayload,
  type BuyAmmoRequestPayload,
  type PlantRequestPayload,
  type PlayerId,
  type PlayerState,
  type ReloadRequestPayload,
  type RoomStatePayload,
  type ShootRequestPayload
} from "@sprout-and-steel/shared";
import { MatchStateMachine } from "./MatchStateMachine";
import { BossSystem } from "../systems/BossSystem";
import { EconomySystem } from "../systems/EconomySystem";
import { EnemySystem } from "../systems/EnemySystem";
import { EvolutionSystem, type EvolutionActionResult } from "../systems/EvolutionSystem";
import { PlantCombatSystem } from "../systems/PlantCombatSystem";
import { PlantSystem, type PlantActionResult } from "../systems/PlantSystem";
import { ProjectileSystem } from "../systems/ProjectileSystem";
import { WaveSystem } from "../systems/WaveSystem";
import { WeaponSystem, type WeaponActionResult } from "../systems/WeaponSystem";

export type GameLoopOptions = {
  matchId: MatchId;
  getRoomState: () => RoomStatePayload;
  onSnapshot: (snapshot: GameStateSnapshot) => void;
  onPhaseChanged: (event: MatchPhaseChangedEvent) => void;
  onMatchEnded?: (payload: MatchEndedPayload) => void;
  now?: () => number;
};

export type DebugCommandResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: string;
    };

type PlayerRuntimeState = PlayerState & {
  moveDirX: number;
  moveDirY: number;
  aimWorldX: number | undefined;
  aimWorldY: number | undefined;
  nextAllowedShotTimeMs?: number;
};

export class GameLoop {
  private readonly stateMachine: MatchStateMachine;
  private readonly tickIntervalMs = 1000 / NetworkTimingV01.serverTickRate;
  private readonly tickDeltaSeconds = 1 / NetworkTimingV01.serverTickRate;
  private readonly snapshotEveryTicks = Math.max(
    1,
    Math.round(NetworkTimingV01.serverTickRate / NetworkTimingV01.snapshotRate)
  );
  private timer: ReturnType<typeof setInterval> | undefined;
  private tickCount = 0;
  private serverSeq = 0;
  private readonly playersById = new Map<PlayerId, PlayerRuntimeState>();
  private readonly base: BaseState = {
    hp: CombatNumbersV01.base.maxHp,
    maxHp: CombatNumbersV01.base.maxHp
  };
  private readonly economySystem = new EconomySystem();
  private readonly plantSystem = new PlantSystem();
  private readonly enemySystem = new EnemySystem();
  private readonly projectileSystem = new ProjectileSystem();
  private readonly plantCombatSystem = new PlantCombatSystem();
  private readonly waveSystem = new WaveSystem();
  private readonly bossSystem = new BossSystem();
  private readonly weaponSystem = new WeaponSystem();
  private readonly evolutionSystem = new EvolutionSystem();
  private readonly pendingSnapshotEvents: FeedbackEvent[] = [];
  private finalSnapshot: GameStateSnapshot | undefined;
  private matchEndedPayload: MatchEndedPayload | undefined;
  private totalEnemiesKilled = 0;
  private bossDamageTotal = 0;

  constructor(private readonly options: GameLoopOptions) {
    this.stateMachine = new MatchStateMachine(options.matchId);
  }

  start(): void {
    if (this.timer !== undefined) {
      return;
    }

    this.syncPlayers(this.options.getRoomState());
    const phaseChanged = this.stateMachine.startCountdown(this.now());
    if (phaseChanged) {
      this.options.onPhaseChanged(phaseChanged);
    }

    this.timer = setInterval(() => this.tick(), this.tickIntervalMs);
  }

  stop(): void {
    if (this.timer === undefined) {
      return;
    }

    clearInterval(this.timer);
    this.timer = undefined;
  }

  isRunning(): boolean {
    return this.timer !== undefined;
  }

  getCurrentSnapshot(): GameStateSnapshot {
    if (this.finalSnapshot) {
      return this.finalSnapshot;
    }

    return this.buildSnapshot(this.now());
  }

  applyPlayerMoveInput(playerId: PlayerId, input: MoveInputPayload): void {
    const player = this.playersById.get(playerId);
    if (!player) {
      return;
    }

    const normalized = normalizeFiniteVector(input.dirX, input.dirY);
    player.moveDirX = normalized.x;
    player.moveDirY = normalized.y;
  }

  applyPlayerAimInput(playerId: PlayerId, input: AimInputPayload): void {
    const player = this.playersById.get(playerId);
    if (!player || !Number.isFinite(input.worldX) || !Number.isFinite(input.worldY)) {
      return;
    }

    player.aimWorldX = input.worldX;
    player.aimWorldY = input.worldY;
    updateAimDirection(player);
  }

  applyPlantAction(playerId: PlayerId, request: PlantRequestPayload): PlantActionResult {
    this.syncPlayers(this.options.getRoomState());

    return this.plantSystem.tryPlant({
      requestId: request.requestId,
      request,
      matchState: this.stateMachine.getMatchState(),
      player: this.playersById.get(playerId),
      economy: this.economySystem,
      serverTimeMs: this.now(),
      enemies: this.enemySystem.getSnapshot()
    });
  }

  applyShootAction(playerId: PlayerId, request: ShootRequestPayload): WeaponActionResult {
    this.syncPlayers(this.options.getRoomState());

    return this.weaponSystem.tryShoot({
      requestId: request.requestId,
      matchState: this.stateMachine.getMatchState(),
      player: this.playersById.get(playerId),
      aimWorldX: request.aimWorldX,
      aimWorldY: request.aimWorldY,
      projectiles: this.projectileSystem,
      serverTimeMs: this.now()
    });
  }

  applyReloadAction(playerId: PlayerId, request: ReloadRequestPayload): WeaponActionResult {
    this.syncPlayers(this.options.getRoomState());

    return this.weaponSystem.tryReload({
      requestId: request.requestId,
      matchState: this.stateMachine.getMatchState(),
      player: this.playersById.get(playerId),
      serverTimeMs: this.now()
    });
  }

  applyBuyAmmoAction(playerId: PlayerId, request: BuyAmmoRequestPayload): WeaponActionResult {
    this.syncPlayers(this.options.getRoomState());

    return this.weaponSystem.tryBuyAmmo({
      requestId: request.requestId,
      matchState: this.stateMachine.getMatchState(),
      player: this.playersById.get(playerId),
      economy: this.economySystem,
      serverTimeMs: this.now()
    });
  }

  applyEvolveAction(playerId: PlayerId, request: EvolveRequestPayload): EvolutionActionResult {
    this.syncPlayers(this.options.getRoomState());

    return this.evolutionSystem.tryEvolve({
      requestId: request.requestId,
      matchState: this.stateMachine.getMatchState(),
      evolutionUnlocked: this.waveSystem.getSnapshot(this.enemySystem.getSnapshot().length).evolutionUnlocked,
      player: this.playersById.get(playerId),
      path: request.path,
      economy: this.economySystem,
      serverTimeMs: this.now()
    });
  }

  applyDebugCommand(payload: DebugCommandPayload): DebugCommandResult {
    if (!canMutateCombat(this.stateMachine.getMatchState())) {
      return {
        ok: false,
        reason: "NOT_IN_VALID_MATCH_STATE"
      };
    }

    if (payload.command === "addSun") {
      this.economySystem.gain(payload.amount);
      return { ok: true };
    }

    if (payload.command === "spawnEnemy") {
      const result = this.enemySystem.spawnEnemy({
        enemyType: payload.enemyType,
        laneIndex: payload.laneIndex,
        serverTimeMs: this.now(),
        debugSpawn: true
      });

      if (!result.ok) {
        return {
          ok: false,
          reason: result.reason
        };
      }

      this.recordEvents(result.feedback);
      return { ok: true };
    }

    if (payload.command === "startBoss") {
      const result = this.startBossFight(this.now());
      if (!result.ok) {
        return result;
      }
      return { ok: true };
    }

    if (payload.command === "forceVictory") {
      const serverTimeMs = this.now();
      const event = this.stateMachine.forceTerminalState("VICTORY", serverTimeMs);
      this.options.onPhaseChanged(event);
      this.recordEvents({
        id: `event_victory_${this.serverSeq + 1}`,
        eventType: "match.victory",
        serverTimeMs,
        data: {
          reason: "debug_force_victory"
        }
      });
      this.finalizeMatchIfTerminal(serverTimeMs);
      return { ok: true };
    }

    if (payload.command === "forceDefeat") {
      const serverTimeMs = this.now();
      this.base.hp = 0;
      this.forceDefeat(serverTimeMs);
      this.finalizeMatchIfTerminal(serverTimeMs);
      return { ok: true };
    }

    return {
      ok: false,
      reason: "UNKNOWN_DEBUG_COMMAND"
    };
  }

  private tick(): void {
    this.tickCount += 1;
    const serverTimeMs = this.now();
    this.syncPlayers(this.options.getRoomState());
    const phaseEvents = this.stateMachine.update(this.tickDeltaSeconds, serverTimeMs);
    const enteredWavePrepFromCountdown = phaseEvents.some(
      (event) => event.previousState === "COUNTDOWN" && event.nextState === "WAVE_PREP"
    );

    for (const event of phaseEvents) {
      this.options.onPhaseChanged(event);
    }

    let matchState = this.stateMachine.getMatchState();

    if (canUpdatePlayerMovement(matchState)) {
      this.updatePlayerMovement(this.tickDeltaSeconds);
    }

    if (canMutateCombat(matchState) && !enteredWavePrepFromCountdown) {
      this.updateWaves(serverTimeMs);
      this.updateBossPrep(serverTimeMs);
      matchState = this.stateMachine.getMatchState();
    }

    if (canMutateCombat(matchState)) {
      this.economySystem.update(this.tickDeltaSeconds);
      this.recordEvents(
        ...this.weaponSystem.update(this.tickDeltaSeconds, this.playersById.values(), serverTimeMs),
        ...this.plantSystem.update(this.tickDeltaSeconds, this.economySystem, serverTimeMs),
        ...this.plantCombatSystem.update(
          this.tickDeltaSeconds,
          this.plantSystem,
          this.enemySystem,
          this.projectileSystem,
          serverTimeMs,
          this.bossSystem
        ),
        ...this.projectileSystem.update(
          this.tickDeltaSeconds,
          this.enemySystem,
          this.economySystem,
          serverTimeMs,
          this.playersById,
          this.bossSystem
        )
      );

      const enemyResult = this.enemySystem.update(
        this.tickDeltaSeconds,
        this.plantSystem,
        this.economySystem,
        this.base,
        serverTimeMs
      );
      this.recordEvents(...enemyResult.events);

      if (this.stateMachine.getMatchState() === "BOSS_ACTIVE") {
        const bossResult = this.bossSystem.update({
          matchState: this.stateMachine.getMatchState(),
          deltaSeconds: this.tickDeltaSeconds,
          plants: this.plantSystem,
          enemies: this.enemySystem,
          economy: this.economySystem,
          base: this.base,
          players: this.playersById.values(),
          serverTimeMs
        });
        this.recordEvents(...bossResult.events);

        for (const spawn of bossResult.spawns) {
          const spawnResult = this.enemySystem.spawnEnemy({
            enemyType: spawn.enemyType,
            laneIndex: spawn.laneIndex,
            serverTimeMs,
            debugSpawn: false
          });
          if (spawnResult.ok) {
            this.recordEvents(spawnResult.feedback);
          }
        }
      }

      if ((enemyResult.defeated || this.base.hp <= 0) && this.stateMachine.getMatchState() !== "DEFEAT") {
        this.discardVictoryFeedback();
        this.forceDefeat(serverTimeMs);
      } else if (this.bossSystem.isDefeated() && this.stateMachine.getMatchState() !== "VICTORY") {
        const victoryEvent = this.stateMachine.forceTerminalState("VICTORY", serverTimeMs);
        this.options.onPhaseChanged(victoryEvent);
      }
    }

    if (this.finalizeMatchIfTerminal(serverTimeMs)) {
      return;
    }

    if (this.tickCount % this.snapshotEveryTicks === 0) {
      this.options.onSnapshot(this.buildSnapshot(serverTimeMs));
    }
  }

  private buildSnapshot(serverTimeMs: number): GameStateSnapshot {
    const room = this.options.getRoomState();

    this.syncPlayers(room);
    this.serverSeq += 1;
    const enemies = this.enemySystem.getSnapshot();

    const snapshot: GameStateSnapshot = {
      matchId: this.options.matchId,
      serverSeq: this.serverSeq,
      serverTimeMs,
      matchState: this.stateMachine.getMatchState(),
      roomState: room.roomState,
      time: this.stateMachine.getTime(),
      economy: this.economySystem.getSnapshot(),
      base: { ...this.base },
      players: [...this.playersById.values()]
        .sort((a, b) => a.slot - b.slot)
        .map((player) => toSnapshotPlayer(player)),
      plants: this.plantSystem.getSnapshot(),
      enemies,
      bullets: this.projectileSystem.getSnapshot(),
      wave: this.waveSystem.getSnapshot(enemies.length),
      events: this.pendingSnapshotEvents.splice(0)
    };

    const boss = this.bossSystem.getSnapshot(this.stateMachine.getMatchState());
    if (boss) {
      snapshot.boss = boss;
    }

    return snapshot;
  }

  private now(): number {
    return this.options.now?.() ?? Date.now();
  }

  private updateWaves(serverTimeMs: number): void {
    const waveResult = this.waveSystem.update({
      matchState: this.stateMachine.getMatchState(),
      deltaSeconds: this.tickDeltaSeconds,
      activeEnemyCount: this.enemySystem.getSnapshot().length,
      baseHp: this.base.hp,
      serverTimeMs
    });

    for (const transition of waveResult.transitions) {
      const event = this.stateMachine.transitionTo(transition.nextState, serverTimeMs, transition.waveIndex);
      this.options.onPhaseChanged(event);
    }

    this.recordEvents(...waveResult.feedback);

    for (const spawn of waveResult.spawns) {
      const spawnResult = this.enemySystem.spawnEnemy({
        enemyType: spawn.enemyType,
        laneIndex: spawn.laneIndex,
        serverTimeMs,
        debugSpawn: false,
        waveIndex: spawn.waveIndex,
        waveEventIndex: spawn.eventIndex
      });
      if (spawnResult.ok) {
        this.recordEvents(spawnResult.feedback);
      }
    }
  }

  private updateBossPrep(serverTimeMs: number): void {
    if (this.stateMachine.getMatchState() !== "BOSS_PREP") {
      return;
    }

    const elapsedSeconds = this.stateMachine.getTime().stateElapsedSeconds;
    if (elapsedSeconds + 0.000_001 < CombatNumbersV01.match.bossPrepSeconds) {
      return;
    }

    this.startBossFight(serverTimeMs);
  }

  private startBossFight(serverTimeMs: number): DebugCommandResult {
    if (this.stateMachine.getMatchState() === "BOSS_ACTIVE") {
      return { ok: false, reason: "BOSS_ALREADY_ACTIVE" };
    }

    const spawn = this.bossSystem.spawnBoss(serverTimeMs);
    if (!spawn.ok) {
      return {
        ok: false,
        reason: spawn.reason
      };
    }

    const event = this.stateMachine.transitionTo("BOSS_ACTIVE", serverTimeMs);
    this.options.onPhaseChanged(event);
    this.recordEvents(spawn.feedback);
    return { ok: true };
  }

  private forceDefeat(serverTimeMs: number): void {
    const defeatEvent = this.stateMachine.forceTerminalState("DEFEAT", serverTimeMs);
    this.options.onPhaseChanged(defeatEvent);
    this.recordEvents({
      id: `event_defeat_${this.serverSeq + 1}`,
      eventType: "match.defeat",
      serverTimeMs,
      data: {
        reason: "base_destroyed"
      }
    });
  }

  private discardVictoryFeedback(): void {
    for (let index = this.pendingSnapshotEvents.length - 1; index >= 0; index -= 1) {
      if (this.pendingSnapshotEvents[index]?.eventType === "match.victory") {
        this.pendingSnapshotEvents.splice(index, 1);
      }
    }
  }

  private finalizeMatchIfTerminal(serverTimeMs: number): boolean {
    if (this.matchEndedPayload) {
      return true;
    }

    const result = this.stateMachine.getMatchState();
    if (result !== "VICTORY" && result !== "DEFEAT") {
      return false;
    }

    const finalSnapshot = this.buildSnapshot(serverTimeMs);
    const payload: MatchEndedPayload = {
      matchId: this.options.matchId,
      serverTimeMs,
      result,
      stats: this.buildMatchResultStats(result),
      finalSnapshot
    };

    this.finalSnapshot = finalSnapshot;
    this.matchEndedPayload = payload;
    this.options.onSnapshot(finalSnapshot);
    this.options.onMatchEnded?.(payload);
    this.stop();
    return true;
  }

  private buildMatchResultStats(result: MatchResult): MatchResultStats {
    const economy = this.economySystem.getSnapshot();
    const enemies = this.enemySystem.getSnapshot();
    const wave = this.waveSystem.getSnapshot(enemies.length);
    const players = [...this.playersById.values()]
      .sort((a, b) => a.slot - b.slot)
      .map((player) => ({
        playerId: player.playerId,
        slot: player.slot,
        name: player.name,
        damageDealt: statNumber(player.stats.damageDealt),
        enemiesKilled: statNumber(player.stats.enemiesKilled),
        shotsFired: statNumber(player.stats.shotsFired),
        shotsHit: statNumber(player.stats.shotsHit),
        ammoPurchases: statNumber(player.stats.ammoPurchased),
        sunSpentByActions: statNumber(player.stats.sunSpent),
        plantsPlaced: statNumber(player.stats.plantsPlaced),
        deaths: statNumber(player.stats.deaths),
        evolutionPath: player.evolutionPath ?? null
      }));

    return {
      clearTimeSeconds: this.stateMachine.getTime().elapsedMatchSeconds,
      result,
      finalWave: wave.currentWaveIndex,
      baseHpRemaining: this.base.hp,
      totalSunEarned: economy.totalSunEarned,
      totalSunSpent: economy.totalSunSpent,
      totalPlantsPlaced: players.reduce((sum, player) => sum + player.plantsPlaced, 0),
      totalEnemiesKilled: this.totalEnemiesKilled,
      bossDamageTotal: roundStat(this.bossDamageTotal),
      players
    };
  }

  private recordEvents(...events: FeedbackEvent[]): void {
    for (const event of events) {
      if (event.eventType === "enemy.killed") {
        this.totalEnemiesKilled += 1;
      }
      if (event.eventType === "enemy.hit" && event.data?.target === "boss" && typeof event.data.damage === "number") {
        this.bossDamageTotal += event.data.damage;
      }
      this.pendingSnapshotEvents.push(event);
    }
  }

  private syncPlayers(room: RoomStatePayload): void {
    const activePlayerIds = new Set<PlayerId>();

    for (const summary of room.players) {
      activePlayerIds.add(summary.playerId);
      const existing = this.playersById.get(summary.playerId);
      if (existing) {
        existing.slot = summary.slot;
        existing.name = summary.name;
        existing.connected = summary.connected;
        continue;
      }

      this.playersById.set(summary.playerId, createRuntimePlayer(summary));
    }

    for (const playerId of this.playersById.keys()) {
      if (!activePlayerIds.has(playerId)) {
        this.playersById.delete(playerId);
      }
    }
  }

  private updatePlayerMovement(deltaSeconds: number): void {
    const movementDistance = CombatNumbersV01.hero.moveSpeed * deltaSeconds;

    for (const player of this.playersById.values()) {
      if (!player.connected || !player.alive) {
        continue;
      }

      const nextPosition = clampPointToMapBounds(
        {
          x: player.x + player.moveDirX * movementDistance,
          y: player.y + player.moveDirY * movementDistance
        },
        CombatNumbersV01.hero.collisionRadius
      );
      player.x = nextPosition.x;
      player.y = nextPosition.y;
      updateAimDirection(player);
    }
  }
}

function createRuntimePlayer(player: RoomStatePayload["players"][number]): PlayerRuntimeState {
  const spawn = getPlayerSpawnPosition(player.slot);

  return {
    playerId: player.playerId,
    slot: player.slot,
    name: player.name,
    connected: player.connected,
    x: spawn.x,
    y: spawn.y,
    aimX: 1,
    aimY: 0,
    hp: CombatNumbersV01.hero.maxHp,
    maxHp: CombatNumbersV01.hero.maxHp,
    alive: true,
    ammoInMagazine: CombatNumbersV01.weapon.pistol.magazineSize,
    magazineSize: CombatNumbersV01.weapon.pistol.magazineSize,
    reserveAmmo: CombatNumbersV01.weapon.pistol.initialReserveAmmo,
    maxReserveAmmo: CombatNumbersV01.weapon.pistol.maxReserveAmmo,
    reloading: false,
    ammoPurchaseCooldownRemainingSeconds: 0,
    nextAllowedShotTimeMs: 0,
    hasEvolved: false,
    stats: {},
    moveDirX: 0,
    moveDirY: 0,
    aimWorldX: undefined,
    aimWorldY: undefined
  };
}

function toSnapshotPlayer(player: PlayerRuntimeState): PlayerState {
  const snapshot: PlayerState = {
    playerId: player.playerId,
    slot: player.slot,
    name: player.name,
    connected: player.connected,
    x: roundPosition(player.x),
    y: roundPosition(player.y),
    aimX: roundDirection(player.aimX),
    aimY: roundDirection(player.aimY),
    hp: player.hp,
    maxHp: player.maxHp,
    alive: player.alive,
    ammoInMagazine: player.ammoInMagazine,
    magazineSize: player.magazineSize,
    reserveAmmo: player.reserveAmmo,
    maxReserveAmmo: player.maxReserveAmmo,
    reloading: player.reloading,
    ammoPurchaseCooldownRemainingSeconds: player.ammoPurchaseCooldownRemainingSeconds,
    hasEvolved: player.hasEvolved,
    stats: player.stats
  };

  if (player.reloadRemainingSeconds !== undefined) {
    snapshot.reloadRemainingSeconds = player.reloadRemainingSeconds;
  }
  if (player.evolutionPath !== undefined) {
    snapshot.evolutionPath = player.evolutionPath;
  }

  return snapshot;
}

function normalizeFiniteVector(x: number, y: number): { x: number; y: number } {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return { x: 0, y: 0 };
  }

  return normalizeVector({ x, y });
}

function updateAimDirection(player: PlayerRuntimeState): void {
  if (player.aimWorldX === undefined || player.aimWorldY === undefined) {
    return;
  }

  const direction = normalizeFiniteVector(player.aimWorldX - player.x, player.aimWorldY - player.y);
  if (direction.x === 0 && direction.y === 0) {
    return;
  }

  player.aimX = direction.x;
  player.aimY = direction.y;
}

function canUpdatePlayerMovement(matchState: string): boolean {
  return matchState !== "LOBBY" && matchState !== "VICTORY" && matchState !== "DEFEAT";
}

function canMutateCombat(matchState: string): boolean {
  return matchState !== "LOBBY" && matchState !== "VICTORY" && matchState !== "DEFEAT";
}

function roundPosition(value: number): number {
  return Number(value.toFixed(2));
}

function roundDirection(value: number): number {
  return Number(value.toFixed(4));
}

function statNumber(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return 0;
  }

  return roundStat(value);
}

function roundStat(value: number): number {
  return Number(value.toFixed(3));
}
