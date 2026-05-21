import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GameLoop } from "../server/src/match/GameLoop";
import {
  CombatNumbersV01,
  MapConfigV01,
  clampPointToMapBounds,
  getLaneCenterY,
  getPlantCellCenter,
  getPlayerSpawnPosition,
  type RoomState,
  type RoomStatePayload
} from "../shared/src";

describe("Phase 4 map geometry", () => {
  test("derives lane centers, plant cell centers, and player spawns from shared map config", () => {
    expect(MapConfigV01.laneCount).toBe(5);
    expect(MapConfigV01.plantableColumnCount).toBe(7);
    expect(getLaneCenterY(0)).toBe(MapConfigV01.plantGrid.originY + MapConfigV01.laneHeightPx / 2);
    expect(getLaneCenterY(4)).toBe(MapConfigV01.plantGrid.originY + MapConfigV01.laneHeightPx * 4.5);
    expect(getPlantCellCenter({ laneIndex: 2, columnIndex: 3 })).toEqual({
      x: MapConfigV01.plantGrid.originX + MapConfigV01.cellWidthPx * 3.5,
      y: MapConfigV01.plantGrid.originY + MapConfigV01.laneHeightPx * 2.5
    });
    expect(getPlayerSpawnPosition(0)).toEqual(MapConfigV01.playerSpawns[0]);
    expect(getPlayerSpawnPosition(1)).toEqual(MapConfigV01.playerSpawns[1]);
  });

  test("clamps player centers inside map bounds with collision radius padding", () => {
    expect(clampPointToMapBounds({ x: -1000, y: 9999 }, CombatNumbersV01.hero.collisionRadius)).toEqual({
      x: MapConfigV01.playerBounds.minX + CombatNumbersV01.hero.collisionRadius,
      y: MapConfigV01.playerBounds.maxY - CombatNumbersV01.hero.collisionRadius
    });
  });
});

describe("Phase 4 server-authoritative movement", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(200_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("initializes spawn positions and applies normalized movement at configured hero speed", () => {
    const snapshots = runLoopWithRoom();
    const { loop } = snapshots;
    const spawn = getPlayerSpawnPosition(0);

    loop.start();
    loop.applyPlayerMoveInput("player_0", { dirX: 3, dirY: 4 });

    vi.advanceTimersByTime(1000);

    const latest = snapshots.latest();
    const moved = latest.players.find((player) => player.playerId === "player_0");

    expect(moved?.x).toBeCloseTo(spawn.x + CombatNumbersV01.hero.moveSpeed * 0.6, 1);
    expect(moved?.y).toBeCloseTo(spawn.y + CombatNumbersV01.hero.moveSpeed * 0.8, 1);
  });

  test("clamps movement to the configured map bounds", () => {
    const snapshots = runLoopWithRoom();
    const { loop } = snapshots;

    loop.start();
    loop.applyPlayerMoveInput("player_0", { dirX: -1, dirY: -1 });

    vi.advanceTimersByTime(5000);

    const latest = snapshots.latest();
    const moved = latest.players.find((player) => player.playerId === "player_0");

    expect(moved?.x).toBe(MapConfigV01.playerBounds.minX + CombatNumbersV01.hero.collisionRadius);
    expect(moved?.y).toBe(MapConfigV01.playerBounds.minY + CombatNumbersV01.hero.collisionRadius);
  });

  test("normalizes aim from player position toward the latest aim world point", () => {
    const snapshots = runLoopWithRoom();
    const { loop } = snapshots;
    const spawn = getPlayerSpawnPosition(1);

    loop.start();
    loop.applyPlayerAimInput("player_1", { worldX: spawn.x, worldY: spawn.y + 100 });
    vi.advanceTimersByTime(100);

    const latest = snapshots.latest();
    const aimed = latest.players.find((player) => player.playerId === "player_1");

    expect(aimed?.aimX).toBeCloseTo(0);
    expect(aimed?.aimY).toBeCloseTo(1);
  });
});

function runLoopWithRoom(): {
  loop: GameLoop;
  latest: () => ReturnType<GameLoop["getCurrentSnapshot"]>;
} {
  const snapshots: ReturnType<GameLoop["getCurrentSnapshot"]>[] = [];
  let roomState: RoomState = "COUNTDOWN";
  const roomPayload = (): RoomStatePayload => ({
    matchId: "match_phase_4",
    roomState,
    players: [
      {
        playerId: "player_0",
        slot: 0,
        name: "Player A",
        connected: true,
        ready: true
      },
      {
        playerId: "player_1",
        slot: 1,
        name: "Player B",
        connected: true,
        ready: true
      }
    ]
  });
  const loop = new GameLoop({
    matchId: "match_phase_4",
    getRoomState: roomPayload,
    onPhaseChanged: (event) => {
      roomState = event.nextState === "COUNTDOWN" ? "COUNTDOWN" : "IN_MATCH";
    },
    onSnapshot: (snapshot) => snapshots.push(snapshot)
  });

  return {
    loop,
    latest: () => {
      const latest = snapshots.at(-1);
      if (!latest) {
        throw new Error("No snapshot captured.");
      }
      return latest;
    }
  };
}
