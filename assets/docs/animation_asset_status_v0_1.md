# Animation Asset Status V0.1

Phase 13C adds a renderer-side animation pipeline for minimum V0.1 readability. No server-authoritative gameplay rules changed. Current delivery uses code-driven tweens and integrated FX sprite overlays so missing final animation sheets do not crash the game.

## Status Values

| Status | Meaning |
|---|---|
| missing | Required animation has no authored asset or fallback yet. |
| fallback_only | Implemented with code-driven tween, tint, scale, pulse, or existing sprite fallback. |
| prompt_ready | Prompt or source direction exists, but no approved animation sheet is integrated. |
| generated | Generated animation source exists but is not yet approved in runtime. |
| integrated | Runtime can display the animation or FX through the centralized registry. |

## P0 Animation Tracking

| Animation ID | Object | Status | Runtime Strategy |
|---|---|---|---|
| hero.rangerA.idle | Hero slot 1 | fallback_only | Idle bob on static hero sprite or Phaser Graphics fallback. |
| hero.rangerA.run | Hero slot 1 | fallback_only | Run bob, slight squash, and rotation while renderer detects movement. |
| hero.rangerA.shoot | Hero slot 1 | fallback_only | Muzzle flash plus recoil transform. |
| hero.rangerB.idle | Hero slot 2 | fallback_only | Idle bob on static hero sprite or Phaser Graphics fallback. |
| hero.rangerB.run | Hero slot 2 | fallback_only | Run bob, slight squash, and rotation while renderer detects movement. |
| hero.rangerB.shoot | Hero slot 2 | fallback_only | Muzzle flash plus recoil transform. |
| plant.sunbloom.idle | Sunbloom | fallback_only | Gentle pulse on static plant sprite. |
| plant.sunbloom.produce | Sunbloom | fallback_only | Sun sparkle overlay plus production pulse. |
| plant.peashotter.idle | Peashotter | fallback_only | Static hold with centralized state mapping. |
| plant.peashotter.shoot | Peashotter | fallback_only | Muzzle flash plus squash transform. |
| plant.barkwall.healthy | Barkwall | fallback_only | Static healthy stance. |
| plant.barkwall.damaged | Barkwall | fallback_only | Damaged pulse based on HP ratio. |
| enemy.shambler.walk | Shambler | fallback_only | Walk wobble on static enemy sprite or fallback body. |
| enemy.runner.walk | Runner | fallback_only | Faster walk wobble on static enemy sprite or fallback body. |
| enemy.brute.walk | Brute | fallback_only | Heavier walk wobble on static enemy sprite or fallback body. |
| boss.ironmaw.idle | Ironmaw | fallback_only | Boss breathing pulse. |
| boss.ironmaw.chargeWindup | Ironmaw | fallback_only | Charge warning pulse and boss windup transform. |
| fx.muzzleFlash | Combat FX | integrated | Batch B muzzle flash sprite pop. |
| fx.hitSpark | Combat FX | integrated | Batch B hit spark sprite pop. |
| fx.sunGain | Economy FX | integrated | Batch B sun gain sprite pop. |
| fx.plantPlace | Planting FX | integrated | Batch B plant place ring sprite pop. |
| fx.enemyDeath | Combat FX | fallback_only | Enlarged hit spark burst until a dedicated death sheet exists. |
| fx.bossWeakpoint | Boss FX | integrated | Batch B weak point marker pulse. |
| fx.bossChargeWarning | Boss FX | integrated | Batch B charge warning marker pulse. |
| fx.bossInterrupted | Boss FX | fallback_only | Enlarged hit spark burst plus restrained screen shake. |

## Phase 14 Notes

The registry is ready for later sprite sheets, but Phase 13C deliberately does not depend on final animation art. Phase 14 can replace fallback_only entries incrementally after playtest confirms readability and balance.
