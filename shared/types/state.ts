import type { EvolutionPath, MatchState, PlayerSlot, RoomState } from "./enums";
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

export type MatchResult = Extract<MatchState, "VICTORY" | "DEFEAT">;

export type PlayerMatchResultStats = {
  playerId: PlayerId;
  slot: PlayerSlot;
  name: string;
  damageDealt: number;
  enemiesKilled: number;
  shotsFired: number;
  shotsHit: number;
  ammoPurchases: number;
  sunSpentByActions: number;
  plantsPlaced: number;
  deaths: number;
  evolutionPath: EvolutionPath | null;
};

export type MatchResultStats = {
  clearTimeSeconds: number;
  result: MatchResult;
  finalWave: number;
  baseHpRemaining: number;
  totalSunEarned: number;
  totalSunSpent: number;
  totalPlantsPlaced: number;
  totalEnemiesKilled: number;
  bossDamageTotal: number;
  players: PlayerMatchResultStats[];
};

export type MatchEndedPayload = {
  matchId: MatchId;
  serverTimeMs: number;
  result: MatchResult;
  stats: MatchResultStats;
  finalSnapshot: GameStateSnapshot;
};
