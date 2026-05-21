import type { EnemyType } from "../types/enums";
import type { LaneIndex } from "./mapConfig";

export type WaveSpawnEvent = {
  time: number;
  lane: LaneIndex;
  enemyType: EnemyType;
  count?: number;
  interval?: number;
};

export type WaveConfig = {
  wave: 1 | 2 | 3 | 4 | 5;
  events: WaveSpawnEvent[];
};

export const WavesV01 = [
  {
    wave: 1,
    events: [
      { time: 0, lane: 2, enemyType: "shambler" },
      { time: 6, lane: 1, enemyType: "shambler" },
      { time: 12, lane: 3, enemyType: "shambler" },
      { time: 18, lane: 0, enemyType: "shambler" },
      { time: 24, lane: 4, enemyType: "shambler" },
      { time: 30, lane: 2, enemyType: "shambler" }
    ]
  },
  {
    wave: 2,
    events: [
      { time: 0, lane: 1, enemyType: "shambler" },
      { time: 3, lane: 3, enemyType: "shambler" },
      { time: 8, lane: 2, enemyType: "shambler" },
      { time: 12, lane: 0, enemyType: "shambler" },
      { time: 16, lane: 4, enemyType: "shambler" },
      { time: 21, lane: 1, enemyType: "shambler" },
      { time: 24, lane: 3, enemyType: "shambler" },
      { time: 29, lane: 2, enemyType: "shambler" },
      { time: 34, lane: 0, enemyType: "shambler" }
    ]
  },
  {
    wave: 3,
    events: [
      { time: 0, lane: 2, enemyType: "shambler" },
      { time: 4, lane: 1, enemyType: "shambler" },
      { time: 8, lane: 3, enemyType: "runner" },
      { time: 12, lane: 0, enemyType: "shambler" },
      { time: 16, lane: 4, enemyType: "runner" },
      { time: 20, lane: 2, enemyType: "shambler" },
      { time: 24, lane: 1, enemyType: "runner" },
      { time: 28, lane: 3, enemyType: "shambler" },
      { time: 32, lane: 0, enemyType: "shambler" },
      { time: 36, lane: 4, enemyType: "shambler" },
      { time: 40, lane: 2, enemyType: "runner" },
      { time: 44, lane: 1, enemyType: "shambler" }
    ]
  },
  {
    wave: 4,
    events: [
      { time: 0, lane: 2, enemyType: "brute" },
      { time: 5, lane: 1, enemyType: "shambler" },
      { time: 8, lane: 3, enemyType: "shambler" },
      { time: 12, lane: 0, enemyType: "runner" },
      { time: 16, lane: 4, enemyType: "shambler" },
      { time: 20, lane: 2, enemyType: "shambler" },
      { time: 24, lane: 1, enemyType: "brute" },
      { time: 29, lane: 3, enemyType: "runner" },
      { time: 34, lane: 0, enemyType: "shambler" },
      { time: 39, lane: 4, enemyType: "brute" },
      { time: 44, lane: 2, enemyType: "shambler" },
      { time: 48, lane: 1, enemyType: "shambler" },
      { time: 52, lane: 3, enemyType: "shambler" },
      { time: 56, lane: 0, enemyType: "runner" }
    ]
  },
  {
    wave: 5,
    events: [
      { time: 0, lane: 0, enemyType: "shambler" },
      { time: 2, lane: 4, enemyType: "shambler" },
      { time: 5, lane: 2, enemyType: "brute" },
      { time: 8, lane: 1, enemyType: "runner" },
      { time: 11, lane: 3, enemyType: "runner" },
      { time: 15, lane: 0, enemyType: "shambler" },
      { time: 18, lane: 4, enemyType: "shambler" },
      { time: 22, lane: 1, enemyType: "brute" },
      { time: 26, lane: 3, enemyType: "shambler" },
      { time: 30, lane: 2, enemyType: "runner" },
      { time: 34, lane: 0, enemyType: "runner" },
      { time: 38, lane: 4, enemyType: "brute" },
      { time: 42, lane: 1, enemyType: "shambler" },
      { time: 45, lane: 3, enemyType: "shambler" },
      { time: 49, lane: 2, enemyType: "shambler" },
      { time: 53, lane: 0, enemyType: "brute" },
      { time: 57, lane: 4, enemyType: "runner" },
      { time: 61, lane: 1, enemyType: "shambler" },
      { time: 64, lane: 3, enemyType: "shambler" },
      { time: 68, lane: 2, enemyType: "shambler" },
      { time: 72, lane: 2, enemyType: "brute" }
    ]
  }
] as const satisfies readonly WaveConfig[];
