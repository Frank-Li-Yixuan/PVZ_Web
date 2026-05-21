import type { ActionName, ActionRejectReason, EnemyType, EvolutionPath, PlayerSlot, PlantType } from "./enums";
import type { EntityId, MatchId, PlayerId, RequestId } from "./entities";
import type { RoomStatePayload } from "./state";

export const C2S = {
  ROOM_CREATE: "room.create",
  ROOM_JOIN: "room.join",
  ROOM_LEAVE: "room.leave",
  PLAYER_READY: "player.ready",
  INPUT_MOVE: "input.move",
  INPUT_AIM: "input.aim",
  ACTION_SHOOT: "action.shoot",
  ACTION_RELOAD: "action.reload",
  ACTION_PLANT: "action.plant",
  ACTION_BUY_AMMO: "action.buyAmmo",
  ACTION_EVOLVE: "action.evolve",
  CLIENT_PONG: "client.pong",
  DEBUG_COMMAND: "debug.command"
} as const;

export const S2C = {
  ROOM_CREATED: "room.created",
  ROOM_JOINED: "room.joined",
  ROOM_ERROR: "room.error",
  ROOM_STATE: "room.state",
  MATCH_STARTED: "match.started",
  MATCH_PHASE_CHANGED: "match.phaseChanged",
  STATE_SNAPSHOT: "state.snapshot",
  ACTION_ACCEPTED: "action.accepted",
  ACTION_REJECTED: "action.rejected",
  FEEDBACK_EVENT: "event.feedback",
  MATCH_ENDED: "match.ended",
  SERVER_PING: "server.ping",
  SERVER_WARNING: "server.warning"
} as const;

export type C2SEventName = (typeof C2S)[keyof typeof C2S];
export type S2CEventName = (typeof S2C)[keyof typeof S2C];

export type CreateRoomRequest = {
  playerName?: string;
  clientVersion: string;
};

export type RoomCreatedPayload = {
  matchId: MatchId;
  playerId: PlayerId;
  playerSlot: PlayerSlot;
  reconnectToken: string;
};

export type JoinRoomRequest = {
  matchId: MatchId;
  playerName?: string;
  clientVersion: string;
};

export type RoomJoinedPayload = {
  matchId: MatchId;
  playerId: PlayerId;
  playerSlot: PlayerSlot;
  reconnectToken: string;
};

export type RoomErrorReason =
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "MATCH_ALREADY_STARTED"
  | "VERSION_MISMATCH"
  | "INVALID_RECONNECT_TOKEN"
  | "UNKNOWN_ERROR";

export type RoomErrorPayload = {
  reason: RoomErrorReason;
  message: string;
};

export type PlayerReadyRequestPayload = {
  ready: boolean;
};

export type MoveInputPayload = {
  dirX: number;
  dirY: number;
};

export type AimInputPayload = {
  worldX: number;
  worldY: number;
};

export type ShootRequestPayload = {
  requestId: RequestId;
  aimWorldX: number;
  aimWorldY: number;
};

export type ReloadRequestPayload = {
  requestId: RequestId;
};

export type PlantRequestPayload = {
  requestId: RequestId;
  plantType: PlantType;
  laneIndex: 0 | 1 | 2 | 3 | 4;
  columnIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6;
};

export type BuyAmmoRequestPayload = {
  requestId: RequestId;
};

export type EvolveRequestPayload = {
  requestId: RequestId;
  path: EvolutionPath;
};

export type DebugCommandPayload =
  | { command: "addSun"; amount: number }
  | { command: "spawnEnemy"; enemyType: EnemyType; laneIndex: number }
  | { command: "startBoss" }
  | { command: "killAllEnemies" }
  | { command: "forceVictory" }
  | { command: "forceDefeat" };

export type ReconnectRequest = {
  matchId: MatchId;
  playerId: PlayerId;
  reconnectToken: string;
  clientVersion: string;
};

export type ActionAcceptedPayload = {
  requestId: RequestId;
  action: ActionName;
  serverTimeMs: number;
  affectedEntityIds?: EntityId[];
};

export type ActionRejectedPayload = {
  requestId: RequestId;
  action: ActionName;
  reason: ActionRejectReason;
  message: string;
  serverTimeMs: number;
};

export type ServerPingPayload = {
  serverTimeMs: number;
};

export type ServerWarningPayload = {
  code: string;
  message: string;
};

export type RoomMessagePayload = RoomStatePayload | RoomCreatedPayload | RoomJoinedPayload | RoomErrorPayload;
