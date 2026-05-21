export const CombatNumbersV01 = {
  match: {
    countdownSeconds: 3,
    wave1PrepSeconds: 15,
    normalWavePrepSeconds: 10,
    waveClearSeconds: 5,
    bossPrepSeconds: 20,
    resultDelaySeconds: 3
  },

  base: {
    maxHp: 10
  },

  economy: {
    initialSharedSun: 150,
    sunDropAmount: 25,
    bossPhase2SunReward: 75
  },

  hero: {
    maxHp: 100,
    moveSpeed: 170,
    collisionRadius: 16,
    interactRange: 90,
    invulnerableAfterHitSeconds: 0.6,
    respawnSeconds: 5,
    respawnInvulnerableSeconds: 1.5
  },

  weapon: {
    pistol: {
      damage: 25,
      fireRatePerSecond: 3,
      magazineSize: 8,
      initialReserveAmmo: 24,
      maxReserveAmmo: 32,
      reloadSeconds: 1.2,
      bulletSpeed: 520,
      bulletLifetimeSeconds: 1.4,
      bulletRadius: 5
    },
    ammoPack: {
      sunCost: 50,
      reserveGain: 16,
      cooldownSeconds: 10
    }
  },

  plants: {
    sunbloom: {
      sunCost: 50,
      maxHp: 80,
      firstProduceDelaySeconds: 6,
      produceIntervalSeconds: 8,
      produceAmount: 25
    },
    peashotter: {
      sunCost: 100,
      maxHp: 110,
      damage: 20,
      attackIntervalSeconds: 1.2,
      projectileSpeed: 360,
      projectileLifetimeSeconds: 2.2,
      projectileRadius: 6
    },
    barkwall: {
      sunCost: 75,
      maxHp: 450
    }
  },

  enemies: {
    shambler: {
      maxHp: 100,
      moveSpeed: 34,
      plantDamage: 20,
      plantAttackIntervalSeconds: 1,
      heroContactDamage: 8,
      heroContactCooldownSeconds: 1,
      baseDamage: 1,
      sunDropChance: 0.2
    },
    runner: {
      maxHp: 70,
      moveSpeed: 66,
      plantDamage: 15,
      plantAttackIntervalSeconds: 0.8,
      heroContactDamage: 10,
      heroContactCooldownSeconds: 0.8,
      baseDamage: 1,
      sunDropChance: 0.2
    },
    brute: {
      maxHp: 260,
      moveSpeed: 24,
      plantDamage: 25,
      plantAttackIntervalSeconds: 1,
      heroContactDamage: 14,
      heroContactCooldownSeconds: 1,
      baseDamage: 2,
      sunDropChance: 0.4
    }
  },

  evolution: {
    unlockAfterWaveCleared: 3,
    sunCost: 200,
    firepower: {
      pistolDamage: 35,
      magazineSize: 10,
      maxReserveAmmo: 36,
      weakPointMultiplier: 2.5
    },
    control: {
      slowPercent: 0.2,
      runnerSlowPercent: 0.35,
      slowDurationSeconds: 1.5,
      bonusInterruptPointsPerChargeMax: 2
    },
    support: {
      ammoPackSunCost: 40,
      ammoPurchaseCooldownSeconds: 8,
      sunDropChanceBonus: 0.1,
      shieldValue: 40,
      shieldRange: 80,
      shieldDurationSeconds: 3,
      shieldCooldownSeconds: 12
    }
  },

  boss: {
    ironmaw: {
      maxHp: 2200,
      phase2HpThreshold: 1100,
      phase1MoveSpeed: 8,
      phase2MoveSpeed: 11,
      mainLane: 2,
      plantDamageLanes: [1, 2, 3],
      collisionRadius: 64,
      baseDamage: 5,
      weakPointMultiplier: 2,
      hammerSlam: {
        firstCastSeconds: 8,
        cooldownSeconds: 10,
        damageToNonWallPlant: 150,
        damageToWallPlant: 120,
        damageToHero: 30,
        warningSeconds: 0.8
      },
      summonMinions: {
        firstCastSeconds: 12,
        cooldownSeconds: 14,
        count: 2
      },
      weakPointExpose: {
        firstCastSeconds: 6,
        cooldownSeconds: 12,
        durationSeconds: 3
      },
      phaseTransition: {
        stunSeconds: 2,
        teamSunReward: 75
      },
      charge: {
        firstCastAfterPhase2Seconds: 6,
        cooldownSeconds: 16,
        windupSeconds: 3,
        requiredInterruptPoints: 6,
        failedChargeDistance: 120,
        damageToFirstPlant: 350,
        damageToHero: 50,
        recoverySeconds: 1.5
      },
      phase2Summon: {
        firstCastAfterPhase2Seconds: 10,
        cooldownSeconds: 12,
        count: 2
      },
      sunSuppression: {
        firstCastAfterPhase2Seconds: 14,
        cooldownSeconds: 22,
        durationSeconds: 5
      }
    }
  }
} as const;
