import http from "node:http";
import { Server } from "socket.io";
import {
  C2S,
  Phase0RuntimeConfig,
  PROJECT_VERSION,
  S2C,
  type AimInputPayload,
  type CreateRoomRequest,
  type DebugCommandPayload,
  type HealthCheckPayload,
  type JoinRoomRequest,
  type MoveInputPayload,
  type BuyAmmoRequestPayload,
  type PlantRequestPayload,
  type PlayerReadyRequestPayload,
  type ReloadRequestPayload,
  type RoomCreatedPayload,
  type RoomErrorPayload,
  type RoomJoinedPayload,
  type ShootRequestPayload
} from "@sprout-and-steel/shared";
import { GameLoop } from "./match/GameLoop";
import { GameRoom, type RoomPlayer } from "./rooms/GameRoom";
import { RoomManager } from "./rooms/RoomManager";

type RoomAckPayload = RoomCreatedPayload | RoomJoinedPayload | RoomErrorPayload;

const PORT = Number(process.env.PORT ?? Phase0RuntimeConfig.serverPort);
const HOST = process.env.HOST ?? Phase0RuntimeConfig.serverHost;
const roomManager = new RoomManager();
const activeMatchLoops = new Map<string, GameLoop>();

const httpServer = http.createServer((request, response) => {
  const payload: HealthCheckPayload = {
    ok: true,
    service: "sprout-and-steel-server",
    version: PROJECT_VERSION,
    phase: "phase-0"
  };

  if (request.url === "/" || request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(payload));
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ ok: false, error: "not_found" }));
});

const io = new Server(httpServer, {
  cors: {
    origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`[server] socket connected: ${socket.id}`);
  socket.emit("server.ready", {
    version: PROJECT_VERSION,
    message: "Phase 7 combat and weapon server is ready."
  });

  socket.on(C2S.ROOM_CREATE, (request: CreateRoomRequest, ack?: (payload: RoomAckPayload) => void) => {
    const created = roomManager.createRoom({
      ...request,
      socketId: socket.id
    });

    socket.join(created.matchId);
    socket.emit(S2C.ROOM_CREATED, omitRoom(created));
    ack?.(omitRoom(created));
    broadcastRoomState(created.room);
    console.log(`[room] created ${created.matchId}; socket=${socket.id}; slot=${created.playerSlot}`);
  });

  socket.on(C2S.ROOM_JOIN, (request: JoinRoomRequest, ack?: (payload: RoomAckPayload) => void) => {
    const joined = roomManager.joinRoom({
      ...request,
      socketId: socket.id
    });

    if (!joined.ok) {
      socket.emit(S2C.ROOM_ERROR, joined.error);
      ack?.(joined.error);
      console.log(`[room] join rejected ${request.matchId}; socket=${socket.id}; reason=${joined.error.reason}`);
      return;
    }

    socket.join(joined.payload.matchId);
    socket.emit(S2C.ROOM_JOINED, joined.payload);
    ack?.(joined.payload);
    broadcastRoomState(joined.room);
    console.log(`[room] joined ${joined.payload.matchId}; socket=${socket.id}; slot=${joined.payload.playerSlot}`);
  });

  socket.on(C2S.ROOM_LEAVE, () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    const state = roomManager.leaveBySocketId(socket.id);
    if (!room || !state) {
      return;
    }

    socket.leave(room.matchId);
    socket.emit(S2C.ROOM_STATE, state);
    io.to(room.matchId).emit(S2C.ROOM_STATE, state);
    if (!room.hasConnectedPlayers()) {
      stopMatchLoop(room.matchId, "room has no connected players");
      roomManager.deleteRoom(room.matchId);
    }
    console.log(`[room] left ${room.matchId}; socket=${socket.id}`);
  });

  socket.on(C2S.PLAYER_READY, (request: PlayerReadyRequestPayload) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    const state = roomManager.setPlayerReady(socket.id, request.ready);
    if (!room || !state) {
      const error: RoomErrorPayload = {
        reason: "ROOM_NOT_FOUND",
        message: "Join or create a room before setting ready."
      };
      socket.emit(S2C.ROOM_ERROR, error);
      return;
    }

    broadcastRoomState(room);
    if (state.roomState === "COUNTDOWN") {
      startMatchLoop(room);
    }
    console.log(`[room] ready ${room.matchId}; socket=${socket.id}; ready=${request.ready}; state=${state.roomState}`);
  });

  socket.on(C2S.INPUT_MOVE, (payload: MoveInputPayload) => {
    const playerContext = getPlayerLoopContext(socket.id);
    if (!playerContext) {
      return;
    }

    playerContext.loop.applyPlayerMoveInput(playerContext.player.playerId, payload);
  });

  socket.on(C2S.INPUT_AIM, (payload: AimInputPayload) => {
    const playerContext = getPlayerLoopContext(socket.id);
    if (!playerContext) {
      return;
    }

    playerContext.loop.applyPlayerAimInput(playerContext.player.playerId, payload);
  });

  socket.on(C2S.ACTION_PLANT, (payload: PlantRequestPayload) => {
    const playerContext = getPlayerLoopContext(socket.id);
    if (!playerContext) {
      socket.emit(S2C.ACTION_REJECTED, {
        requestId: payload.requestId,
        action: "plant",
        reason: "ROOM_NOT_READY",
        message: "Join a ready match before planting.",
        serverTimeMs: Date.now()
      });
      return;
    }

    const result = playerContext.loop.applyPlantAction(playerContext.player.playerId, payload);
    if (!result.ok) {
      socket.emit(S2C.ACTION_REJECTED, result.rejected);
      console.log(
        `[action] plant rejected ${playerContext.room.matchId}; player=${playerContext.player.playerId}; reason=${result.rejected.reason}`
      );
      return;
    }

    socket.emit(S2C.ACTION_ACCEPTED, result.accepted);
    io.to(playerContext.room.matchId).emit(S2C.FEEDBACK_EVENT, result.feedback);
    console.log(
      `[action] plant accepted ${playerContext.room.matchId}; player=${playerContext.player.playerId}; plant=${result.plant.id}`
    );
  });

  socket.on(C2S.ACTION_SHOOT, (payload: ShootRequestPayload) => {
    const playerContext = getPlayerLoopContext(socket.id);
    if (!playerContext) {
      socket.emit(S2C.ACTION_REJECTED, {
        requestId: payload.requestId,
        action: "shoot",
        reason: "ROOM_NOT_READY",
        message: "Join a ready match before shooting.",
        serverTimeMs: Date.now()
      });
      return;
    }

    const result = playerContext.loop.applyShootAction(playerContext.player.playerId, payload);
    if (!result.ok) {
      socket.emit(S2C.ACTION_REJECTED, result.rejected);
      if (result.feedback) {
        io.to(playerContext.room.matchId).emit(S2C.FEEDBACK_EVENT, result.feedback);
      }
      console.log(
        `[action] shoot rejected ${playerContext.room.matchId}; player=${playerContext.player.playerId}; reason=${result.rejected.reason}`
      );
      return;
    }

    socket.emit(S2C.ACTION_ACCEPTED, result.accepted);
    if (result.feedback) {
      io.to(playerContext.room.matchId).emit(S2C.FEEDBACK_EVENT, result.feedback);
    }
  });

  socket.on(C2S.ACTION_RELOAD, (payload: ReloadRequestPayload) => {
    const playerContext = getPlayerLoopContext(socket.id);
    if (!playerContext) {
      socket.emit(S2C.ACTION_REJECTED, {
        requestId: payload.requestId,
        action: "reload",
        reason: "ROOM_NOT_READY",
        message: "Join a ready match before reloading.",
        serverTimeMs: Date.now()
      });
      return;
    }

    const result = playerContext.loop.applyReloadAction(playerContext.player.playerId, payload);
    if (!result.ok) {
      socket.emit(S2C.ACTION_REJECTED, result.rejected);
      console.log(
        `[action] reload rejected ${playerContext.room.matchId}; player=${playerContext.player.playerId}; reason=${result.rejected.reason}`
      );
      return;
    }

    socket.emit(S2C.ACTION_ACCEPTED, result.accepted);
    if (result.feedback) {
      io.to(playerContext.room.matchId).emit(S2C.FEEDBACK_EVENT, result.feedback);
    }
  });

  socket.on(C2S.ACTION_BUY_AMMO, (payload: BuyAmmoRequestPayload) => {
    const playerContext = getPlayerLoopContext(socket.id);
    if (!playerContext) {
      socket.emit(S2C.ACTION_REJECTED, {
        requestId: payload.requestId,
        action: "buyAmmo",
        reason: "ROOM_NOT_READY",
        message: "Join a ready match before buying ammo.",
        serverTimeMs: Date.now()
      });
      return;
    }

    const result = playerContext.loop.applyBuyAmmoAction(playerContext.player.playerId, payload);
    if (!result.ok) {
      socket.emit(S2C.ACTION_REJECTED, result.rejected);
      console.log(
        `[action] buyAmmo rejected ${playerContext.room.matchId}; player=${playerContext.player.playerId}; reason=${result.rejected.reason}`
      );
      return;
    }

    socket.emit(S2C.ACTION_ACCEPTED, result.accepted);
  });

  socket.on(C2S.DEBUG_COMMAND, (payload: DebugCommandPayload, ack?: (payload: { ok: boolean; reason?: string }) => void) => {
    if (process.env.NODE_ENV === "production") {
      const result = {
        ok: false,
        reason: "DEBUG_DISABLED"
      };
      ack?.(result);
      socket.emit(S2C.SERVER_WARNING, {
        code: result.reason,
        message: "Debug commands are disabled in production."
      });
      return;
    }

    const playerContext = getPlayerLoopContext(socket.id);
    if (!playerContext) {
      const result = {
        ok: false,
        reason: "ROOM_NOT_READY"
      };
      ack?.(result);
      return;
    }

    const result = playerContext.loop.applyDebugCommand(payload);
    ack?.(result);
    if (result.ok) {
      io.to(playerContext.room.matchId).emit(S2C.STATE_SNAPSHOT, playerContext.loop.getCurrentSnapshot());
    }
  });

  socket.on("disconnect", (reason) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    const state = roomManager.disconnectBySocketId(socket.id);
    if (room && state) {
      io.to(room.matchId).emit(S2C.ROOM_STATE, state);
      console.log(`[room] disconnected ${room.matchId}; socket=${socket.id}; reason=${reason}`);
      if (!room.hasConnectedPlayers()) {
        stopMatchLoop(room.matchId, "all players disconnected");
        roomManager.deleteRoom(room.matchId);
        console.log(`[room] closed ${room.matchId}; reason=all players disconnected`);
      }
    }
    console.log(`[server] socket disconnected: ${socket.id} (${reason})`);
  });
});

httpServer.listen(PORT, HOST, () => {
  console.log(`[server] Sprout & Steel ${PROJECT_VERSION} Phase 7 listening on http://${HOST}:${PORT}`);
});

function broadcastRoomState(room: GameRoom): void {
  io.to(room.matchId).emit(S2C.ROOM_STATE, room.getStatePayload());
}

function startMatchLoop(room: GameRoom): void {
  if (activeMatchLoops.has(room.matchId)) {
    return;
  }

  const loop = new GameLoop({
    matchId: room.matchId,
    getRoomState: () => room.getStatePayload(),
    onPhaseChanged: (event) => {
      const state = room.setMatchState(event.nextState);
      io.to(room.matchId).emit(S2C.MATCH_PHASE_CHANGED, event);
      io.to(room.matchId).emit(S2C.ROOM_STATE, state);
      console.log(`[match] phase ${room.matchId}: ${event.previousState} -> ${event.nextState}`);
    },
    onSnapshot: (snapshot) => {
      io.to(room.matchId).emit(S2C.STATE_SNAPSHOT, snapshot);
    }
  });

  activeMatchLoops.set(room.matchId, loop);
  loop.start();
  console.log(`[match] loop started ${room.matchId}`);
}

function stopMatchLoop(matchId: string, reason: string): void {
  const loop = activeMatchLoops.get(matchId);
  if (!loop) {
    return;
  }

  loop.stop();
  activeMatchLoops.delete(matchId);
  console.log(`[match] loop stopped ${matchId}; reason=${reason}`);
}

function getPlayerLoopContext(socketId: string): { room: GameRoom; player: RoomPlayer; loop: GameLoop } | undefined {
  const room = roomManager.getRoomBySocketId(socketId);
  if (!room) {
    return undefined;
  }

  const player = room.getPlayerBySocketId(socketId);
  const loop = activeMatchLoops.get(room.matchId);
  if (!player || !loop) {
    return undefined;
  }

  return { room, player, loop };
}

function omitRoom(created: RoomCreatedPayload & { room: GameRoom }): RoomCreatedPayload {
  return {
    matchId: created.matchId,
    playerId: created.playerId,
    playerSlot: created.playerSlot,
    reconnectToken: created.reconnectToken
  };
}
