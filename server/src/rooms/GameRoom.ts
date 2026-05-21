import type {
  MatchState,
  MatchId,
  PlayerId,
  PlayerSlot,
  RoomErrorPayload,
  RoomJoinedPayload,
  RoomState,
  RoomStatePayload
} from "@sprout-and-steel/shared";

export type RoomPlayer = {
  playerId: PlayerId;
  socketId: string;
  slot: PlayerSlot;
  name: string;
  connected: boolean;
  ready: boolean;
  reconnectToken: string;
  clientVersion: string;
};

export type AddPlayerInput = {
  socketId: string;
  playerId: PlayerId;
  playerName: string | undefined;
  reconnectToken: string;
  clientVersion: string;
};

export type AddPlayerResult =
  | {
      ok: true;
      payload: RoomJoinedPayload;
      player: RoomPlayer;
      room: GameRoom;
    }
  | {
      ok: false;
      error: RoomErrorPayload;
      room: GameRoom;
    };

export class GameRoom {
  readonly matchId: MatchId;

  private readonly playersBySlot = new Map<PlayerSlot, RoomPlayer>();
  private state: RoomState = "OPEN";
  private matchState: MatchState = "LOBBY";

  constructor(matchId: MatchId) {
    this.matchId = matchId;
  }

  addPlayer(input: AddPlayerInput): AddPlayerResult {
    if (this.matchState !== "LOBBY") {
      return {
        ok: false,
        error: {
          reason: "MATCH_ALREADY_STARTED",
          message: "Match already started."
        },
        room: this
      };
    }

    const slot = this.nextAvailableSlot();
    if (slot === undefined) {
      return {
        ok: false,
        error: {
          reason: "ROOM_FULL",
          message: "Room already has two players."
        },
        room: this
      };
    }

    const player: RoomPlayer = {
      playerId: input.playerId,
      socketId: input.socketId,
      slot,
      name: input.playerName?.trim() || `Player ${slot + 1}`,
      connected: true,
      ready: false,
      reconnectToken: input.reconnectToken,
      clientVersion: input.clientVersion
    };
    this.playersBySlot.set(slot, player);
    this.refreshState();

    return {
      ok: true,
      payload: {
        matchId: this.matchId,
        playerId: player.playerId,
        playerSlot: player.slot,
        reconnectToken: player.reconnectToken
      },
      player,
      room: this
    };
  }

  setReadyBySocketId(socketId: string, ready: boolean): RoomStatePayload | undefined {
    const player = this.findPlayerBySocketId(socketId);
    if (!player) {
      return undefined;
    }

    player.ready = ready;
    this.refreshState();
    return this.getStatePayload();
  }

  removeBySocketId(socketId: string): RoomStatePayload | undefined {
    const player = this.findPlayerBySocketId(socketId);
    if (!player) {
      return undefined;
    }

    this.playersBySlot.delete(player.slot);
    this.refreshState();
    return this.getStatePayload();
  }

  markDisconnectedBySocketId(socketId: string): RoomStatePayload | undefined {
    const player = this.findPlayerBySocketId(socketId);
    if (!player) {
      return undefined;
    }

    player.connected = false;
    player.ready = false;
    this.refreshState();
    return this.getStatePayload();
  }

  hasSocket(socketId: string): boolean {
    return this.findPlayerBySocketId(socketId) !== undefined;
  }

  getPlayerBySocketId(socketId: string): RoomPlayer | undefined {
    return this.findPlayerBySocketId(socketId);
  }

  getSocketIds(): string[] {
    return this.players().map((player) => player.socketId);
  }

  isEmpty(): boolean {
    return this.playersBySlot.size === 0;
  }

  hasConnectedPlayers(): boolean {
    return this.players().some((player) => player.connected);
  }

  setMatchState(matchState: MatchState): RoomStatePayload {
    this.matchState = matchState;
    this.refreshState();
    return this.getStatePayload();
  }

  getMatchState(): MatchState {
    return this.matchState;
  }

  getStatePayload(): RoomStatePayload {
    return {
      matchId: this.matchId,
      roomState: this.state,
      players: this.players().map((player) => ({
        playerId: player.playerId,
        slot: player.slot,
        name: player.name,
        connected: player.connected,
        ready: player.ready
      }))
    };
  }

  private players(): RoomPlayer[] {
    return [...this.playersBySlot.values()].sort((a, b) => a.slot - b.slot);
  }

  private findPlayerBySocketId(socketId: string): RoomPlayer | undefined {
    return this.players().find((player) => player.socketId === socketId);
  }

  private nextAvailableSlot(): PlayerSlot | undefined {
    if (!this.playersBySlot.has(0)) {
      return 0;
    }
    if (!this.playersBySlot.has(1)) {
      return 1;
    }
    return undefined;
  }

  private refreshState(): void {
    const players = this.players();
    if (players.length === 0) {
      this.state = "CLOSED";
      return;
    }
    if (this.matchState === "VICTORY" || this.matchState === "DEFEAT") {
      this.state = "ENDED";
      return;
    }
    if (this.matchState === "COUNTDOWN") {
      this.state = "COUNTDOWN";
      return;
    }
    if (this.matchState !== "LOBBY") {
      this.state = "IN_MATCH";
      return;
    }
    if (players.length < 2) {
      this.state = "OPEN";
      return;
    }
    if (players.every((player) => player.ready && player.connected)) {
      this.state = "COUNTDOWN";
      return;
    }
    this.state = "FULL";
  }
}
