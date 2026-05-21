import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  C2S,
  CombatNumbersV01,
  MapConfigV01,
  MATCH_STATES,
  NetworkTimingV01,
  S2C,
  WavesV01,
  createEntityId,
  isGridCellInBounds,
  isLaneIndex,
  normalizeVector,
  type ActionAcceptedPayload,
  type ActionRejectedPayload,
  type FeedbackEvent,
  type GameStateSnapshot
} from "../shared/src";

describe("Phase 1 shared contracts", () => {
  test("exports required state and network event contracts", () => {
    expect(MATCH_STATES).toEqual([
      "LOBBY",
      "COUNTDOWN",
      "WAVE_PREP",
      "WAVE_ACTIVE",
      "WAVE_CLEAR",
      "BOSS_PREP",
      "BOSS_ACTIVE",
      "VICTORY",
      "DEFEAT"
    ]);

    expect(C2S).toMatchObject({
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
      CLIENT_PONG: "client.pong"
    });

    expect(S2C).toMatchObject({
      ROOM_CREATED: "room.created",
      ROOM_JOINED: "room.joined",
      ROOM_STATE: "room.state",
      ROOM_ERROR: "room.error",
      MATCH_STARTED: "match.started",
      STATE_SNAPSHOT: "state.snapshot",
      ACTION_ACCEPTED: "action.accepted",
      ACTION_REJECTED: "action.rejected",
      FEEDBACK_EVENT: "event.feedback",
      MATCH_ENDED: "match.ended",
      SERVER_PING: "server.ping"
    });
  });

  test("matches V0.1 map, network timing, combat, and wave config from docs", () => {
    expect(MapConfigV01.laneCount).toBe(5);
    expect(MapConfigV01.plantableColumnCount).toBe(7);
    expect(MapConfigV01.cellWidthPx).toBe(96);
    expect(MapConfigV01.laneHeightPx).toBe(72);
    expect(NetworkTimingV01).toMatchObject({
      serverTickRate: 20,
      snapshotRate: 10,
      clientInputRate: 20,
      interpolationDelayMs: 120,
      pingIntervalMs: 5000,
      disconnectGraceMs: 20000
    });

    expect(CombatNumbersV01.economy.initialSharedSun).toBe(150);
    expect(CombatNumbersV01.base.maxHp).toBe(10);
    expect(CombatNumbersV01.weapon.pistol.damage).toBe(25);
    expect(CombatNumbersV01.weapon.pistol.magazineSize).toBe(8);
    expect(CombatNumbersV01.plants.peashotter.sunCost).toBe(100);
    expect(CombatNumbersV01.enemies.brute.maxHp).toBe(260);
    expect(CombatNumbersV01.evolution.sunCost).toBe(200);
    expect(CombatNumbersV01.boss.ironmaw.maxHp).toBe(6000);
    expect(CombatNumbersV01.boss.ironmaw.charge.requiredInterruptPoints).toBe(6);

    expect(WavesV01).toHaveLength(5);
    expect(WavesV01.map((wave) => wave.events.length)).toEqual([6, 9, 12, 14, 21]);
    expect(WavesV01[4]?.events.at(-1)).toEqual({ time: 72, lane: 2, enemyType: "brute" });
  });

  test("supports representative snapshot, action, and feedback payload shapes", () => {
    const accepted: ActionAcceptedPayload = {
      requestId: "req_1",
      action: "plant",
      serverTimeMs: 1000
    };
    const rejected: ActionRejectedPayload = {
      requestId: "req_2",
      action: "shoot",
      reason: "AMMO_EMPTY",
      message: "Magazine is empty.",
      serverTimeMs: 1001
    };
    const feedback: FeedbackEvent = {
      id: "evt_1",
      eventType: "plant.placed",
      serverTimeMs: 1002,
      entityId: "plant_1"
    };
    const snapshot: GameStateSnapshot = {
      matchId: "match_1",
      serverSeq: 1,
      serverTimeMs: 1003,
      matchState: "WAVE_PREP",
      roomState: "IN_MATCH",
      time: {
        elapsedMatchSeconds: 3,
        stateElapsedSeconds: 3,
        stateRemainingSeconds: 12
      },
      economy: {
        sharedSun: 150,
        totalSunEarned: 0,
        totalSunSpent: 0,
        sunSuppressed: false
      },
      base: {
        hp: 10,
        maxHp: 10
      },
      players: [],
      plants: [],
      enemies: [],
      bullets: [],
      wave: {
        currentWaveIndex: 1,
        totalWaves: 5,
        spawnedInWave: 0,
        remainingInWave: 6,
        waveSpawnComplete: false,
        enemiesRemainingInWave: 6,
        evolutionUnlocked: false
      },
      events: [feedback]
    };

    expect(accepted.action).toBe("plant");
    expect(rejected.reason).toBe("AMMO_EMPTY");
    expect(snapshot.events?.[0]?.eventType).toBe("plant.placed");
  });

  test("exports utility helpers without implementing gameplay systems", () => {
    expect(isLaneIndex(0)).toBe(true);
    expect(isLaneIndex(5)).toBe(false);
    expect(isGridCellInBounds({ laneIndex: 4, columnIndex: 6 })).toBe(true);
    expect(isGridCellInBounds({ laneIndex: 5, columnIndex: 0 })).toBe(false);
    expect(normalizeVector({ x: 3, y: 4 })).toEqual({ x: 0.6, y: 0.8 });
    expect(createEntityId("plant", 12)).toBe("plant_12");
  });

  test("keeps authoritative schema definitions out of client and server packages", () => {
    const scannedRoots = ["client/src", "server/src"];
    const schemaPatterns = [
      /\bexport\s+type\s+MatchState\b/,
      /\bexport\s+type\s+GameStateSnapshot\b/,
      /\bexport\s+const\s+C2S\b/,
      /\bexport\s+const\s+S2C\b/,
      /\bCombatNumbersV01\s*=\s*\{/
    ];

    for (const root of scannedRoots) {
      for (const filePath of listSourceFiles(root)) {
        const source = readFileSync(filePath, "utf8");
        for (const pattern of schemaPatterns) {
          expect(source, `${filePath} must import shared contracts instead of redefining ${pattern}`).not.toMatch(pattern);
        }
      }
    }
  });
});

function listSourceFiles(root: string): string[] {
  if (!existsSync(root)) {
    return [];
  }

  const results: string[] = [];
  for (const entry of readdirSync(root)) {
    const fullPath = join(root, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...listSourceFiles(fullPath));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry)) {
      results.push(fullPath);
    }
  }
  return results;
}
