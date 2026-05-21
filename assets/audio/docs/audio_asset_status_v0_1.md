# V0.1 Audio Asset Status

Phase 12 uses Web Audio API synthesized placeholders only. No external audio files are downloaded, bundled, or referenced at runtime.

| Audio ID | Category | Priority | Status | Source | License | Attribution Required | Raw Path | Processed Path | Notes |
|---|---|---|---|---|---|---|---|---|---|
| weapon.pistolShot | weapon | P0 | integrated | self_synthesized | Project-authored Web Audio synthesis | no | - | - | Short square-wave pistol placeholder with random variants. |
| weapon.dryFire | weapon | P0 | integrated | self_synthesized | Project-authored Web Audio synthesis | no | - | - | Short low dry-click placeholder. |
| weapon.reload | weapon | P0 | integrated | self_synthesized | Project-authored Web Audio synthesis | no | - | - | Sawtooth reload placeholder. |
| plant.place | plant | P0 | integrated | self_synthesized | Project-authored Web Audio synthesis | no | - | - | Soft placement placeholder. |
| plant.shoot | plant | P0 | integrated | self_synthesized | Project-authored Web Audio synthesis | no | - | - | Peashotter projectile placeholder; server emits `plant.shoot`. |
| sun.gain | economy | P0 | integrated | self_synthesized | Project-authored Web Audio synthesis | no | - | - | Bright economy pickup placeholder. |
| enemy.hit | enemy | P0 | integrated | self_synthesized | Project-authored Web Audio synthesis | no | - | - | Organic hit placeholder with random variants and 40 ms throttle. |
| enemy.death | enemy | P0 | integrated | self_synthesized | Project-authored Web Audio synthesis | no | - | - | Enemy defeat placeholder. |
| base.damaged | base | P0 | integrated | self_synthesized | Project-authored Web Audio synthesis | no | - | - | Low warning impact placeholder with 300 ms throttle. |
| wave.start | wave | P0 | integrated | self_synthesized | Project-authored Web Audio synthesis | no | - | - | Wave start UI stinger placeholder. |
| boss.spawn | boss | P0 | integrated | self_synthesized | Project-authored Web Audio synthesis | no | - | - | Low boss arrival placeholder. |
| boss.chargeWarning | boss | P0 | integrated | self_synthesized | Project-authored Web Audio synthesis | no | - | - | High warning placeholder mapped from `boss.chargeStarted`. |
| boss.interrupted | boss | P0 | integrated | self_synthesized | Project-authored Web Audio synthesis | no | - | - | Boss interrupt success placeholder. |
| match.victory | match | P0 | integrated | self_synthesized | Project-authored Web Audio synthesis | no | - | - | Result stinger placeholder. |
| match.defeat | match | P0 | integrated | self_synthesized | Project-authored Web Audio synthesis | no | - | - | Result stinger placeholder. |
| ui.error | ui | P0 | integrated | self_synthesized | Project-authored Web Audio synthesis | no | - | - | Rejected action and room error placeholder. |
| ui.click | ui | P0 | integrated | self_synthesized | Project-authored Web Audio synthesis | no | - | - | Button click placeholder. |

## Replacement Policy

Real audio assets can replace these placeholders only after each file has:

- a source page URL,
- author name,
- explicit license,
- commercial-use confirmation,
- attribution requirements recorded,
- raw and processed local paths documented.
