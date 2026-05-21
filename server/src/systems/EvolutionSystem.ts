import {
  CombatNumbersV01,
  EVOLUTION_PATHS,
  createEntityId,
  type ActionAcceptedPayload,
  type ActionRejectedPayload,
  type ActionRejectReason,
  type EnemyType,
  type EvolutionPath,
  type FeedbackEvent,
  type MatchState,
  type PlayerState,
  type RequestId
} from "@sprout-and-steel/shared";
import type { EconomySystem } from "./EconomySystem";

const EVOLUTION_MATCH_STATES = new Set<MatchState>(["WAVE_PREP", "WAVE_ACTIVE", "WAVE_CLEAR", "BOSS_PREP", "BOSS_ACTIVE"]);

export type EvolutionActionInput = {
  requestId: RequestId;
  matchState: MatchState;
  evolutionUnlocked: boolean;
  player: PlayerState | undefined;
  path: unknown;
  economy: EconomySystem;
  serverTimeMs: number;
};

export type EvolutionActionResult =
  | {
      ok: true;
      accepted: ActionAcceptedPayload;
      feedback: FeedbackEvent;
    }
  | {
      ok: false;
      rejected: ActionRejectedPayload;
    };

export type AmmoPackConfig = {
  sunCost: number;
  reserveGain: number;
  cooldownSeconds: number;
};

export type ControlSlowModifier = {
  slowPercent: number;
  durationSeconds: number;
};

export class EvolutionSystem {
  private eventSequence = 0;

  tryEvolve(input: EvolutionActionInput): EvolutionActionResult {
    const baseRejection = validateEvolutionAction(input.matchState, input.player);
    if (baseRejection) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "evolve", baseRejection.reason, baseRejection.message, input.serverTimeMs)
      };
    }

    const player = input.player;
    if (!player) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "evolve", "PLAYER_DEAD", "Dead players cannot evolve.", input.serverTimeMs)
      };
    }

    if (!input.evolutionUnlocked) {
      return {
        ok: false,
        rejected: rejected(
          input.requestId,
          "evolve",
          "EVOLUTION_NOT_UNLOCKED",
          "Evolution unlocks after Wave 3 is cleared.",
          input.serverTimeMs
        )
      };
    }

    if (player.hasEvolved) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "evolve", "ALREADY_EVOLVED", "This player has already evolved.", input.serverTimeMs)
      };
    }

    if (!isEvolutionPath(input.path)) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "evolve", "INVALID_EVOLUTION_PATH", "Evolution path is invalid.", input.serverTimeMs)
      };
    }

    const sunCost = CombatNumbersV01.evolution.sunCost;
    if (!input.economy.canSpend(sunCost)) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "evolve", "NOT_ENOUGH_SUN", "Not enough shared sun.", input.serverTimeMs)
      };
    }

    if (!input.economy.spend(sunCost)) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "evolve", "NOT_ENOUGH_SUN", "Not enough shared sun.", input.serverTimeMs)
      };
    }

    applyEvolutionModifiers(player, input.path);
    player.hasEvolved = true;
    player.evolutionPath = input.path;
    player.stats.sunSpent = (player.stats.sunSpent ?? 0) + sunCost;

    return {
      ok: true,
      accepted: {
        requestId: input.requestId,
        action: "evolve",
        serverTimeMs: input.serverTimeMs
      },
      feedback: {
        id: createEntityId("event", ++this.eventSequence),
        eventType: "hero.evolved",
        serverTimeMs: input.serverTimeMs,
        playerId: player.playerId,
        x: player.x,
        y: player.y,
        data: {
          path: input.path,
          sunCost,
          modifiers: getEvolutionModifierSummary(input.path)
        }
      }
    };
  }
}

export function getHeroPistolDamage(player: PlayerState | undefined): number {
  return player?.evolutionPath === "firepower"
    ? CombatNumbersV01.evolution.firepower.pistolDamage
    : CombatNumbersV01.weapon.pistol.damage;
}

export function getAmmoPackConfig(player: PlayerState | undefined): AmmoPackConfig {
  if (player?.evolutionPath === "support") {
    return {
      sunCost: CombatNumbersV01.evolution.support.ammoPackSunCost,
      reserveGain: CombatNumbersV01.weapon.ammoPack.reserveGain,
      cooldownSeconds: CombatNumbersV01.evolution.support.ammoPurchaseCooldownSeconds
    };
  }

  return {
    sunCost: CombatNumbersV01.weapon.ammoPack.sunCost,
    reserveGain: CombatNumbersV01.weapon.ammoPack.reserveGain,
    cooldownSeconds: CombatNumbersV01.weapon.ammoPack.cooldownSeconds
  };
}

export function getControlSlowModifier(player: PlayerState | undefined, enemyType: EnemyType): ControlSlowModifier | undefined {
  if (player?.evolutionPath !== "control") {
    return undefined;
  }

  return {
    slowPercent:
      enemyType === "runner" ? CombatNumbersV01.evolution.control.runnerSlowPercent : CombatNumbersV01.evolution.control.slowPercent,
    durationSeconds: CombatNumbersV01.evolution.control.slowDurationSeconds
  };
}

export function getSunDropChanceBonus(player: PlayerState | undefined): number {
  return player?.evolutionPath === "support" ? CombatNumbersV01.evolution.support.sunDropChanceBonus : 0;
}

export function getBossInterruptBonus(player: PlayerState | undefined): number {
  return player?.evolutionPath === "control" ? CombatNumbersV01.evolution.control.bonusInterruptPointsPerChargeMax : 0;
}

function applyEvolutionModifiers(player: PlayerState, path: EvolutionPath): void {
  if (path !== "firepower") {
    return;
  }

  player.magazineSize = CombatNumbersV01.evolution.firepower.magazineSize;
  player.maxReserveAmmo = CombatNumbersV01.evolution.firepower.maxReserveAmmo;
  player.ammoInMagazine = Math.min(player.ammoInMagazine, player.magazineSize);
  player.reserveAmmo = Math.min(player.reserveAmmo, player.maxReserveAmmo);
}

function getEvolutionModifierSummary(path: EvolutionPath): Record<string, number | string> {
  if (path === "firepower") {
    return {
      pistolDamage: CombatNumbersV01.evolution.firepower.pistolDamage,
      magazineSize: CombatNumbersV01.evolution.firepower.magazineSize,
      maxReserveAmmo: CombatNumbersV01.evolution.firepower.maxReserveAmmo,
      weakPointMultiplier: CombatNumbersV01.evolution.firepower.weakPointMultiplier
    };
  }

  if (path === "control") {
    return {
      slowPercent: CombatNumbersV01.evolution.control.slowPercent,
      runnerSlowPercent: CombatNumbersV01.evolution.control.runnerSlowPercent,
      slowDurationSeconds: CombatNumbersV01.evolution.control.slowDurationSeconds,
      bonusInterruptPointsPerChargeMax: CombatNumbersV01.evolution.control.bonusInterruptPointsPerChargeMax
    };
  }

  return {
    ammoPackSunCost: CombatNumbersV01.evolution.support.ammoPackSunCost,
    ammoPurchaseCooldownSeconds: CombatNumbersV01.evolution.support.ammoPurchaseCooldownSeconds,
    sunDropChanceBonus: CombatNumbersV01.evolution.support.sunDropChanceBonus,
    shieldDeferredToPhase: 14
  };
}

function validateEvolutionAction(
  matchState: MatchState,
  player: PlayerState | undefined
): { reason: ActionRejectReason; message: string } | undefined {
  if (!EVOLUTION_MATCH_STATES.has(matchState)) {
    return {
      reason: "NOT_IN_VALID_MATCH_STATE",
      message: "Evolution is not allowed in the current match state."
    };
  }

  if (!player?.alive) {
    return {
      reason: "PLAYER_DEAD",
      message: "Dead players cannot evolve."
    };
  }

  return undefined;
}

function isEvolutionPath(path: unknown): path is EvolutionPath {
  return typeof path === "string" && EVOLUTION_PATHS.includes(path as EvolutionPath);
}

function rejected(
  requestId: RequestId,
  action: ActionRejectedPayload["action"],
  reason: ActionRejectReason,
  message: string,
  serverTimeMs: number
): ActionRejectedPayload {
  return {
    requestId,
    action,
    reason,
    message,
    serverTimeMs
  };
}
