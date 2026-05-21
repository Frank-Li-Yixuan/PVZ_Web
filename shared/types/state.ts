import type { MatchState, PlayerSlot, RoomState } from "./enums";
import type { FeedbackEvent } from "./events";
import type { BossState, BulletState, EnemyState, MatchId, PlayerId, PlantState, PlayerState } from "./entities";

export type MatchTimeState = {
  elapsedMatchSeconds: number;
  stateElapsedSeconds: number;
  stateRemainingSeconds?: number;
};

export type EconomyState = {
  sharedSun: number;
  totalSunEarned: number;
  totalSunSpent: number;
  sunSuppressed: boolean;
  sunSuppressionRemainingSeconds?: number;
};

export type BaseState = {
  hp: number;
  maxHp: number;
};

export type WaveState = {
  currentWaveIndex: number;
  totalWaves: number;
  spawnedInWave: number;
  remainingInWave: number;
  waveSpawnComplete: boolean;
  enemiesRemainingInWave: number;
  evolutionUnlocked: boolean;
};

export type SnapshotEventHint = FeedbackEvent;

export type GameStateSnapshot = {
  matchId: MatchId;
  serverSeq: number;
  serverTimeMs: number;
  matchState: MatchState;
  roomState: RoomState;
  time: MatchTimeState;
  economy: EconomyState;
  base: BaseState;
  players: PlayerState[];
  plants: PlantState[];
  enemies: EnemyState[];
  bullets: BulletState[];
  boss?: BossState;
  wave: WaveState;
  events?: SnapshotEventHint[];
};

export type RoomPlayerSummary = {
  playerId: PlayerId;
  slot: PlayerSlot;
  name: string;
  connected: boolean;
  ready: boolean;
};

export type RoomStatePayload = {
  matchId: MatchId;
  roomState: RoomState;
  players: RoomPlayerSummary[];
};

export type MatchResultStats = {
  durationSeconds: number;
  totalSunEarned: number;
  totalSunSpent: number;
  plantsPlaced: number;
  ammoPurchases: number;
  enemiesKilled: number;
  bossFightDurationSeconds?: number;
  bossInterrupts: number;
  baseHpRemaining: number;
  playerDeaths: number;
};
