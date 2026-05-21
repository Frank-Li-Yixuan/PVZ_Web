import type { RoutedAudioBusId } from "./audioBuses";

export const P0_AUDIO_EVENT_IDS = [
  "weapon.pistolShot",
  "weapon.dryFire",
  "weapon.reload",
  "plant.place",
  "plant.shoot",
  "sun.gain",
  "enemy.hit",
  "enemy.death",
  "base.damaged",
  "wave.start",
  "boss.spawn",
  "boss.chargeWarning",
  "boss.interrupted",
  "match.victory",
  "match.defeat",
  "ui.error",
  "ui.click"
] as const;

export type AudioEventId = (typeof P0_AUDIO_EVENT_IDS)[number];

export type AudioVariant =
  | {
      id: string;
      source: "synthetic";
      frequencyHz: number;
      durationMs: number;
      waveform?: OscillatorType;
      volume?: number;
    }
  | {
      id: string;
      source: "file";
      url: string;
      volume?: number;
    };

export type AudioEventDefinition = {
  id: AudioEventId;
  bus: RoutedAudioBusId;
  volume: number;
  minIntervalMs: number;
  variants: AudioVariant[];
};

export type AudioRegistry = Record<AudioEventId, AudioEventDefinition>;

export const AudioRegistryV01 = {
  "weapon.pistolShot": event("weapon.pistolShot", "sfx", 0.52, 0, [
    synthetic("sfx_weapon_pistol_shot_synth_01", 740, 72, "square", 0.7),
    synthetic("sfx_weapon_pistol_shot_synth_02", 820, 62, "square", 0.62)
  ]),
  "weapon.dryFire": event("weapon.dryFire", "sfx", 0.36, 90, [
    synthetic("sfx_weapon_pistol_dry_fire_synth_01", 210, 68, "triangle")
  ]),
  "weapon.reload": event("weapon.reload", "sfx", 0.45, 140, [
    synthetic("sfx_weapon_reload_synth_01", 340, 160, "sawtooth")
  ]),
  "plant.place": event("plant.place", "sfx", 0.5, 80, [
    synthetic("sfx_plant_place_synth_01", 420, 120, "triangle")
  ]),
  "plant.shoot": event("plant.shoot", "sfx", 0.42, 50, [
    synthetic("sfx_plant_shoot_synth_01", 560, 72, "sine"),
    synthetic("sfx_plant_shoot_synth_02", 610, 70, "sine")
  ]),
  "sun.gain": event("sun.gain", "sfx", 0.45, 80, [
    synthetic("sfx_sun_gain_synth_01", 880, 110, "sine")
  ]),
  "enemy.hit": event("enemy.hit", "sfx", 0.35, 40, [
    synthetic("sfx_enemy_hit_synth_01", 180, 75, "sawtooth"),
    synthetic("sfx_enemy_hit_synth_02", 155, 80, "sawtooth")
  ]),
  "enemy.death": event("enemy.death", "sfx", 0.45, 90, [
    synthetic("sfx_enemy_death_synth_01", 120, 220, "triangle")
  ]),
  "base.damaged": event("base.damaged", "sfx", 0.65, 300, [
    synthetic("sfx_base_damaged_synth_01", 95, 260, "sawtooth")
  ]),
  "wave.start": event("wave.start", "ui", 0.58, 500, [
    synthetic("sfx_wave_start_synth_01", 660, 210, "triangle")
  ]),
  "boss.spawn": event("boss.spawn", "sfx", 0.75, 800, [
    synthetic("sfx_boss_spawn_synth_01", 82, 560, "sawtooth")
  ]),
  "boss.chargeWarning": event("boss.chargeWarning", "sfx", 0.8, 900, [
    synthetic("sfx_boss_charge_warning_synth_01", 940, 460, "square")
  ]),
  "boss.interrupted": event("boss.interrupted", "sfx", 0.75, 500, [
    synthetic("sfx_boss_interrupted_synth_01", 520, 330, "triangle")
  ]),
  "match.victory": event("match.victory", "ui", 0.8, 1_500, [
    synthetic("stinger_victory_synth_01", 784, 760, "triangle")
  ]),
  "match.defeat": event("match.defeat", "ui", 0.75, 1_500, [
    synthetic("stinger_defeat_synth_01", 146, 860, "sawtooth")
  ]),
  "ui.error": event("ui.error", "ui", 0.45, 150, [
    synthetic("ui_error_synth_01", 190, 120, "square")
  ]),
  "ui.click": event("ui.click", "ui", 0.4, 35, [
    synthetic("ui_click_synth_01", 620, 42, "sine")
  ])
} as const satisfies AudioRegistry;

function event(
  id: AudioEventId,
  bus: RoutedAudioBusId,
  volume: number,
  minIntervalMs: number,
  variants: AudioVariant[]
): AudioEventDefinition {
  return {
    id,
    bus,
    volume,
    minIntervalMs,
    variants
  };
}

function synthetic(
  id: string,
  frequencyHz: number,
  durationMs: number,
  waveform: OscillatorType,
  volume = 1
): AudioVariant {
  return {
    id,
    source: "synthetic",
    frequencyHz,
    durationMs,
    waveform,
    volume
  };
}
