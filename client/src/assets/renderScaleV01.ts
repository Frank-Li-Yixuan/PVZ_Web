export const RenderScaleV01 = {
  heroes: {
    slot0: {
      width: 32,
      height: 40,
      ringWidth: 42,
      ringHeight: 30,
      aimLength: 42,
      labelOffsetY: 26,
      color: 0x4fc3d7
    },
    slot1: {
      width: 34,
      height: 40,
      ringWidth: 44,
      ringHeight: 30,
      aimLength: 42,
      labelOffsetY: 26,
      color: 0xf2a64b
    }
  },
  plants: {
    sunbloom: {
      shadowWidth: 54,
      shadowHeight: 14,
      shadowOffsetY: 18,
      bodyRadius: 22,
      outlineRadius: 27,
      hpBarWidth: 58,
      hpBarOffsetY: -38,
      leafWidth: 28,
      leafHeight: 14,
      leafOffsetX: 14,
      leafOffsetY: 12,
      bodyColor: 0xf3c84b,
      leafColor: 0x5aa75d,
      hpColor: 0xf3c84b
    },
    peashotter: {
      shadowWidth: 54,
      shadowHeight: 14,
      shadowOffsetY: 18,
      bodyWidth: 36,
      bodyHeight: 28,
      bodyOffsetX: -8,
      bodyOffsetY: 10,
      barrelWidth: 34,
      barrelHeight: 18,
      barrelOffsetX: -6,
      barrelOffsetY: -15,
      muzzleRadius: 7,
      muzzleOffsetX: 26,
      muzzleOffsetY: -6,
      hpBarWidth: 58,
      hpBarOffsetY: -34,
      bodyColor: 0x4fae68,
      barrelColor: 0x57c7d8,
      hpColor: 0x8de36c
    },
    barkwall: {
      shadowWidth: 58,
      shadowHeight: 14,
      shadowOffsetY: 18,
      bodyWidth: 56,
      bodyHeight: 50,
      hpBarWidth: 62,
      hpBarOffsetY: -34,
      bodyColor: 0x8f6a3b,
      grooveColor: 0x5c3a22,
      hpColor: 0xd7a96b
    }
  },
  enemies: {
    shambler: {
      width: 34,
      height: 38,
      shadowExtraWidth: 18,
      shadowHeight: 14,
      shadowOffsetY: 19,
      eyeOffsetX: 7,
      eyeOffsetY: -7,
      eyeRadius: 3,
      hpBarWidthExtra: 6,
      color: 0x8fb05d
    },
    runner: {
      width: 30,
      height: 38,
      shadowExtraWidth: 18,
      shadowHeight: 14,
      shadowOffsetY: 19,
      eyeOffsetX: 7,
      eyeOffsetY: -7,
      eyeRadius: 3,
      hpBarWidthExtra: 6,
      color: 0xd96f4d
    },
    brute: {
      width: 42,
      height: 48,
      shadowExtraWidth: 18,
      shadowHeight: 14,
      shadowOffsetY: 19,
      eyeOffsetX: 7,
      eyeOffsetY: -7,
      eyeRadius: 3,
      hpBarWidthExtra: 6,
      color: 0x7b6a84
    }
  },
  boss: {
    width: 124,
    height: 92,
    cornerRadius: 8,
    headWidth: 92,
    headHeight: 34,
    headOffsetY: -68,
    headCornerRadius: 7,
    eyeOffsetX: 24,
    eyeOffsetY: -50,
    eyeRadius: 6,
    shadowWidth: 156,
    shadowHeight: 24,
    shadowOffsetY: 48,
    hpBarWidth: 148,
    hpBarOffsetY: -88,
    interruptBarWidth: 116,
    interruptBarOffsetY: -78,
    phase1Color: 0x7a5363,
    phase2Color: 0xb94f45,
    headColor: 0x49364a,
    eyeColor: 0xf4d2a6
  },
  projectiles: {
    hero_bullet: {
      radius: 4,
      color: 0xfff1a6,
      outlineRadiusExtra: 2
    },
    pea_projectile: {
      radius: 6,
      color: 0x8de36c,
      outlineRadiusExtra: 2
    }
  },
  map: {
    worldBackground: 0x192820,
    laneEvenColor: 0x284432,
    laneOddColor: 0x22382c,
    laneCornerRadius: 4,
    laneInsetX: 10,
    laneInsetY: 4,
    cellInsetX: 8,
    cellInsetY: 9,
    cellCornerRadius: 5,
    cellFillColor: 0x2f513a,
    cellFillAlpha: 0.34,
    cellOutlineColor: 0x87b875,
    cellOutlineAlpha: 0.46,
    baseFillColor: 0x366354,
    baseOutlineColor: 0xe8dfbd,
    spawnFillColor: 0x643b52
  },
  ui: {
    iconSize: 24,
    labelOffsetY: 25,
    textBackground: "#101513"
  },
  fx: {
    hitSparkRadius: 10,
    muzzleFlashRadius: 8,
    bossWeakPointRadius: 13,
    bossWeakPointOutlineRadius: 19,
    slowOutlineExtraWidth: 12,
    slowOutlineExtraHeight: 10
  },
  hpBar: {
    height: 6,
    backgroundColor: 0x101513,
    outlineColor: 0xf7f2df
  }
} as const;
