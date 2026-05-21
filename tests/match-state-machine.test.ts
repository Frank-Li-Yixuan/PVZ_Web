import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GameLoop } from "../server/src/match/GameLoop";
import { MatchStateMachine } from "../server/src/match/MatchStateMachine";
import { CombatNumbersV01, type RoomState, type RoomStatePayload } from "../shared/src";

describe("Phase 3 MatchStateMachine", () => {
  test("starts in LOBBY and emits a countdown phase change", () => {
    const machine = new MatchStateMachine("match_phase_3");

    expect(machine.getMatchState()).toBe("LOBBY");

    const event = machine.startCountdown(1000);

    expect(event).toMatchObject({
      type: "match.phaseChanged",
      matchId: "match_phase_3",
      previousState: "LOBBY",
      nextState: "COUNTDOWN",
      serverTimeMs: 1000,
      waveIndex: 1
    });
    expect(machine.getMatchState()).toBe("COUNTDOWN");
    expect(machine.getTime()).toEqual({
      elapsedMatchSeconds: 0,
      stateElapsedSeconds: 0,
      stateRemainingSeconds: CombatNumbersV01.match.countdownSeconds
    });
  });

  test("advances from COUNTDOWN to WAVE_PREP after the configured countdown", () => {
    const machine = new MatchStateMachine("match_phase_3");
    machine.startCountdown(0);

    expect(machine.update(CombatNumbersV01.match.countdownSeconds - 0.05, 2950)).toEqual([]);
    expect(machine.getMatchState()).toBe("COUNTDOWN");
    expect(machine.getTime().stateRemainingSeconds).toBeCloseTo(0.05);

    const events = machine.update(0.05, 3000);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      previousState: "COUNTDOWN",
      nextState: "WAVE_PREP",
      serverTimeMs: 3000,
      waveIndex: 1
    });
    expect(machine.getMatchState()).toBe("WAVE_PREP");
    expect(machine.getTime()).toEqual({
      elapsedMatchSeconds: CombatNumbersV01.match.countdownSeconds,
      stateElapsedSeconds: 0,
      stateRemainingSeconds: CombatNumbersV01.match.wave1PrepSeconds
    });
  });

  test("does not mutate timers after a terminal match state", () => {
    const machine = new MatchStateMachine("match_phase_3");
    machine.startCountdown(0);
    const terminalEvent = machine.forceTerminalState("DEFEAT", 500);

    expect(terminalEvent).toMatchObject({
      previousState: "COUNTDOWN",
      nextState: "DEFEAT",
      serverTimeMs: 500
    });

    const frozenTime = machine.getTime();

    expect(machine.update(10, 10500)).toEqual([]);
    expect(machine.getMatchState()).toBe("DEFEAT");
    expect(machine.getTime()).toEqual(frozenTime);
  });
});

describe("Phase 3 GameLoop", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(100_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("ticks at 20Hz, broadcasts snapshots at 10Hz, and stops cleanly", () => {
    const snapshots: unknown[] = [];
    const phases: unknown[] = [];
    let roomState: RoomState = "COUNTDOWN";
    const roomPayload = (): RoomStatePayload => ({
      matchId: "match_loop",
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
      matchId: "match_loop",
      getRoomState: roomPayload,
      onPhaseChanged: (event) => {
        roomState = event.nextState === "COUNTDOWN" ? "COUNTDOWN" : "IN_MATCH";
        phases.push(event);
      },
      onSnapshot: (snapshot) => snapshots.push(snapshot)
    });

    loop.start();

    expect(phases).toHaveLength(1);
    expect(phases[0]).toMatchObject({ nextState: "COUNTDOWN" });

    vi.advanceTimersByTime(500);

    expect(snapshots).toHaveLength(5);
    expect(snapshots.at(-1)).toMatchObject({
      matchId: "match_loop",
      serverSeq: 5,
      matchState: "COUNTDOWN",
      roomState: "COUNTDOWN",
      economy: {
        sharedSun: CombatNumbersV01.economy.initialSharedSun
      },
      base: {
        hp: CombatNumbersV01.base.maxHp,
        maxHp: CombatNumbersV01.base.maxHp
      },
      plants: [],
      enemies: [],
      bullets: []
    });

    vi.advanceTimersByTime(CombatNumbersV01.match.countdownSeconds * 1000 - 500);

    expect(phases).toHaveLength(2);
    expect(phases[1]).toMatchObject({ previousState: "COUNTDOWN", nextState: "WAVE_PREP" });
    expect(snapshots.at(-1)).toMatchObject({
      matchState: "WAVE_PREP",
      roomState: "IN_MATCH",
      time: {
        stateRemainingSeconds: CombatNumbersV01.match.wave1PrepSeconds
      },
      wave: {
        currentWaveIndex: 1,
        totalWaves: 5,
        spawnedInWave: 0,
        remainingInWave: 6,
        evolutionUnlocked: false
      }
    });

    loop.stop();
    const snapshotsAfterStop = snapshots.length;

    vi.advanceTimersByTime(1000);

    expect(snapshots).toHaveLength(snapshotsAfterStop);
  });
});
