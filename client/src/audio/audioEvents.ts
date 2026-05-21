import type { ActionAcceptedPayload, FeedbackEvent } from "@sprout-and-steel/shared";
import { P0_AUDIO_EVENT_IDS, type AudioEventId } from "./audioRegistry";

export { P0_AUDIO_EVENT_IDS };
export type { AudioEventId };

const FEEDBACK_AUDIO_MAP = {
  "hero.shoot": ["weapon.pistolShot"],
  "hero.dryFire": ["weapon.dryFire"],
  "hero.reloadStart": ["weapon.reload"],
  "hero.reloadComplete": [],
  "hero.evolved": [],
  "plant.placed": ["plant.place"],
  "plant.shoot": ["plant.shoot"],
  "plant.destroyed": [],
  "sun.gained": ["sun.gain"],
  "enemy.spawned": [],
  "enemy.hit": ["enemy.hit"],
  "enemy.killed": ["enemy.death"],
  "base.damaged": ["base.damaged"],
  "wave.started": ["wave.start"],
  "boss.spawned": ["boss.spawn"],
  "boss.phaseChanged": [],
  "boss.weakPointExposed": [],
  "boss.chargeStarted": ["boss.chargeWarning"],
  "boss.interrupted": ["boss.interrupted"],
  "boss.chargeFailed": [],
  "match.victory": ["match.victory"],
  "match.defeat": ["match.defeat"]
} as const satisfies Record<FeedbackEvent["eventType"], readonly AudioEventId[]>;

export function audioEventIdsFromFeedback(event: Pick<FeedbackEvent, "eventType">): AudioEventId[] {
  return [...FEEDBACK_AUDIO_MAP[event.eventType]];
}

export function audioEventIdFromActionAccepted(
  payload: Pick<ActionAcceptedPayload, "action">
): AudioEventId | undefined {
  if (payload.action === "plant") {
    return "plant.place";
  }
  if (payload.action === "reload") {
    return "weapon.reload";
  }
  return undefined;
}

export function audioEventIdFromActionRejected(): AudioEventId {
  return "ui.error";
}

export function audioEventIdFromMatchResult(result: "VICTORY" | "DEFEAT"): AudioEventId {
  return result === "VICTORY" ? "match.victory" : "match.defeat";
}
