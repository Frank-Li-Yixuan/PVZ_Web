import { randomUUID } from "node:crypto";
import type {
  CreateRoomRequest,
  JoinRoomRequest,
  MatchId,
  RoomCreatedPayload,
  RoomErrorPayload,
  RoomStatePayload
} from "@sprout-and-steel/shared";
import { GameRoom, type AddPlayerResult } from "./GameRoom";

export type RoomCreateInput = CreateRoomRequest & {
  socketId: string;
};

export type RoomJoinInput = JoinRoomRequest & {
  socketId: string;
};

export type CreateRoomResult = RoomCreatedPayload & {
  room: GameRoom;
};

export type JoinRoomResult =
  | AddPlayerResult
  | {
      ok: false;
      error: RoomErrorPayload;
    };

export class RoomManager {
  private readonly rooms = new Map<MatchId, GameRoom>();
  private readonly socketToMatchId = new Map<string, MatchId>();
  private readonly idFactory: () => string;

  constructor(idFactory: () => string = randomUUID) {
    this.idFactory = idFactory;
  }

  createRoom(input: RoomCreateInput): CreateRoomResult {
    const matchId = this.prefixedId("room");
    const playerId = this.prefixedId("player");
    const reconnectToken = this.prefixedId("reconnect");
    const room = new GameRoom(matchId);
    const addResult = room.addPlayer({
      socketId: input.socketId,
      playerId,
      playerName: input.playerName,
      reconnectToken,
      clientVersion: input.clientVersion
    });

    if (!addResult.ok) {
      throw new Error("Newly created room unexpectedly rejected its creator.");
    }

    this.rooms.set(matchId, room);
    this.socketToMatchId.set(input.socketId, matchId);

    return {
      matchId,
      playerId,
      playerSlot: addResult.payload.playerSlot,
      reconnectToken,
      room
    };
  }

  joinRoom(input: RoomJoinInput): JoinRoomResult {
    const room = this.rooms.get(input.matchId);
    if (!room) {
      return {
        ok: false,
        error: {
          reason: "ROOM_NOT_FOUND",
          message: "Room was not found."
        }
      };
    }

    const addResult = room.addPlayer({
      socketId: input.socketId,
      playerId: this.prefixedId("player"),
      playerName: input.playerName,
      reconnectToken: this.prefixedId("reconnect"),
      clientVersion: input.clientVersion
    });

    if (addResult.ok) {
      this.socketToMatchId.set(input.socketId, input.matchId);
    }

    return addResult;
  }

  setPlayerReady(socketId: string, ready: boolean): RoomStatePayload | undefined {
    const room = this.getRoomBySocketId(socketId);
    return room?.setReadyBySocketId(socketId, ready);
  }

  leaveBySocketId(socketId: string): RoomStatePayload | undefined {
    const matchId = this.socketToMatchId.get(socketId);
    const room = matchId ? this.rooms.get(matchId) : undefined;
    if (!room || !matchId) {
      return undefined;
    }

    const payload = room.removeBySocketId(socketId);
    this.socketToMatchId.delete(socketId);
    if (room.isEmpty()) {
      this.rooms.delete(matchId);
    }
    return payload;
  }

  disconnectBySocketId(socketId: string): RoomStatePayload | undefined {
    const room = this.getRoomBySocketId(socketId);
    const payload = room?.markDisconnectedBySocketId(socketId);
    if (payload) {
      this.socketToMatchId.delete(socketId);
    }
    return payload;
  }

  getRoom(matchId: MatchId): GameRoom | undefined {
    return this.rooms.get(matchId);
  }

  getRoomBySocketId(socketId: string): GameRoom | undefined {
    const matchId = this.socketToMatchId.get(socketId);
    return matchId ? this.rooms.get(matchId) : undefined;
  }

  deleteRoom(matchId: MatchId): boolean {
    const room = this.rooms.get(matchId);
    if (!room) {
      return false;
    }

    for (const socketId of room.getSocketIds()) {
      this.socketToMatchId.delete(socketId);
    }

    return this.rooms.delete(matchId);
  }

  private prefixedId(prefix: string): string {
    return `${prefix}_${this.idFactory()}`;
  }
}
