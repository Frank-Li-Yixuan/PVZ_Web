export const AUDIO_BUS_IDS = ["master", "sfx", "music", "ui"] as const;

export type AudioBusId = (typeof AUDIO_BUS_IDS)[number];
export type RoutedAudioBusId = Exclude<AudioBusId, "master">;

export type AudioBusConfig = {
  id: AudioBusId;
  volume: number;
};

export const AudioBusesV01 = {
  master: {
    id: "master",
    volume: 1
  },
  sfx: {
    id: "sfx",
    volume: 0.85
  },
  music: {
    id: "music",
    volume: 0.45
  },
  ui: {
    id: "ui",
    volume: 0.7
  }
} as const satisfies Record<AudioBusId, AudioBusConfig>;
