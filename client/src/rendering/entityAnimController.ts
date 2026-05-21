import type { BossState, EnemyState, PlantState, PlayerState, Vector2 } from "@sprout-and-steel/shared";
import type { AnimationId } from "./animationRegistry";

export type PlayerAnimationState = {
  animationId: Extract<AnimationId, "hero.rangerA.idle" | "hero.rangerA.run" | "hero.rangerB.idle" | "hero.rangerB.run">;
  motionState: "idle" | "run";
  overlayState?: "reload" | "down";
};

export type PlantAnimationState = {
  animationId: Extract<
    AnimationId,
    | "plant.sunbloom.idle"
    | "plant.sunbloom.produce"
    | "plant.peashotter.idle"
    | "plant.peashotter.shoot"
    | "plant.barkwall.healthy"
    | "plant.barkwall.damaged"
  >;
  motionState: "idle" | "produce" | "shoot" | "damaged";
};

export type EnemyAnimationState = {
  animationId: Extract<AnimationId, "enemy.shambler.walk" | "enemy.runner.walk" | "enemy.brute.walk">;
  motionState: "walk" | "attack" | "death";
};

export type BossAnimationState = {
  animationId: Extract<AnimationId, "boss.ironmaw.idle" | "boss.ironmaw.chargeWindup">;
  motionState: "idle" | "charge";
  weakPointPulse: boolean;
  chargeWarningPulse: boolean;
};

export type TransientAnimationKind =
  | "heroShoot"
  | "heroReload"
  | "plantShoot"
  | "plantProduce"
  | "plantPlace"
  | "entityHit"
  | "enemyDeath"
  | "bossCharge"
  | "bossInterrupted";

export type TransientAnimationState = {
  kind: TransientAnimationKind;
  startedAtMs: number;
  durationMs: number;
};

export type AnimationTransform = {
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  alpha: number;
  tint?: number;
};

const IDLE_MOVE_EPSILON_PX = 1.4;

export function getPlayerAnimationState(player: PlayerState, previousPosition?: Vector2): PlayerAnimationState {
  const isMoving = previousPosition ? Math.hypot(player.x - previousPosition.x, player.y - previousPosition.y) > IDLE_MOVE_EPSILON_PX : false;
  const slotPrefix = player.slot === 0 ? "hero.rangerA" : "hero.rangerB";
  const motionState = isMoving ? "run" : "idle";
  const state: PlayerAnimationState = {
    animationId: `${slotPrefix}.${motionState}` as PlayerAnimationState["animationId"],
    motionState
  };

  if (!player.alive) {
    state.overlayState = "down";
  } else if (player.reloading) {
    state.overlayState = "reload";
  }

  return state;
}

export function getPlantAnimationState(plant: PlantState): PlantAnimationState {
  if (plant.type === "sunbloom") {
    return { animationId: "plant.sunbloom.idle", motionState: "idle" };
  }
  if (plant.type === "peashotter") {
    return { animationId: "plant.peashotter.idle", motionState: "idle" };
  }

  const damaged = plant.maxHp > 0 && plant.hp / plant.maxHp <= 0.5;
  return {
    animationId: damaged ? "plant.barkwall.damaged" : "plant.barkwall.healthy",
    motionState: damaged ? "damaged" : "idle"
  };
}

export function getEnemyAnimationState(enemy: EnemyState): EnemyAnimationState {
  const animationId = `enemy.${enemy.type}.walk` as EnemyAnimationState["animationId"];
  if (enemy.state === "DEAD") {
    return { animationId, motionState: "death" };
  }
  if (enemy.state === "ATTACKING_PLANT") {
    return { animationId, motionState: "attack" };
  }
  return { animationId, motionState: "walk" };
}

export function getBossAnimationState(boss: BossState): BossAnimationState {
  const chargeWarningPulse = boss.currentSkill === "charge_windup" || boss.charging;
  return {
    animationId: chargeWarningPulse ? "boss.ironmaw.chargeWindup" : "boss.ironmaw.idle",
    motionState: chargeWarningPulse ? "charge" : "idle",
    weakPointPulse: boss.weakPointActive,
    chargeWarningPulse
  };
}

export function getLoopTransform(animationId: AnimationId, nowMs: number): AnimationTransform {
  const wave = Math.sin(nowMs / loopPeriodMs(animationId));
  const pulse = (wave + 1) / 2;

  if (animationId === "hero.rangerA.run" || animationId === "hero.rangerB.run") {
    return transform({
      offsetY: -2.5 - pulse * 3.5,
      scaleX: 1.02 + pulse * 0.02,
      scaleY: 0.98 + pulse * 0.05,
      rotation: (pulse - 0.5) * 0.08
    });
  }

  if (animationId === "hero.rangerA.idle" || animationId === "hero.rangerB.idle") {
    return transform({
      offsetY: -1.2 - pulse * 1.4,
      scaleX: 1,
      scaleY: 1 + pulse * 0.018
    });
  }

  if (animationId.startsWith("enemy.")) {
    return transform({
      offsetY: -pulse * 2.2,
      scaleX: 1 + pulse * 0.025,
      scaleY: 0.985 + pulse * 0.035,
      rotation: (pulse - 0.5) * 0.08
    });
  }

  if (animationId === "boss.ironmaw.chargeWindup") {
    return transform({
      offsetY: -pulse * 2,
      scaleX: 1 + pulse * 0.035,
      scaleY: 1 + pulse * 0.035,
      rotation: (pulse - 0.5) * 0.025
    });
  }

  if (animationId === "boss.ironmaw.idle") {
    return transform({
      offsetY: -pulse * 1.2,
      scaleX: 1 + pulse * 0.012,
      scaleY: 1 + pulse * 0.018
    });
  }

  if (animationId === "plant.sunbloom.idle" || animationId === "plant.barkwall.damaged") {
    return transform({
      offsetY: -pulse * 0.9,
      scaleX: 1 + pulse * 0.012,
      scaleY: 1 + pulse * 0.018
    });
  }

  return transform();
}

export function getTransientTransform(state: TransientAnimationState | undefined, nowMs: number): AnimationTransform {
  if (!state) {
    return transform();
  }

  const progress = getTransientProgress(state, nowMs);
  if (progress >= 1) {
    return transform();
  }

  const out = 1 - progress;
  const pop = Math.sin(progress * Math.PI);

  if (state.kind === "heroShoot") {
    return transform({ offsetX: -6 * out, scaleX: 1 + pop * 0.08, scaleY: 1 - pop * 0.035, rotation: -0.08 * out });
  }
  if (state.kind === "heroReload") {
    return transform({ scaleX: 1 + pop * 0.035, scaleY: 1 + pop * 0.035, tint: 0x8fc4ff });
  }
  if (state.kind === "plantShoot") {
    return transform({ offsetX: -5 * out, scaleX: 1 + pop * 0.1, scaleY: 1 - pop * 0.08 });
  }
  if (state.kind === "plantProduce" || state.kind === "plantPlace") {
    return transform({ offsetY: -4 * pop, scaleX: 1 + pop * 0.12, scaleY: 1 + pop * 0.12, tint: 0xffef93 });
  }
  if (state.kind === "entityHit") {
    return transform({ offsetX: 2 * Math.sin(progress * Math.PI * 6) * out, scaleX: 1 + pop * 0.04, scaleY: 1 + pop * 0.04, tint: 0xfff1a6 });
  }
  if (state.kind === "enemyDeath") {
    return transform({ scaleX: 1 + progress * 0.45, scaleY: 1 + progress * 0.45, alpha: out, tint: 0xff8f7e });
  }
  if (state.kind === "bossCharge") {
    return transform({ scaleX: 1 + pop * 0.05, scaleY: 1 + pop * 0.05, tint: 0xffd56b });
  }
  if (state.kind === "bossInterrupted") {
    return transform({ offsetX: 4 * Math.sin(progress * Math.PI * 8) * out, scaleX: 1 + pop * 0.06, scaleY: 1 + pop * 0.06, tint: 0x8fc4ff });
  }

  return transform();
}

export function getTransientProgress(state: TransientAnimationState, nowMs: number): number {
  return Math.min(1, Math.max(0, (nowMs - state.startedAtMs) / state.durationMs));
}

export function isTransientAnimationActive(state: TransientAnimationState | undefined, nowMs: number): boolean {
  return state !== undefined && getTransientProgress(state, nowMs) < 1;
}

export function combineTransforms(...transforms: AnimationTransform[]): AnimationTransform {
  return transforms.reduce((combined, next) => {
    const merged: AnimationTransform = {
      offsetX: combined.offsetX + next.offsetX,
      offsetY: combined.offsetY + next.offsetY,
      scaleX: combined.scaleX * next.scaleX,
      scaleY: combined.scaleY * next.scaleY,
      rotation: combined.rotation + next.rotation,
      alpha: combined.alpha * next.alpha
    };
    const tint = next.tint ?? combined.tint;
    if (tint !== undefined) {
      merged.tint = tint;
    }
    return merged;
  }, transform());
}

function loopPeriodMs(animationId: AnimationId): number {
  if (animationId === "enemy.runner.walk") {
    return 95;
  }
  if (animationId === "enemy.brute.walk") {
    return 185;
  }
  if (animationId.startsWith("enemy.")) {
    return 145;
  }
  if (animationId === "boss.ironmaw.chargeWindup") {
    return 85;
  }
  if (animationId.startsWith("boss.")) {
    return 430;
  }
  if (animationId.includes(".run")) {
    return 105;
  }
  return 360;
}

function transform(overrides: Partial<AnimationTransform> = {}): AnimationTransform {
  return {
    offsetX: 0,
    offsetY: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    alpha: 1,
    ...overrides
  };
}
