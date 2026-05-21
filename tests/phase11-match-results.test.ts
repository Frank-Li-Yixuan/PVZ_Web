import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GameLoop } from "../server/src/match/GameLoop";
import {
  CombatNumbersV01,
  type DebugCommandPayload,
  type GameStateSnapshot,
  type MatchEndedPayload,
  type RoomState,
  type RoomStatePayload
} from "../shared/src";

describe("Phase 11 match results", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(700_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("emits one authoritative victory result with final snapshot and player/server stats", () => {
    const harness = runLoopWithRoom();

    harness.loop.start();
    vi.advanceTimersByTime(CombatNumbersV01.match.countdownSeconds * 1000 + 400);

    harness.loop.applyPlayerMoveInput("player_0", { dirX: 1, dirY: 0 });
    vi.advanceTimersByTime(400);

    expect(
      harness.loop.applyPlantAction("player_0", {
        requestId: "plant_phase11",
        plantType: "sunbloom",
        laneIndex: 1,
        columnIndex: 0
      }).ok
    ).toBe(true);
    expect(
      harness.loop.applyBuyAmmoAction("player_1", {
        requestId: "ammo_phase11"
      }).ok
    ).toBe(true);
    expect(harness.loop.applyDebugCommand({ command: "addSun", amount: 25 }).ok).toBe(true);

    expect(harness.loop.applyDebugCommand({ command: "forceVictory" } as unknown as DebugCommandPayload).ok).toBe(true);

    expect(harness.matchEnded).toHaveLength(1);
    const ended = harness.matchEnded[0];
    expect(ended).toBeDefined();
    if (!ended) {
      throw new Error("Expected match.ended payload.");
    }
    expect(ended).toMatchObject({
      matchId: "match_phase_11",
      result: "VICTORY",
      stats: {
        result: "VICTORY",
        finalWave: 1,
        baseHpRemaining: CombatNumbersV01.base.maxHp,
        totalSunEarned: 25,
        totalSunSpent: CombatNumbersV01.plants.sunbloom.sunCost + CombatNumbersV01.weapon.ammoPack.sunCost,
        totalPlantsPlaced: 1,
        totalEnemiesKilled: 0,
        bossDamageTotal: 0
      },
      finalSnapshot: expect.objectContaining({
        matchState: "VICTORY",
        base: {
          hp: CombatNumbersV01.base.maxHp,
          maxHp: CombatNumbersV01.base.maxHp
        }
      })
    });
    expect(ended.stats.clearTimeSeconds).toBeGreaterThan(0);
    expect(ended.stats.players).toEqual([
      expect.objectContaining({
        playerId: "player_0",
        plantsPlaced: 1,
        sunSpentByActions: CombatNumbersV01.plants.sunbloom.sunCost,
        ammoPurchases: 0,
        evolutionPath: null
      }),
      expect.objectContaining({
        playerId: "player_1",
        plantsPlaced: 0,
        sunSpentByActions: CombatNumbersV01.weapon.ammoPack.sunCost,
        ammoPurchases: 1,
        evolutionPath: null
      })
    ]);
    expect(harness.latestSnapshot()).toEqual(ended.finalSnapshot);
    expect(harness.loop.getCurrentSnapshot()).toEqual(ended.finalSnapshot);
  });

  test("emits defeat results, preserves final snapshot, and rejects combat mutation after result", () => {
    const harness = runLoopWithRoom();

    harness.loop.start();
    vi.advanceTimersByTime(CombatNumbersV01.match.countdownSeconds * 1000 + 100);

    expect(harness.loop.applyDebugCommand({ command: "forceDefeat" } as unknown as DebugCommandPayload).ok).toBe(true);

    expect(harness.matchEnded).toHaveLength(1);
    const ended = harness.matchEnded[0];
    expect(ended).toBeDefined();
    if (!ended) {
      throw new Error("Expected match.ended payload.");
    }
    expect(ended).toMatchObject({
      result: "DEFEAT",
      stats: {
        result: "DEFEAT",
        baseHpRemaining: 0
      },
      finalSnapshot: expect.objectContaining({
        matchState: "DEFEAT",
        base: {
          hp: 0,
          maxHp: CombatNumbersV01.base.maxHp
        }
      })
    });

    const finalSnapshot = ended.finalSnapshot;
    expect(harness.loop.applyDebugCommand({ command: "addSun", amount: 999 }).ok).toBe(false);
    vi.advanceTimersByTime(1_000);
    expect(harness.loop.isRunning()).toBe(false);
    expect(harness.loop.getCurrentSnapshot()).toEqual(finalSnapshot);
  });
});

function runLoopWithRoom(): {
  loop: GameLoop;
  latestSnapshot: () => GameStateSnapshot;
  matchEnded: MatchEndedPayload[];
} {
  const snapshots: GameStateSnapshot[] = [];
  const matchEnded: MatchEndedPayload[] = [];
  let roomState: RoomState = "COUNTDOWN";
  const roomPayload = (): RoomStatePayload => ({
    matchId: "match_phase_11",
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
    matchId: "match_phase_11",
    getRoomState: roomPayload,
    onPhaseChanged: (event) => {
      roomState = event.nextState === "COUNTDOWN" ? "COUNTDOWN" : "IN_MATCH";
    },
    onSnapshot: (snapshot) => snapshots.push(snapshot),
    onMatchEnded: (payload: MatchEndedPayload) => matchEnded.push(payload)
  });

  return {
    loop,
    matchEnded,
    latestSnapshot: () => {
      const latest = snapshots.at(-1);
      if (!latest) {
        throw new Error("No snapshot captured.");
      }
      return latest;
    }
  };
}
