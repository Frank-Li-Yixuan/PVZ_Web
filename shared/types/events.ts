import type { FeedbackEventType, MatchState } from "./enums";
import type { EntityId, MatchId, PlayerId } from "./entities";

export type FeedbackEvent = {
  id: string;
  eventType: FeedbackEventType;
  serverTimeMs: number;
  entityId?: EntityId;
  playerId?: PlayerId;
  x?: number;
  y?: number;
  data?: Record<string, unknown>;
};

export type SunChangeReason =
  | "initial"
  | "sunbloom_produce"
  | "enemy_drop"
  | "boss_phase_reward"
  | "plant_purchase"
  | "ammo_purchase"
  | "evolution_purchase"
  | "debug";

export type SunChangeEvent = {
  previousSun: number;
  nextSun: number;
  delta: number;
  reason: SunChangeReason;
  actorPlayerId?: PlayerId;
  entityId?: EntityId;
  serverTimeMs: number;
};

export type MatchPhaseChangedEvent = {
  type: "match.phaseChanged";
  matchId: MatchId;
  previousState: MatchState;
  nextState: MatchState;
  serverTimeMs: number;
  waveIndex?: number;
};
