import {
  CombatNumbersV01,
  type MatchId,
  type MatchPhaseChangedEvent,
  type MatchState,
  type MatchTimeState
} from "@sprout-and-steel/shared";

const TERMINAL_STATES = new Set<MatchState>(["VICTORY", "DEFEAT"]);
const TRANSITION_EPSILON_SECONDS = 0.000_001;

export class MatchStateMachine {
  private matchState: MatchState = "LOBBY";
  private elapsedMatchSeconds = 0;
  private stateElapsedSeconds = 0;
  private readonly currentWaveIndex = 1;

  constructor(private readonly matchId: MatchId) {}

  getMatchState(): MatchState {
    return this.matchState;
  }

  getTime(): MatchTimeState {
    const stateDurationSeconds = this.getStateDurationSeconds();
    const time: MatchTimeState = {
      elapsedMatchSeconds: roundSeconds(this.elapsedMatchSeconds),
      stateElapsedSeconds: roundSeconds(this.stateElapsedSeconds)
    };

    if (stateDurationSeconds !== undefined) {
      time.stateRemainingSeconds = roundSeconds(
        Math.max(0, stateDurationSeconds - this.stateElapsedSeconds)
      );
    }

    return time;
  }

  startCountdown(serverTimeMs: number): MatchPhaseChangedEvent | undefined {
    if (this.matchState !== "LOBBY") {
      return undefined;
    }

    return this.transitionTo("COUNTDOWN", serverTimeMs);
  }

  update(deltaSeconds: number, serverTimeMs: number): MatchPhaseChangedEvent[] {
    if (deltaSeconds <= 0 || this.matchState === "LOBBY" || this.isTerminal()) {
      return [];
    }

    const events: MatchPhaseChangedEvent[] = [];
    let remainingDeltaSeconds = deltaSeconds;

    while (remainingDeltaSeconds > 0 && !this.isTerminal()) {
      const stateDurationSeconds = this.getStateDurationSeconds();
      if (stateDurationSeconds === undefined || this.matchState !== "COUNTDOWN") {
        this.advanceTime(remainingDeltaSeconds);
        break;
      }

      const secondsUntilTransition = stateDurationSeconds - this.stateElapsedSeconds;
      if (remainingDeltaSeconds + TRANSITION_EPSILON_SECONDS < secondsUntilTransition) {
        this.advanceTime(remainingDeltaSeconds);
        break;
      }

      this.advanceTime(Math.max(0, secondsUntilTransition));
      remainingDeltaSeconds -= Math.max(0, secondsUntilTransition);
      events.push(this.transitionTo("WAVE_PREP", serverTimeMs));

      if (remainingDeltaSeconds > 0) {
        this.advanceTime(remainingDeltaSeconds);
        break;
      }
    }

    return events;
  }

  forceTerminalState(nextState: Extract<MatchState, "VICTORY" | "DEFEAT">, serverTimeMs: number): MatchPhaseChangedEvent {
    return this.transitionTo(nextState, serverTimeMs);
  }

  private transitionTo(nextState: MatchState, serverTimeMs: number): MatchPhaseChangedEvent {
    const previousState = this.matchState;
    this.matchState = nextState;
    this.stateElapsedSeconds = 0;

    return {
      type: "match.phaseChanged",
      matchId: this.matchId,
      previousState,
      nextState,
      serverTimeMs,
      waveIndex: this.currentWaveIndex
    };
  }

  private advanceTime(deltaSeconds: number): void {
    if (deltaSeconds <= 0) {
      return;
    }

    this.elapsedMatchSeconds += deltaSeconds;
    this.stateElapsedSeconds += deltaSeconds;
  }

  private getStateDurationSeconds(): number | undefined {
    if (this.matchState === "COUNTDOWN") {
      return CombatNumbersV01.match.countdownSeconds;
    }
    if (this.matchState === "WAVE_PREP") {
      return CombatNumbersV01.match.wave1PrepSeconds;
    }
    return undefined;
  }

  private isTerminal(): boolean {
    return TERMINAL_STATES.has(this.matchState);
  }
}

function roundSeconds(value: number): number {
  return Number(value.toFixed(3));
}
