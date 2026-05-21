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
| hero.rangerA.run | Hero slot 1 | generated | Candidate 4-frame run sheet exists; runtime still uses run bob fallback. |
| hero.rangerA.shoot | Hero slot 1 | fallback_only | Muzzle flash plus recoil transform. |
| hero.rangerB.idle | Hero slot 2 | fallback_only | Idle bob on static hero sprite or Phaser Graphics fallback. |
| hero.rangerB.run | Hero slot 2 | generated | Candidate 4-frame run sheet exists; runtime still uses run bob fallback. |
| hero.rangerB.shoot | Hero slot 2 | fallback_only | Muzzle flash plus recoil transform. |
| plant.sunbloom.idle | Sunbloom | fallback_only | Gentle pulse on static plant sprite. |
| plant.sunbloom.produce | Sunbloom | generated | Candidate 3-frame production sheet exists; runtime still uses sparkle overlay plus pulse. |
| plant.peashotter.idle | Peashotter | fallback_only | Static hold with centralized state mapping. |
| plant.peashotter.shoot | Peashotter | generated | Candidate 3-frame shoot sheet exists; runtime still uses muzzle flash plus squash. |
| plant.barkwall.healthy | Barkwall | fallback_only | Static healthy stance. |
| plant.barkwall.damaged | Barkwall | fallback_only | Damaged pulse based on HP ratio. |
| enemy.shambler.walk | Shambler | generated | Candidate 4-frame walk sheet exists; runtime still uses walk wobble fallback. |
| enemy.runner.walk | Runner | generated | Candidate 4-frame walk sheet exists; runtime still uses fast walk wobble fallback. |
| enemy.brute.walk | Brute | generated | Candidate 4-frame walk sheet exists; runtime still uses heavy walk wobble fallback. |
| boss.ironmaw.idle | Ironmaw | fallback_only | Boss breathing pulse. |
| boss.ironmaw.chargeWindup | Ironmaw | generated | Candidate 4-frame charge windup sheet exists; runtime still uses warning pulse and boss windup transform. |
| fx.muzzleFlash | Combat FX | generated | Candidate 4-frame FX sheet exists; runtime still uses Batch B muzzle flash sprite pop. |
| fx.hitSpark | Combat FX | generated | Candidate 5-frame FX sheet exists; runtime still uses Batch B hit spark sprite pop. |
| fx.sunGain | Economy FX | integrated | Batch B sun gain sprite pop. |
| fx.plantPlace | Planting FX | integrated | Batch B plant place ring sprite pop. |
| fx.enemyDeath | Combat FX | fallback_only | Enlarged hit spark burst until a dedicated death sheet exists. |
| fx.bossWeakpoint | Boss FX | generated | Candidate 4-frame FX sheet exists; runtime still uses Batch B weak point marker pulse. |
| fx.bossChargeWarning | Boss FX | generated | Candidate 4-frame FX sheet exists; runtime still uses Batch B charge warning marker pulse. |
| fx.bossInterrupted | Boss FX | fallback_only | Enlarged hit spark burst plus restrained screen shake. |

## Generated Candidate Sheets

These candidates were prepared from approved V0.1 seed sprites using deterministic sprite-pipeline transforms. They are original-IP derivatives of project-owned/generated assets, not external assets. They are candidate-only and are not loaded by gameplay yet; Phaser tween/fallback animation remains authoritative for Phase 13C.

| File | Frames | Frame Size | Sheet Size | Source Seed | Status | Notes |
|---|---:|---:|---:|---|---|---|
| assets/art/animations/heroes/hero_ranger_a_run_sheet.png | 4 | 128x128 | 512x128 | assets/art/sprites/heroes/hero_ranger_a_idle.png | generated | Horizontal run candidate with bob, lean, and rotation offsets. |
| assets/art/animations/heroes/hero_ranger_b_run_sheet.png | 4 | 128x128 | 512x128 | assets/art/sprites/heroes/hero_ranger_b_idle.png | generated | Horizontal run candidate with matching slot-B silhouette. |
| assets/art/animations/plants/plant_sunbloom_produce_sheet.png | 3 | 128x128 | 384x128 | assets/art/sprites/plants/plant_sunbloom_idle.png | generated | Production pulse with golden glow/ring overlays. |
| assets/art/animations/plants/plant_peashotter_shoot_sheet.png | 3 | 128x128 | 384x128 | assets/art/sprites/plants/plant_peashotter_idle.png | generated | Shoot squash candidate with muzzle-ring emphasis. |
| assets/art/animations/enemies/enemy_shambler_walk_sheet.png | 4 | 128x128 | 512x128 | assets/art/sprites/enemies/enemy_shambler_idle.png | generated | Slow walk wobble candidate. |
| assets/art/animations/enemies/enemy_runner_walk_sheet.png | 4 | 128x128 | 512x128 | assets/art/sprites/enemies/enemy_runner_idle.png | generated | Faster lean/wobble walk candidate. |
| assets/art/animations/enemies/enemy_brute_walk_sheet.png | 4 | 160x160 | 640x160 | assets/art/sprites/enemies/enemy_brute_idle.png | generated | Heavy walk wobble candidate. |
| assets/art/animations/boss/boss_ironmaw_charge_windup_sheet.png | 4 | 512x512 | 2048x512 | assets/art/sprites/boss/boss_ironmaw_phase1.png | generated | Charge windup scale/lean candidate with warning rings. |
| assets/art/animations/fx/fx_muzzle_flash_sheet.png | 4 | 64x64 | 256x64 | assets/art/sprites/effects/fx_muzzle_flash.png | generated | Flash growth/decay candidate. |
| assets/art/animations/fx/fx_hit_spark_sheet.png | 5 | 64x64 | 320x64 | assets/art/sprites/effects/fx_hit_spark.png | generated | Impact burst growth/decay candidate. |
| assets/art/animations/fx/fx_boss_weakpoint_sheet.png | 4 | 96x96 | 384x96 | assets/art/sprites/effects/fx_boss_weakpoint.png | generated | Weak point pulse candidate. |
| assets/art/animations/fx/fx_boss_charge_warning_sheet.png | 4 | 128x64 | 512x64 | assets/art/sprites/effects/fx_boss_charge_warning.png | generated | Charge warning pulse candidate. |

## Integration Notes For animationRegistry.ts

- `AnimationRegistryV01` now records `candidateSheet` metadata for generated sheets: path, frame size, frame count, horizontal layout, source, and `candidate_only` integration status.
- `registerAnimations(scene)` intentionally remains a no-op for these sheets in this pass. Runtime still uses code-driven tweens and existing FX overlays, so missing or rejected candidate sheets cannot break gameplay.
- A later integration pass can preload these PNGs and create Phaser animations using the registry metadata once visual review approves frame readability.

## Phase 14 Notes

The registry is ready for later sprite sheets, but Phase 13C deliberately does not depend on final animation art. Phase 14 can replace fallback_only entries incrementally after playtest confirms readability and balance.
