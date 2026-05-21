# V0.1 Art Asset Status

## Status Values

Tracked values for V0.1 assets:

```text
missing
placeholder
prompt_ready
generated
integrated
approved
rejected
```

## Pipeline Notes

- Phase 13 adds centralized asset registry metadata in `client/src/assets/artAssetRegistry.ts`.
- Phase 13 adds centralized gameplay render dimensions and fallback colors in `client/src/assets/renderScaleV01.ts`.
- Runtime loads generated PNGs through Phaser when present and uses Phaser Graphics fallback when final PNG files are missing.
- Batch A prompts are ready in `assets/art/source_prompts/image_gen_prompts_v0_1.md`.
- Phase 13A generated Batch A PNGs with image-gen, removed chroma-key backgrounds locally, and integrated usable outputs.
- No external copyrighted game assets, character names, studio names, logos, or unclear-license files are integrated.
- Gameplay readability remains the approval gate before visual detail.

## P0 Asset Table

| Asset ID | Category | Priority | Status | Source | Path | Notes |
|---|---|---|---|---|---|---|
| hero_ranger_a | Hero | P0 | integrated | image-gen | assets/art/sprites/heroes/hero_ranger_a_idle.png | Phase 13A generated cool-accent hero; transparent PNG integrated with graphics fallback retained. |
| hero_ranger_b | Hero | P0 | integrated | image-gen | assets/art/sprites/heroes/hero_ranger_b_idle.png | Phase 13A generated warm-accent hero; transparent PNG integrated with graphics fallback retained. |
| plant_sunbloom | Plant | P0 | integrated | image-gen | assets/art/sprites/plants/plant_sunbloom_idle.png | Phase 13A generated economy plant; transparent PNG integrated with graphics fallback retained. |
| plant_peashotter | Plant | P0 | integrated | image-gen | assets/art/sprites/plants/plant_peashotter_idle.png | Phase 13A generated bio-seed launcher plant; transparent PNG integrated with graphics fallback retained. |
| plant_barkwall | Plant | P0 | integrated | image-gen | assets/art/sprites/plants/plant_barkwall_idle.png | Phase 13A generated defensive bark plant; transparent PNG integrated with graphics fallback retained. |
| enemy_shambler | Enemy | P0 | integrated | image-gen | assets/art/sprites/enemies/enemy_shambler_idle.png | Phase 13A generated standard polluted enemy; transparent PNG integrated with graphics fallback retained. |
| enemy_runner | Enemy | P0 | integrated | image-gen | assets/art/sprites/enemies/enemy_runner_idle.png | Phase 13A generated fast polluted enemy; transparent PNG integrated with graphics fallback retained. |
| enemy_brute | Enemy | P0 | integrated | image-gen | assets/art/sprites/enemies/enemy_brute_idle.png | Phase 13A generated heavy armored enemy; transparent PNG integrated with graphics fallback retained. |
| boss_ironmaw | Boss | P0 | integrated | image-gen | assets/art/sprites/boss/boss_ironmaw_phase1.png | Phase 13A generated phase 1 boss; transparent PNG integrated with graphics fallback retained. |
| projectile_hero_bullet | Projectile | P0 | integrated | placeholder | assets/art/placeholders/projectiles/projectile_hero_bullet_placeholder.png | Bright small bullet fallback integrated. |
| projectile_pea | Projectile | P0 | integrated | placeholder | assets/art/placeholders/projectiles/projectile_pea_placeholder.png | Green bio-energy projectile fallback integrated. |
| tile_ground_lane | Map | P0 | integrated | placeholder | assets/art/placeholders/environment/tile_ground_lane_placeholder.png | Lane band fallback integrated through centralized map colors. |
| tile_plant_cell | Map | P0 | integrated | placeholder | assets/art/placeholders/environment/tile_plant_cell_placeholder.png | Plantable-cell fallback integrated through centralized map colors. |
| base_greenhouse_core | Base | P0 | integrated | placeholder | assets/art/placeholders/environment/base_greenhouse_core_placeholder.png | Base fallback integrated and still shows server HP. |
| ui_icon_sun | UI | P0 | placeholder | placeholder | assets/art/placeholders/ui/ui_icon_sun_placeholder.png | Core UI icon slot tracked; DOM HUD remains readable without image file. |
| ui_icon_ammo | UI | P0 | placeholder | placeholder | assets/art/placeholders/ui/ui_icon_ammo_placeholder.png | Core UI icon slot tracked; ammo text HUD remains readable without image file. |
| ui_icon_hp | UI | P0 | placeholder | placeholder | assets/art/placeholders/ui/ui_icon_hp_placeholder.png | Core UI icon slot tracked; HP text HUD remains readable without image file. |
| fx_hit_spark | FX | P0 | placeholder | placeholder | assets/art/placeholders/effects/fx_hit_spark_placeholder.png | Effect slot tracked for later feedback art pass. |
| fx_muzzle_flash | FX | P0 | placeholder | placeholder | assets/art/placeholders/effects/fx_muzzle_flash_placeholder.png | Effect slot tracked for later weapon feedback art pass. |
| fx_boss_weakpoint | FX | P0 | integrated | placeholder | assets/art/placeholders/effects/fx_boss_weakpoint_placeholder.png | Boss weak point marker fallback integrated with the boss renderer. |

## Phase 13 Gate Notes

Batch A is generated and integrated for V0.1 core units. Remaining P0 projectile, map, UI, and FX entries keep placeholder/fallback status unless listed above.
