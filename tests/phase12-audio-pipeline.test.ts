import { describe, expect, test, vi } from "vitest";
import {
  audioEventIdsFromFeedback,
  audioEventIdFromActionAccepted,
  audioEventIdFromActionRejected,
  P0_AUDIO_EVENT_IDS
} from "../client/src/audio/audioEvents";
import { AudioManager } from "../client/src/audio/AudioManager";
import { AudioBusesV01 } from "../client/src/audio/audioBuses";
import { AudioRegistryV01 } from "../client/src/audio/audioRegistry";
import { EnemySystem } from "../server/src/systems/EnemySystem";
import { EconomySystem } from "../server/src/systems/EconomySystem";
import { PlantCombatSystem } from "../server/src/systems/PlantCombatSystem";
import { PlantSystem } from "../server/src/systems/PlantSystem";
import { ProjectileSystem } from "../server/src/systems/ProjectileSystem";
import {
  CombatNumbersV01,
  getPlantCellCenter,
  type FeedbackEvent,
  type PlayerState
} from "../shared/src";

describe("Phase 12 audio registry and event mapping", () => {
  test("registers every P0 audio event with bus and placeholder fallback metadata", () => {
    expect(P0_AUDIO_EVENT_IDS).toEqual([
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
    ]);

    for (const audioEventId of P0_AUDIO_EVENT_IDS) {
      expect(AudioRegistryV01[audioEventId]).toMatchObject({
        id: audioEventId,
        bus: expect.stringMatching(/^(sfx|ui|music)$/),
        variants: expect.arrayContaining([
          expect.objectContaining({
            source: "synthetic"
          })
        ])
      });
    }

    expect(AudioBusesV01).toMatchObject({
      master: { volume: 1 },
      sfx: { volume: 0.85 },
      music: { volume: 0.45 },
      ui: { volume: 0.7 }
    });
  });

  test("maps P0 server feedback and action results to audio events", () => {
    expect(audioEventIdsFromFeedback(feedback("hero.shoot"))).toEqual(["weapon.pistolShot"]);
    expect(audioEventIdsFromFeedback(feedback("hero.dryFire"))).toEqual(["weapon.dryFire"]);
    expect(audioEventIdsFromFeedback(feedback("hero.reloadStart"))).toEqual(["weapon.reload"]);
    expect(audioEventIdsFromFeedback(feedback("plant.placed"))).toEqual(["plant.place"]);
    expect(audioEventIdsFromFeedback(feedback("plant.shoot"))).toEqual(["plant.shoot"]);
    expect(audioEventIdsFromFeedback(feedback("sun.gained"))).toEqual(["sun.gain"]);
    expect(audioEventIdsFromFeedback(feedback("enemy.hit"))).toEqual(["enemy.hit"]);
    expect(audioEventIdsFromFeedback(feedback("enemy.killed"))).toEqual(["enemy.death"]);
    expect(audioEventIdsFromFeedback(feedback("base.damaged"))).toEqual(["base.damaged"]);
    expect(audioEventIdsFromFeedback(feedback("wave.started"))).toEqual(["wave.start"]);
    expect(audioEventIdsFromFeedback(feedback("boss.spawned"))).toEqual(["boss.spawn"]);
    expect(audioEventIdsFromFeedback(feedback("boss.chargeStarted"))).toEqual(["boss.chargeWarning"]);
    expect(audioEventIdsFromFeedback(feedback("boss.interrupted"))).toEqual(["boss.interrupted"]);
    expect(audioEventIdsFromFeedback(feedback("match.victory"))).toEqual(["match.victory"]);
    expect(audioEventIdsFromFeedback(feedback("match.defeat"))).toEqual(["match.defeat"]);

    expect(audioEventIdFromActionAccepted({ action: "reload" })).toBe("weapon.reload");
    expect(audioEventIdFromActionRejected()).toBe("ui.error");
  });
});

describe("Phase 12 AudioManager", () => {
  test("unlocks after a user event, plays synthetic placeholders, and throttles min intervals", async () => {
    let nowMs = 1_000;
    const played: string[] = [];
    const manager = new AudioManager({
      now: () => nowMs,
      random: () => 0,
      synthesize: (event) => played.push(event.id),
      warn: vi.fn()
    });
    const unlockTarget = createUnlockTarget();

    manager.installUnlockListeners(unlockTarget);
    expect(manager.isUnlocked()).toBe(false);
    await unlockTarget.dispatch("pointerdown");
    expect(manager.isUnlocked()).toBe(true);

    expect(manager.play("enemy.hit")).toMatchObject({ ok: true, source: "synthetic" });
    expect(manager.play("enemy.hit")).toMatchObject({ ok: false, reason: "throttled" });
    nowMs += 41;
    expect(manager.play("enemy.hit")).toMatchObject({ ok: true, source: "synthetic" });
    expect(played).toEqual(["enemy.hit", "enemy.hit"]);
  });

  test("does not crash when a registered event has no playable resource", async () => {
    const warnings: string[] = [];
    const manager = new AudioManager({
      registry: {
        ...AudioRegistryV01,
        "ui.error": {
          ...AudioRegistryV01["ui.error"],
          variants: []
        }
      },
      warn: (message) => warnings.push(message)
    });

    await manager.unlock();
    expect(manager.play("ui.error")).toMatchObject({
      ok: true,
      source: "synthetic",
      fallback: true
    });
    expect(warnings.some((message) => message.includes("ui.error"))).toBe(true);
  });
});

describe("Phase 12 plant shoot feedback hook", () => {
  test("peashotter fire emits plant.shoot feedback so client audio can map it", () => {
    const player = createPlayerNearCell(2, 1);
    const plants = new PlantSystem();
    const plantResult = plants.tryPlant({
      requestId: "plant_audio",
      request: {
        requestId: "plant_audio",
        plantType: "peashotter",
        laneIndex: 2,
        columnIndex: 1
      },
      matchState: "WAVE_ACTIVE",
      player,
      economy: new EconomySystem(1_000),
      serverTimeMs: 1_000,
      enemies: []
    });
    if (!plantResult.ok) {
      throw new Error(`Plant setup failed: ${plantResult.rejected.reason}`);
    }

    const enemies = new EnemySystem(() => 1);
    const spawn = enemies.spawnEnemy({
      enemyType: "shambler",
      laneIndex: 2,
      serverTimeMs: 1_100
    });
    expect(spawn.ok).toBe(true);

    const combat = new PlantCombatSystem();
    const events = combat.update(0.2, plants, enemies, new ProjectileSystem(), 1_200);

    expect(events).toEqual([
      expect.objectContaining({
        eventType: "plant.shoot",
        data: expect.objectContaining({
          plantType: "peashotter"
        })
      })
    ]);
  });
});

function feedback(eventType: FeedbackEvent["eventType"]): FeedbackEvent {
  return {
    id: `event_${eventType}`,
    eventType,
    serverTimeMs: 1_000
  };
}

function createUnlockTarget(): {
  addEventListener: (type: string, handler: () => void | Promise<void>, options?: AddEventListenerOptions) => void;
  removeEventListener: (type: string, handler: () => void | Promise<void>) => void;
  dispatch: (type: string) => Promise<void>;
} {
  const listeners = new Map<string, () => void | Promise<void>>();
  return {
    addEventListener: (type, handler) => listeners.set(type, handler),
    removeEventListener: (type, handler) => {
      if (listeners.get(type) === handler) {
        listeners.delete(type);
      }
    },
    dispatch: async (type) => {
      await listeners.get(type)?.();
    }
  };
}

function createPlayerNearCell(laneIndex: 0 | 1 | 2 | 3 | 4, columnIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6): PlayerState {
  const center = getPlantCellCenter({ laneIndex, columnIndex });

  return {
    playerId: "player_audio",
    slot: 0,
    name: "Audio Tester",
    connected: true,
    x: center.x - 20,
    y: center.y,
    aimX: 1,
    aimY: 0,
    hp: CombatNumbersV01.hero.maxHp,
    maxHp: CombatNumbersV01.hero.maxHp,
    alive: true,
    ammoInMagazine: CombatNumbersV01.weapon.pistol.magazineSize,
    magazineSize: CombatNumbersV01.weapon.pistol.magazineSize,
    reserveAmmo: CombatNumbersV01.weapon.pistol.initialReserveAmmo,
    maxReserveAmmo: CombatNumbersV01.weapon.pistol.maxReserveAmmo,
    reloading: false,
    ammoPurchaseCooldownRemainingSeconds: 0,
    hasEvolved: false,
    stats: {}
  };
}
