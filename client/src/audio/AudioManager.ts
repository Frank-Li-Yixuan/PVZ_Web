import { AudioBusesV01, type AudioBusConfig, type AudioBusId } from "./audioBuses";
import {
  AudioRegistryV01,
  type AudioEventDefinition,
  type AudioEventId,
  type AudioRegistry,
  type AudioVariant
} from "./audioRegistry";

export type AudioPlayResult =
  | {
      ok: true;
      id: AudioEventId;
      source: AudioVariant["source"];
      fallback: boolean;
      variantId: string;
    }
  | {
      ok: false;
      id: AudioEventId;
      reason: "locked" | "throttled";
    };

export type AudioUnlockTarget = {
  addEventListener: (
    type: string,
    handler: () => void | Promise<void>,
    options?: AddEventListenerOptions
  ) => void;
  removeEventListener: (type: string, handler: () => void | Promise<void>) => void;
};

export type AudioManagerOptions = {
  registry?: AudioRegistry;
  buses?: Record<AudioBusId, AudioBusConfig>;
  now?: () => number;
  random?: () => number;
  warn?: (message: string) => void;
  createAudioContext?: () => AudioContext | undefined;
  synthesize?: (definition: AudioEventDefinition, variant: Extract<AudioVariant, { source: "synthetic" }>) => void;
};

export class AudioManager {
  private readonly registry: AudioRegistry;
  private readonly buses: Record<AudioBusId, AudioBusConfig>;
  private readonly now: () => number;
  private readonly random: () => number;
  private readonly warn: (message: string) => void;
  private readonly createAudioContext: () => AudioContext | undefined;
  private readonly synthesizeOverride:
    | ((definition: AudioEventDefinition, variant: Extract<AudioVariant, { source: "synthetic" }>) => void)
    | undefined;
  private readonly lastPlayedAtMsById = new Map<AudioEventId, number>();
  private readonly warnedMissingIds = new Set<AudioEventId>();
  private audioContext: AudioContext | undefined;
  private unlocked = false;

  constructor(options: AudioManagerOptions = {}) {
    this.registry = options.registry ?? AudioRegistryV01;
    this.buses = options.buses ?? AudioBusesV01;
    this.now = options.now ?? (() => performance.now());
    this.random = options.random ?? Math.random;
    this.warn = options.warn ?? ((message) => console.warn(message));
    this.createAudioContext = options.createAudioContext ?? createDefaultAudioContext;
    this.synthesizeOverride = options.synthesize;
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }

  installUnlockListeners(target: AudioUnlockTarget | undefined = getDefaultUnlockTarget()): void {
    if (!target) {
      return;
    }

    const unlock = async () => {
      await this.unlock();
      target.removeEventListener("pointerdown", unlock);
      target.removeEventListener("keydown", unlock);
      target.removeEventListener("touchstart", unlock);
    };

    target.addEventListener("pointerdown", unlock, { once: true, passive: true });
    target.addEventListener("keydown", unlock, { once: true });
    target.addEventListener("touchstart", unlock, { once: true, passive: true });
  }

  async unlock(): Promise<boolean> {
    if (this.unlocked) {
      return true;
    }

    try {
      this.audioContext = this.audioContext ?? this.createAudioContext();
      if (this.audioContext?.state === "suspended") {
        await this.audioContext.resume();
      }
    } catch (error) {
      this.warn(`[audio] AudioContext unlock failed: ${String(error)}`);
    }

    this.unlocked = true;
    return true;
  }

  play(id: AudioEventId): AudioPlayResult {
    const definition = this.registry[id];
    const nowMs = this.now();
    const lastPlayedAtMs = this.lastPlayedAtMsById.get(id);
    if (lastPlayedAtMs !== undefined && nowMs - lastPlayedAtMs < definition.minIntervalMs) {
      return {
        ok: false,
        id,
        reason: "throttled"
      };
    }

    if (!this.unlocked) {
      return {
        ok: false,
        id,
        reason: "locked"
      };
    }

    const pickedVariant = this.pickVariant(definition);
    const variant = pickedVariant ?? createSyntheticFallbackVariant(id);
    const fallback = pickedVariant === undefined;

    if (fallback) {
      this.warnMissingResource(id);
    }

    try {
      if (variant.source === "synthetic") {
        this.playSynthetic(definition, variant);
      } else {
        this.playFile(definition, variant);
      }
    } catch (error) {
      this.warn(`[audio] Failed to play ${id}: ${String(error)}`);
      this.playSynthetic(definition, createSyntheticFallbackVariant(id));
    }

    this.lastPlayedAtMsById.set(id, nowMs);
    return {
      ok: true,
      id,
      source: variant.source,
      fallback,
      variantId: variant.id
    };
  }

  private pickVariant(definition: AudioEventDefinition): AudioVariant | undefined {
    if (definition.variants.length === 0) {
      return undefined;
    }

    const index = Math.min(definition.variants.length - 1, Math.floor(this.random() * definition.variants.length));
    return definition.variants[index];
  }

  private playSynthetic(
    definition: AudioEventDefinition,
    variant: Extract<AudioVariant, { source: "synthetic" }>
  ): void {
    if (this.synthesizeOverride) {
      this.synthesizeOverride(definition, variant);
      return;
    }

    const context = this.audioContext;
    if (!context) {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startTime = context.currentTime;
    const durationSeconds = Math.max(0.02, variant.durationMs / 1000);
    const effectiveVolume = this.getEffectiveVolume(definition, variant.volume ?? 1);

    oscillator.type = variant.waveform ?? "sine";
    oscillator.frequency.setValueAtTime(variant.frequencyHz, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, effectiveVolume), startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSeconds);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + durationSeconds + 0.01);
  }

  private playFile(definition: AudioEventDefinition, variant: Extract<AudioVariant, { source: "file" }>): void {
    const audio = new Audio(variant.url);
    audio.volume = this.getEffectiveVolume(definition, variant.volume ?? 1);
    audio.play().catch((error) => {
      this.warn(`[audio] File playback failed for ${definition.id}: ${String(error)}`);
    });
  }

  private getEffectiveVolume(definition: AudioEventDefinition, variantVolume: number): number {
    const masterVolume = this.buses.master.volume;
    const busVolume = this.buses[definition.bus].volume;
    return clampVolume(masterVolume * busVolume * definition.volume * variantVolume);
  }

  private warnMissingResource(id: AudioEventId): void {
    if (this.warnedMissingIds.has(id)) {
      return;
    }

    this.warnedMissingIds.add(id);
    this.warn(`[audio] Missing playable audio resource for ${id}; using synthesized placeholder.`);
  }
}

function createDefaultAudioContext(): AudioContext | undefined {
  const audioGlobal = globalThis as typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextConstructor = audioGlobal.AudioContext ?? audioGlobal.webkitAudioContext;
  if (!AudioContextConstructor) {
    return undefined;
  }

  return new AudioContextConstructor();
}

function getDefaultUnlockTarget(): AudioUnlockTarget | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window;
}

function createSyntheticFallbackVariant(id: AudioEventId): Extract<AudioVariant, { source: "synthetic" }> {
  return {
    id: `synthetic_fallback_${id.replace(/\./g, "_")}`,
    source: "synthetic",
    frequencyHz: 440,
    durationMs: 80,
    waveform: "sine",
    volume: 0.5
  };
}

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}
