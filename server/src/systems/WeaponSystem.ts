import {
  CombatNumbersV01,
  createEntityId,
  normalizeVector,
  type ActionAcceptedPayload,
  type ActionRejectedPayload,
  type ActionRejectReason,
  type FeedbackEvent,
  type MatchState,
  type PlayerState,
  type RequestId
} from "@sprout-and-steel/shared";
import type { EconomySystem } from "./EconomySystem";
import { getAmmoPackConfig } from "./EvolutionSystem";
import type { ProjectileSystem } from "./ProjectileSystem";

const WEAPON_MATCH_STATES = new Set<MatchState>(["WAVE_PREP", "WAVE_ACTIVE", "WAVE_CLEAR", "BOSS_PREP", "BOSS_ACTIVE"]);
const TIMER_EPSILON_SECONDS = 0.000_001;

export type WeaponRuntimePlayerState = PlayerState & {
  nextAllowedShotTimeMs?: number;
};

export type ShootActionInput = {
  requestId: RequestId;
  matchState: MatchState;
  player: WeaponRuntimePlayerState | undefined;
  aimWorldX: number;
  aimWorldY: number;
  projectiles: ProjectileSystem;
  serverTimeMs: number;
};

export type ReloadActionInput = {
  requestId: RequestId;
  matchState: MatchState;
  player: WeaponRuntimePlayerState | undefined;
  serverTimeMs: number;
};

export type BuyAmmoActionInput = {
  requestId: RequestId;
  matchState: MatchState;
  player: WeaponRuntimePlayerState | undefined;
  economy: EconomySystem;
  serverTimeMs: number;
};

export type WeaponActionResult =
  | {
      ok: true;
      accepted: ActionAcceptedPayload;
      feedback?: FeedbackEvent;
    }
  | {
      ok: false;
      rejected: ActionRejectedPayload;
      feedback?: FeedbackEvent;
    };

export class WeaponSystem {
  private eventSequence = 0;

  tryShoot(input: ShootActionInput): WeaponActionResult {
    const baseRejection = validateWeaponAction(input.matchState, input.player);
    if (baseRejection) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "shoot", baseRejection.reason, baseRejection.message, input.serverTimeMs)
      };
    }

    const player = input.player;
    if (!player) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "shoot", "PLAYER_DEAD", "Dead players cannot shoot.", input.serverTimeMs)
      };
    }

    if (player.reloading) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "shoot", "RELOADING", "Cannot shoot while reloading.", input.serverTimeMs)
      };
    }

    const nextAllowedShotTimeMs = player.nextAllowedShotTimeMs ?? 0;
    if (input.serverTimeMs + 0.001 < nextAllowedShotTimeMs) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "shoot", "FIRE_RATE_LIMITED", "Pistol is not ready yet.", input.serverTimeMs)
      };
    }

    if (player.ammoInMagazine <= 0) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "shoot", "AMMO_EMPTY", "Magazine is empty.", input.serverTimeMs),
        feedback: this.feedback("hero.dryFire", player, input.serverTimeMs)
      };
    }

    const aimDirection = normalizeVector({
      x: input.aimWorldX - player.x,
      y: input.aimWorldY - player.y
    });
    if (aimDirection.x === 0 && aimDirection.y === 0) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "shoot", "UNKNOWN_ERROR", "Aim direction is invalid.", input.serverTimeMs)
      };
    }

    player.aimX = aimDirection.x;
    player.aimY = aimDirection.y;
    player.ammoInMagazine = Math.max(0, player.ammoInMagazine - 1);
    player.nextAllowedShotTimeMs = input.serverTimeMs + 1000 / CombatNumbersV01.weapon.pistol.fireRatePerSecond;
    player.stats.shotsFired = (player.stats.shotsFired ?? 0) + 1;

    const bullet = input.projectiles.spawnHeroBullet(player, aimDirection, input.serverTimeMs);

    return {
      ok: true,
      accepted: {
        requestId: input.requestId,
        action: "shoot",
        serverTimeMs: input.serverTimeMs,
        affectedEntityIds: [bullet.id]
      },
      feedback: this.feedback("hero.shoot", player, input.serverTimeMs, {
        bulletId: bullet.id,
        ammoInMagazine: player.ammoInMagazine
      })
    };
  }

  tryReload(input: ReloadActionInput): WeaponActionResult {
    const baseRejection = validateWeaponAction(input.matchState, input.player);
    if (baseRejection) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "reload", baseRejection.reason, baseRejection.message, input.serverTimeMs)
      };
    }

    const player = input.player;
    if (!player) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "reload", "PLAYER_DEAD", "Dead players cannot reload.", input.serverTimeMs)
      };
    }

    if (player.reloading) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "reload", "RELOADING", "Reload is already in progress.", input.serverTimeMs)
      };
    }

    if (player.ammoInMagazine >= player.magazineSize) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "reload", "UNKNOWN_ERROR", "Magazine is already full.", input.serverTimeMs)
      };
    }

    if (player.reserveAmmo <= 0) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "reload", "RESERVE_AMMO_EMPTY", "No reserve ammo available.", input.serverTimeMs)
      };
    }

    player.reloading = true;
    player.reloadRemainingSeconds = CombatNumbersV01.weapon.pistol.reloadSeconds;

    return {
      ok: true,
      accepted: {
        requestId: input.requestId,
        action: "reload",
        serverTimeMs: input.serverTimeMs
      },
      feedback: this.feedback("hero.reloadStart", player, input.serverTimeMs, {
        reloadSeconds: CombatNumbersV01.weapon.pistol.reloadSeconds
      })
    };
  }

  tryBuyAmmo(input: BuyAmmoActionInput): WeaponActionResult {
    const baseRejection = validateWeaponAction(input.matchState, input.player);
    if (baseRejection) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "buyAmmo", baseRejection.reason, baseRejection.message, input.serverTimeMs)
      };
    }

    const player = input.player;
    if (!player) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "buyAmmo", "PLAYER_DEAD", "Dead players cannot buy ammo.", input.serverTimeMs)
      };
    }

    if (player.ammoPurchaseCooldownRemainingSeconds > 0) {
      return {
        ok: false,
        rejected: rejected(
          input.requestId,
          "buyAmmo",
          "AMMO_PURCHASE_COOLDOWN",
          "Ammo purchase is cooling down.",
          input.serverTimeMs
        )
      };
    }

    if (player.reserveAmmo >= player.maxReserveAmmo) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "buyAmmo", "RESERVE_AMMO_FULL", "Reserve ammo is already full.", input.serverTimeMs)
      };
    }

    const config = getAmmoPackConfig(player);
    if (!input.economy.canSpend(config.sunCost)) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "buyAmmo", "NOT_ENOUGH_SUN", "Not enough shared sun.", input.serverTimeMs)
      };
    }

    if (!input.economy.spend(config.sunCost)) {
      return {
        ok: false,
        rejected: rejected(input.requestId, "buyAmmo", "NOT_ENOUGH_SUN", "Not enough shared sun.", input.serverTimeMs)
      };
    }

    player.reserveAmmo = Math.min(player.maxReserveAmmo, player.reserveAmmo + config.reserveGain);
    player.ammoPurchaseCooldownRemainingSeconds = config.cooldownSeconds;
    player.stats.ammoPurchased = (player.stats.ammoPurchased ?? 0) + 1;
    player.stats.sunSpent = (player.stats.sunSpent ?? 0) + config.sunCost;

    return {
      ok: true,
      accepted: {
        requestId: input.requestId,
        action: "buyAmmo",
        serverTimeMs: input.serverTimeMs
      }
    };
  }

  update(deltaSeconds: number, players: Iterable<WeaponRuntimePlayerState>, serverTimeMs: number): FeedbackEvent[] {
    if (deltaSeconds <= 0) {
      return [];
    }

    const events: FeedbackEvent[] = [];
    for (const player of players) {
      player.ammoPurchaseCooldownRemainingSeconds = roundSeconds(
        Math.max(0, player.ammoPurchaseCooldownRemainingSeconds - deltaSeconds)
      );

      if (!player.reloading) {
        if (player.reloadRemainingSeconds !== undefined) {
          delete player.reloadRemainingSeconds;
        }
        continue;
      }

      const remaining = (player.reloadRemainingSeconds ?? CombatNumbersV01.weapon.pistol.reloadSeconds) - deltaSeconds;
      if (remaining > TIMER_EPSILON_SECONDS) {
        player.reloadRemainingSeconds = roundSeconds(remaining);
        continue;
      }

      const needed = Math.max(0, player.magazineSize - player.ammoInMagazine);
      const transferred = Math.min(needed, player.reserveAmmo);
      player.ammoInMagazine += transferred;
      player.reserveAmmo -= transferred;
      player.reloading = false;
      delete player.reloadRemainingSeconds;
      events.push(
        this.feedback("hero.reloadComplete", player, serverTimeMs, {
          transferred,
          ammoInMagazine: player.ammoInMagazine,
          reserveAmmo: player.reserveAmmo
        })
      );
    }

    return events;
  }

  private feedback(
    eventType: FeedbackEvent["eventType"],
    player: PlayerState,
    serverTimeMs: number,
    data: Record<string, unknown> = {}
  ): FeedbackEvent {
    return {
      id: createEntityId("event", ++this.eventSequence),
      eventType,
      serverTimeMs,
      playerId: player.playerId,
      x: player.x + player.aimX * 20,
      y: player.y + player.aimY * 20,
      data
    };
  }
}

function validateWeaponAction(
  matchState: MatchState,
  player: WeaponRuntimePlayerState | undefined
): { reason: ActionRejectReason; message: string } | undefined {
  if (!WEAPON_MATCH_STATES.has(matchState)) {
    return {
      reason: "NOT_IN_VALID_MATCH_STATE",
      message: "Weapon actions are not allowed in the current match state."
    };
  }

  if (!player?.alive) {
    return {
      reason: "PLAYER_DEAD",
      message: "Dead players cannot use weapons."
    };
  }

  return undefined;
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

function roundSeconds(value: number): number {
  return Number(value.toFixed(3));
}
