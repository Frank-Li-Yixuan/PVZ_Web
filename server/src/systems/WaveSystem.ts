import {
  CombatNumbersV01,
  WavesV01,
  createEntityId,
  type EnemyType,
  type FeedbackEvent,
  type MatchState,
  type WaveSpawnEvent,
  type WaveState
} from "@sprout-and-steel/shared";

type WaveDrivenState = Extract<MatchState, "WAVE_PREP" | "WAVE_ACTIVE" | "WAVE_CLEAR" | "BOSS_PREP">;

export type WaveSpawnCommand = {
  enemyType: EnemyType;
  laneIndex: 0 | 1 | 2 | 3 | 4;
  waveIndex: number;
  eventIndex: number;
  serverTimeMs: number;
};

export type WaveTransitionRequest = {
  nextState: WaveDrivenState;
  waveIndex: number;
};

export type WaveUpdateInput = {
  matchState: MatchState;
  deltaSeconds: number;
  activeEnemyCount: number;
  baseHp: number;
  serverTimeMs: number;
};

export type WaveUpdateResult = {
  transitions: WaveTransitionRequest[];
  spawns: WaveSpawnCommand[];
  feedback: FeedbackEvent[];
};

const TIMING_EPSILON_SECONDS = 0.000_001;

export class WaveSystem {
  private currentWaveArrayIndex = 0;
  private phaseElapsedSeconds = 0;
  private activeElapsedSeconds = 0;
  private nextSpawnEventIndex = 0;
  private spawnedInWave = 0;
  private waveSpawnComplete = false;
  private lastActiveEnemyCount = 0;
  private evolutionUnlocked = false;
  private eventSequence = 0;

  constructor() {
    this.waveSpawnComplete = this.currentWaveEvents.length === 0;
  }

  update(input: WaveUpdateInput): WaveUpdateResult {
    const result: WaveUpdateResult = {
      transitions: [],
      spawns: [],
      feedback: []
    };

    if (!isWaveDrivenState(input.matchState)) {
      return result;
    }

    this.lastActiveEnemyCount = Math.max(0, Math.trunc(input.activeEnemyCount));

    if (input.baseHp <= 0 || input.matchState === "BOSS_PREP") {
      return result;
    }

    if (input.matchState === "WAVE_PREP") {
      this.updatePrep(input, result);
      return result;
    }

    if (input.matchState === "WAVE_ACTIVE") {
      this.updateActive(input, result);
      return result;
    }

    if (input.matchState === "WAVE_CLEAR") {
      this.updateClear(input, result);
    }

    return result;
  }

  getSnapshot(activeEnemyCount = this.lastActiveEnemyCount): WaveState {
    const unspawnedInWave = Math.max(0, this.currentWaveEvents.length - this.spawnedInWave);
    const enemiesRemainingInWave = Math.max(0, unspawnedInWave + Math.max(0, Math.trunc(activeEnemyCount)));

    return {
      currentWaveIndex: this.currentWave.wave,
      totalWaves: WavesV01.length,
      spawnedInWave: this.spawnedInWave,
      remainingInWave: enemiesRemainingInWave,
      waveSpawnComplete: this.waveSpawnComplete,
      enemiesRemainingInWave,
      evolutionUnlocked: this.evolutionUnlocked
    };
  }

  private updatePrep(input: WaveUpdateInput, result: WaveUpdateResult): void {
    this.phaseElapsedSeconds += Math.max(0, input.deltaSeconds);
    const prepSeconds = this.currentWave.wave === 1
      ? CombatNumbersV01.match.wave1PrepSeconds
      : CombatNumbersV01.match.normalWavePrepSeconds;

    if (this.phaseElapsedSeconds + TIMING_EPSILON_SECONDS < prepSeconds) {
      return;
    }

    this.phaseElapsedSeconds = 0;
    this.activeElapsedSeconds = 0;
    result.transitions.push({
      nextState: "WAVE_ACTIVE",
      waveIndex: this.currentWave.wave
    });
    result.feedback.push(this.createWaveStartedFeedback(input.serverTimeMs));
    result.spawns.push(...this.collectDueSpawns(input.serverTimeMs));
    this.lastActiveEnemyCount += result.spawns.length;
  }

  private updateActive(input: WaveUpdateInput, result: WaveUpdateResult): void {
    this.activeElapsedSeconds += Math.max(0, input.deltaSeconds);
    result.spawns.push(...this.collectDueSpawns(input.serverTimeMs));
    this.lastActiveEnemyCount += result.spawns.length;

    if (!this.waveSpawnComplete || this.lastActiveEnemyCount > 0 || input.baseHp <= 0) {
      return;
    }

    this.phaseElapsedSeconds = 0;
    if (this.currentWave.wave >= CombatNumbersV01.evolution.unlockAfterWaveCleared) {
      this.evolutionUnlocked = true;
    }
    result.transitions.push({
      nextState: "WAVE_CLEAR",
      waveIndex: this.currentWave.wave
    });
  }

  private updateClear(input: WaveUpdateInput, result: WaveUpdateResult): void {
    this.phaseElapsedSeconds += Math.max(0, input.deltaSeconds);
    if (this.phaseElapsedSeconds + TIMING_EPSILON_SECONDS < CombatNumbersV01.match.waveClearSeconds) {
      return;
    }

    this.phaseElapsedSeconds = 0;

    if (this.currentWaveArrayIndex >= WavesV01.length - 1) {
      result.transitions.push({
        nextState: "BOSS_PREP",
        waveIndex: this.currentWave.wave
      });
      return;
    }

    this.currentWaveArrayIndex += 1;
    this.activeElapsedSeconds = 0;
    this.nextSpawnEventIndex = 0;
    this.spawnedInWave = 0;
    this.waveSpawnComplete = this.currentWaveEvents.length === 0;
    this.lastActiveEnemyCount = 0;
    result.transitions.push({
      nextState: "WAVE_PREP",
      waveIndex: this.currentWave.wave
    });
  }

  private collectDueSpawns(serverTimeMs: number): WaveSpawnCommand[] {
    const spawns: WaveSpawnCommand[] = [];

    while (this.nextSpawnEventIndex < this.currentWaveEvents.length) {
      const event = this.currentWaveEvents[this.nextSpawnEventIndex];
      if (!event || event.time > this.activeElapsedSeconds + TIMING_EPSILON_SECONDS) {
        break;
      }

      spawns.push({
        enemyType: event.enemyType,
        laneIndex: event.lane,
        waveIndex: this.currentWave.wave,
        eventIndex: this.nextSpawnEventIndex,
        serverTimeMs
      });
      this.nextSpawnEventIndex += 1;
      this.spawnedInWave += 1;
    }

    this.waveSpawnComplete = this.nextSpawnEventIndex >= this.currentWaveEvents.length;
    return spawns;
  }

  private createWaveStartedFeedback(serverTimeMs: number): FeedbackEvent {
    return {
      id: createEntityId("event", ++this.eventSequence),
      eventType: "wave.started",
      serverTimeMs,
      data: {
        waveIndex: this.currentWave.wave,
        totalWaves: WavesV01.length
      }
    };
  }

  private get currentWave(): (typeof WavesV01)[number] {
    return WavesV01[this.currentWaveArrayIndex] ?? WavesV01[WavesV01.length - 1]!;
  }

  private get currentWaveEvents(): readonly WaveSpawnEvent[] {
    return this.currentWave.events;
  }
}

function isWaveDrivenState(matchState: MatchState): matchState is WaveDrivenState {
  return (
    matchState === "WAVE_PREP" ||
    matchState === "WAVE_ACTIVE" ||
    matchState === "WAVE_CLEAR" ||
    matchState === "BOSS_PREP"
  );
}
