import type { FeedbackEvent } from "@sprout-and-steel/shared";
import type { FxAssetType } from "../assets/artAssetRegistry";
import type { AnimationId } from "./animationRegistry";

export type FeedbackFxAnimationSpec = {
  animationId: Extract<
    AnimationId,
    | "fx.muzzleFlash"
    | "fx.hitSpark"
    | "fx.sunGain"
    | "fx.plantPlace"
    | "fx.enemyDeath"
    | "fx.bossWeakpoint"
    | "fx.bossChargeWarning"
    | "fx.bossInterrupted"
  >;
  fxType: FxAssetType;
  height: number;
  width?: number;
  durationMs: number;
  alpha?: number;
  startScale?: number;
  endScale?: number;
  depth?: number;
  rotation?: number;
  screenShake?: boolean;
  screenShakeDurationMs?: number;
  screenShakeIntensity?: number;
};

export function feedbackEventToFxAnimation(event: FeedbackEvent): FeedbackFxAnimationSpec | undefined {
  if (event.eventType === "hero.shoot" || event.eventType === "plant.shoot") {
    return {
      animationId: "fx.muzzleFlash",
      fxType: "muzzle_flash",
      height: 34,
      durationMs: 180,
      startScale: 0.9,
      endScale: 1.35,
      rotation: eventDirectionRotation(event)
    };
  }

  if (event.eventType === "plant.placed") {
    return {
      animationId: "fx.plantPlace",
      fxType: "plant_place",
      height: 74,
      durationMs: 520,
      alpha: 0.86,
      startScale: 0.82,
      endScale: 1.2,
      depth: 24
    };
  }

  if (event.eventType === "sun.gained") {
    return {
      animationId: "fx.sunGain",
      fxType: "sun_gain",
      height: 54,
      durationMs: 560,
      startScale: 0.82,
      endScale: 1.25,
      depth: 42
    };
  }

  if (event.eventType === "enemy.hit" || event.eventType === "base.damaged" || event.eventType === "boss.chargeFailed") {
    return {
      animationId: "fx.hitSpark",
      fxType: "hit_spark",
      height: 42,
      durationMs: 300,
      startScale: 0.85,
      endScale: 1.4,
      depth: 41
    };
  }

  if (event.eventType === "enemy.killed") {
    return {
      animationId: "fx.enemyDeath",
      fxType: "hit_spark",
      height: 70,
      durationMs: 420,
      startScale: 0.75,
      endScale: 1.8,
      depth: 42
    };
  }

  if (event.eventType === "boss.weakPointExposed") {
    return {
      animationId: "fx.bossWeakpoint",
      fxType: "boss_weakpoint",
      height: 66,
      durationMs: 680,
      alpha: 0.96,
      startScale: 0.85,
      endScale: 1.15,
      depth: 43
    };
  }

  if (event.eventType === "boss.chargeStarted") {
    return {
      animationId: "fx.bossChargeWarning",
      fxType: "boss_charge_warning",
      width: 230,
      height: 54,
      durationMs: 760,
      alpha: 0.9,
      startScale: 0.96,
      endScale: 1.04,
      rotation: Math.PI,
      depth: 38
    };
  }

  if (event.eventType === "boss.interrupted") {
    return {
      animationId: "fx.bossInterrupted",
      fxType: "hit_spark",
      height: 92,
      durationMs: 460,
      startScale: 0.8,
      endScale: 1.9,
      depth: 44,
      screenShake: true,
      screenShakeDurationMs: 180,
      screenShakeIntensity: 0.006
    };
  }

  return undefined;
}

function eventDirectionRotation(event: FeedbackEvent): number {
  return typeof event.data?.dirY === "number" && typeof event.data?.dirX === "number"
    ? Math.atan2(event.data.dirY, event.data.dirX)
    : 0;
}
