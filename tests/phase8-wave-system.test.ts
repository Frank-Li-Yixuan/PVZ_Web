import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GameLoop } from "../server/src/match/GameLoop";
import { WaveSystem } from "../server/src/systems/WaveSystem";
import {
  CombatNumbersV01,
  WavesV01,
  type GameStateSnapshot,
  type RoomState,
  type RoomStatePayload
} from "../shared/src";

describe("Phase 8 WaveSystem", () => {
  test("starts Wave 1 after prep and spawns exactly the configured events", () => {
    const waves = new WaveSystem();

    expect(waves.getSnapshot()).toMatchObject({
      currentWaveIndex: 1,
      totalWaves: WavesV01.length,
      spawnedInWave: 0,
      remainingInWave: WavesV01[0]?.events.length,
      waveSpawnComplete: false,
      enemiesRemainingInWave: WavesV01[0]?.events.length,
      evolutionUnlocked: false
    });

    const prepResult = waves.update({
      matchState: "WAVE_PREP",
      deltaSeconds: CombatNumbersV01.match.wave1PrepSeconds,
      activeEnemyCount: 0,
      baseHp: CombatNumbersV01.base.maxHp,
      serverTimeMs: 15_000
    });

    expect(prepResult.transitions).toEqual([{ nextState: "WAVE_ACTIVE", waveIndex: 1 }]);
    expect(prepResult.spawns).toEqual([
      {
        enemyType: "shambler",
        laneIndex: 2,
        waveIndex: 1,
        eventIndex: 0,
        serverTimeMs: 15_000
      }
    ]);

    const spawned: Array<{ enemyType: string; laneIndex: number; waveIndex: number; eventIndex: number }> =
      prepResult.spawns.map(({ enemyType, laneIndex, waveIndex, eventIndex }) => ({
        enemyType,
        laneIndex,
        waveIndex,
        eventIndex
      }));

    for (let eventIndex = 1; eventIndex < WavesV01[0].events.length; eventIndex += 1) {
      const previous = WavesV01[0].events[eventIndex - 1];
      const next = WavesV01[0].events[eventIndex];
      if (!previous || !next) {
        throw new Error("Wave 1 test config is missing an event.");
      }

      const result = waves.update({
        matchState: "WAVE_ACTIVE",
        deltaSeconds: next.time - previous.time,
        activeEnemyCount: spawned.length,
        baseHp: CombatNumbersV01.base.maxHp,
        serverTimeMs: 15_000 + next.time * 1000
      });

      spawned.push(
        ...result.spawns.map(({ enemyType, laneIndex, waveIndex, eventIndex }) => ({
          enemyType,
          laneIndex,
          waveIndex,
          eventIndex
        }))
      );
    }

    expect(spawned).toEqual(
      WavesV01[0].events.map((event, eventIndex) => ({
        enemyType: event.enemyType,
        laneIndex: event.lane,
        waveIndex: 1,
        eventIndex
      }))
    );
    expect(waves.getSnapshot()).toMatchObject({
      spawnedInWave: WavesV01[0].events.length,
      waveSpawnComplete: true
    });
  });

  test("clears only after all events are spawned and active enemies are resolved", () => {
    const waves = new WaveSystem();

    waves.update({
      matchState: "WAVE_PREP",
      deltaSeconds: CombatNumbersV01.match.wave1PrepSeconds,
      activeEnemyCount: 0,
      baseHp: CombatNumbersV01.base.maxHp,
      serverTimeMs: 1_000
    });

    const prematureClear = waves.update({
      matchState: "WAVE_ACTIVE",
      deltaSeconds: 0,
      activeEnemyCount: 0,
      baseHp: CombatNumbersV01.base.maxHp,
      serverTimeMs: 1_000
    });

    expect(prematureClear.transitions).toEqual([]);

    waves.update({
      matchState: "WAVE_ACTIVE",
      deltaSeconds: 30,
      activeEnemyCount: 1,
      baseHp: CombatNumbersV01.base.maxHp,
      serverTimeMs: 31_000
    });

    const blockedByBase = waves.update({
      matchState: "WAVE_ACTIVE",
      deltaSeconds: 0,
      activeEnemyCount: 0,
      baseHp: 0,
      serverTimeMs: 31_000
    });
    expect(blockedByBase.transitions).toEqual([]);

    const clear = waves.update({
      matchState: "WAVE_ACTIVE",
      deltaSeconds: 0,
      activeEnemyCount: 0,
      baseHp: CombatNumbersV01.base.maxHp,
      serverTimeMs: 31_000
    });

    expect(clear.transitions).toEqual([{ nextState: "WAVE_CLEAR", waveIndex: 1 }]);
    expect(waves.getSnapshot()).toMatchObject({
      spawnedInWave: WavesV01[0].events.length,
      remainingInWave: 0,
      enemiesRemainingInWave: 0,
      waveSpawnComplete: true,
      evolutionUnlocked: false
    });
  });

  test("progresses Waves 1-5, unlocks evolution after Wave 3 clear, and enters Boss prep after Wave 5", () => {
    const waves = new WaveSystem();
    let matchState: "WAVE_PREP" | "WAVE_ACTIVE" | "WAVE_CLEAR" | "BOSS_PREP" = "WAVE_PREP";

    for (const wave of WavesV01) {
      const prepSeconds =
        wave.wave === 1 ? CombatNumbersV01.match.wave1PrepSeconds : CombatNumbersV01.match.normalWavePrepSeconds;
      const prep = waves.update({
        matchState,
        deltaSeconds: prepSeconds,
        activeEnemyCount: 0,
        baseHp: CombatNumbersV01.base.maxHp,
        serverTimeMs: wave.wave * 100_000
      });

      expect(prep.transitions).toEqual([{ nextState: "WAVE_ACTIVE", waveIndex: wave.wave }]);
      matchState = "WAVE_ACTIVE";

      const lastSpawnTime = wave.events.at(-1)?.time ?? 0;
      const active = waves.update({
        matchState,
        deltaSeconds: lastSpawnTime,
        activeEnemyCount: prep.spawns.length,
        baseHp: CombatNumbersV01.base.maxHp,
        serverTimeMs: wave.wave * 100_000 + lastSpawnTime * 1000
      });

      const waveSpawns = [...prep.spawns, ...active.spawns];
      expect(waveSpawns).toHaveLength(wave.events.length);

      const clear = waves.update({
        matchState,
        deltaSeconds: 0,
        activeEnemyCount: 0,
        baseHp: CombatNumbersV01.base.maxHp,
        serverTimeMs: wave.wave * 100_000 + lastSpawnTime * 1000 + 1
      });
      expect(clear.transitions).toEqual([{ nextState: "WAVE_CLEAR", waveIndex: wave.wave }]);
      matchState = "WAVE_CLEAR";

      if (wave.wave >= CombatNumbersV01.evolution.unlockAfterWaveCleared) {
        expect(waves.getSnapshot().evolutionUnlocked).toBe(true);
      }

      const afterClear = waves.update({
        matchState,
        deltaSeconds: CombatNumbersV01.match.waveClearSeconds,
        activeEnemyCount: 0,
        baseHp: CombatNumbersV01.base.maxHp,
        serverTimeMs: wave.wave * 100_000 + lastSpawnTime * 1000 + 5_001
      });

      if (wave.wave === 5) {
        expect(afterClear.transitions).toEqual([{ nextState: "BOSS_PREP", waveIndex: 5 }]);
        matchState = "BOSS_PREP";
      } else {
        expect(afterClear.transitions).toEqual([{ nextState: "WAVE_PREP", waveIndex: wave.wave + 1 }]);
        matchState = "WAVE_PREP";
        expect(waves.getSnapshot().currentWaveIndex).toBe(wave.wave + 1);
      }
    }
  });
});

describe("Phase 8 GameLoop wave integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(800_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("starts Wave 1 after prep and spawns the first configured enemy without a debug command", () => {
    const phases: string[] = [];
    const harness = runLoopWithRoom(phases);

    harness.loop.start();
    vi.advanceTimersByTime(
      (CombatNumbersV01.match.countdownSeconds + CombatNumbersV01.match.wave1PrepSeconds) * 1000 + 100
    );

    const snapshot = harness.loop.getCurrentSnapshot();
    expect(phases).toEqual(expect.arrayContaining(["COUNTDOWN", "WAVE_PREP", "WAVE_ACTIVE"]));
    expect(snapshot.matchState).toBe("WAVE_ACTIVE");
    expect(snapshot.wave).toMatchObject({
      currentWaveIndex: 1,
      totalWaves: WavesV01.length,
      spawnedInWave: 1,
      waveSpawnComplete: false,
      evolutionUnlocked: false
    });
    expect(snapshot.enemies).toEqual([
      expect.objectContaining({
        type: WavesV01[0].events[0]?.enemyType,
        laneIndex: WavesV01[0].events[0]?.lane,
        state: "MOVING"
      })
    ]);
  });
});

function runLoopWithRoom(phases: string[]): {
  loop: GameLoop;
  latest: () => GameStateSnapshot;
} {
  const snapshots: GameStateSnapshot[] = [];
  let roomState: RoomState = "COUNTDOWN";
  const roomPayload = (): RoomStatePayload => ({
    matchId: "match_phase_8",
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
    matchId: "match_phase_8",
    getRoomState: roomPayload,
    onPhaseChanged: (event) => {
      phases.push(event.nextState);
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
