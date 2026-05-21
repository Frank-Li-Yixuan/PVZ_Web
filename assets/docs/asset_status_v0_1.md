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
- Runtime uses Phaser Graphics fallback for P0 assets when final PNG files are missing.
- Batch A prompts are ready in `assets/art/source_prompts/image_gen_prompts_v0_1.md`.
- No external copyrighted game assets, character names, studio names, logos, or unclear-license files are integrated.
- Gameplay readability remains the approval gate before visual detail.

## P0 Asset Table

| Asset ID | Category | Priority | Status | Source | Path | Notes |
|---|---|---|---|---|---|---|
| hero_ranger_a | Hero | P0 | prompt_ready | image-gen | assets/art/placeholders/heroes/hero_ranger_a_placeholder.png | Cool-accent hero prompt ready; Phaser Graphics fallback integrated. |
| hero_ranger_b | Hero | P0 | prompt_ready | image-gen | assets/art/placeholders/heroes/hero_ranger_b_placeholder.png | Warm-accent hero prompt ready; Phaser Graphics fallback integrated. |
| plant_sunbloom | Plant | P0 | prompt_ready | image-gen | assets/art/placeholders/plants/plant_sunbloom_placeholder.png | Economy plant prompt ready; circular yellow-green fallback integrated. |
| plant_peashotter | Plant | P0 | prompt_ready | image-gen | assets/art/placeholders/plants/plant_peashotter_placeholder.png | Shooter plant prompt ready; green and teal launcher fallback integrated. |
| plant_barkwall | Plant | P0 | prompt_ready | image-gen | assets/art/placeholders/plants/plant_barkwall_placeholder.png | Defensive plant prompt ready; broad brown blocker fallback integrated. |
| enemy_shambler | Enemy | P0 | prompt_ready | image-gen | assets/art/placeholders/enemies/enemy_shambler_placeholder.png | Standard enemy prompt ready; medium green fallback integrated. |
| enemy_runner | Enemy | P0 | prompt_ready | image-gen | assets/art/placeholders/enemies/enemy_runner_placeholder.png | Fast enemy prompt ready; slim orange-red fallback integrated. |
| enemy_brute | Enemy | P0 | prompt_ready | image-gen | assets/art/placeholders/enemies/enemy_brute_placeholder.png | Heavy enemy prompt ready; large muted armored fallback integrated. |
| boss_ironmaw | Boss | P0 | prompt_ready | image-gen | assets/art/placeholders/boss/boss_ironmaw_placeholder.png | Boss prompt ready; large phase-aware fallback and weak point marker integrated. |
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

Batch A was not generated in this pass. The image prompts are prompt_ready, while all P0 gameplay objects have visible Phaser Graphics placeholders or tracked UI/FX placeholder slots.
