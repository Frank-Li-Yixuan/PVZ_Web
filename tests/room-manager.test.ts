import { describe, expect, test } from "vitest";
import { RoomManager } from "../server/src/rooms/RoomManager";

describe("Phase 2 RoomManager", () => {
  test("creates a room with the creator in fixed slot 0 and a reconnect token", () => {
    const manager = new RoomManager(() => "id1");

    const created = manager.createRoom({
      socketId: "socket_a",
      playerName: "Player A",
      clientVersion: "0.1.0"
    });

    expect(created.matchId).toBe("room_id1");
    expect(created.playerSlot).toBe(0);
    expect(created.reconnectToken).toBe("reconnect_id1");
    expect(created.room.getStatePayload()).toEqual({
      matchId: "room_id1",
      roomState: "OPEN",
      players: [
        {
          playerId: "player_id1",
          slot: 0,
          name: "Player A",
          connected: true,
          ready: false
        }
      ]
    });
  });

  test("joins the second player into fixed slot 1 and rejects missing rooms", () => {
    const manager = new RoomManager(() => "id2");
    const created = manager.createRoom({
      socketId: "socket_a",
      playerName: "Player A",
      clientVersion: "0.1.0"
    });

    const missing = manager.joinRoom({
      matchId: "room_missing",
      socketId: "socket_b",
      playerName: "Player B",
      clientVersion: "0.1.0"
    });
    const joined = manager.joinRoom({
      matchId: created.matchId,
      socketId: "socket_b",
      playerName: "Player B",
      clientVersion: "0.1.0"
    });

    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.reason).toBe("ROOM_NOT_FOUND");
    }
    expect(joined.ok).toBe(true);
    if (joined.ok) {
      expect(joined.payload.playerSlot).toBe(1);
      expect(joined.room.getStatePayload().roomState).toBe("FULL");
      expect(joined.room.getStatePayload().players.map((player) => player.slot)).toEqual([0, 1]);
    }
  });

  test("rejects a third active player with ROOM_FULL", () => {
    const manager = new RoomManager(() => "id3");
    const created = manager.createRoom({
      socketId: "socket_a",
      playerName: "Player A",
      clientVersion: "0.1.0"
    });
    manager.joinRoom({
      matchId: created.matchId,
      socketId: "socket_b",
      playerName: "Player B",
      clientVersion: "0.1.0"
    });

    const third = manager.joinRoom({
      matchId: created.matchId,
      socketId: "socket_c",
      playerName: "Player C",
      clientVersion: "0.1.0"
    });

    expect(third.ok).toBe(false);
    if (!third.ok) {
      expect(third.error.reason).toBe("ROOM_FULL");
    }
  });

  test("syncs ready states and moves a full ready room into countdown", () => {
    const manager = new RoomManager(() => "id4");
    const created = manager.createRoom({
      socketId: "socket_a",
      playerName: "Player A",
      clientVersion: "0.1.0"
    });
    const joined = manager.joinRoom({
      matchId: created.matchId,
      socketId: "socket_b",
      playerName: "Player B",
      clientVersion: "0.1.0"
    });
    if (!joined.ok) {
      throw new Error("second player should join");
    }

    const firstReady = manager.setPlayerReady("socket_a", true);
    const secondReady = manager.setPlayerReady("socket_b", true);

    expect(firstReady?.roomState).toBe("FULL");
    expect(secondReady?.roomState).toBe("COUNTDOWN");
    expect(secondReady?.players.map((player) => player.ready)).toEqual([true, true]);
  });

  test("leaves room by socket id and frees the slot", () => {
    const manager = new RoomManager(() => "id5");
    const created = manager.createRoom({
      socketId: "socket_a",
      playerName: "Player A",
      clientVersion: "0.1.0"
    });
    manager.joinRoom({
      matchId: created.matchId,
      socketId: "socket_b",
      playerName: "Player B",
      clientVersion: "0.1.0"
    });

    const afterLeave = manager.leaveBySocketId("socket_b");
    const replacement = manager.joinRoom({
      matchId: created.matchId,
      socketId: "socket_c",
      playerName: "Player C",
      clientVersion: "0.1.0"
    });

    expect(afterLeave?.players).toHaveLength(1);
    expect(replacement.ok).toBe(true);
    if (replacement.ok) {
      expect(replacement.payload.playerSlot).toBe(1);
    }
  });
});
