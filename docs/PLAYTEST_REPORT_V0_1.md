# Playtest Report V0.1

Date: 2026-05-21

Scope: Phase 14 end-to-end local playtest, blocker fixing, and first balance pass.

## Environment

- Server: `http://127.0.0.1:3001`
- Client: `http://127.0.0.1:5173`
- Test method: two local Socket.IO clients using normal create, join, ready, plant, shoot, reload, buy ammo, and evolve actions.
- Authority check: no client-side hit, damage, boss interrupt, or result commands were used in the full-loop playtest.

## Balance Changes Applied

| Area | Before | After | Reason |
|---|---:|---:|---|
| Sunbloom repeat production | 8s | 30s | Original economy produced runaway sun and removed ammo/plant tradeoffs. |
| Boss HP | 2200 | 6000 | Original boss died in 13.4s before charge mechanics mattered. |
| Boss phase 2 threshold | 1100 | 3000 | Keep phase 2 at 50% HP after HP tuning. |
| First phase 2 charge | 6s | 2s | Ensure charge warning appears before optimized DPS ends the fight. |

## Runs

### Baseline Before Tuning

- Result: VICTORY
- Clear time: 357.9s
- Boss duration: 13.4s
- Base HP remaining: 10
- Total sun earned/spent: 5800 / 3600
- Plants placed: 19
- Ammo purchases: 34
- Boss charge attempts/interrupts: 0 / 0
- Finding: complete loop worked, but economy and boss pressure were not valid.

### Final Tuned Run

- Result: VICTORY
- Clear time: 469.8s
- Wave durations: W1 41.6s, W2 45.7s, W3 67.7s, W4 69.3s, W5 90.9s
- Boss fight duration: 106.9s
- Total sun earned/spent: 2100 / 2200
- Plants placed: 19
- Ammo purchases: 6
- Player deaths: 0
- Enemy kills: 68
- Boss damage total: 6000
- Boss charge attempts: 3
- Boss charge interrupts: 0
- Boss charge failures: 3
- Base HP remaining: 1
- Final wave: 5

## Findings

- P0 blockers: none found in the final run. The match progressed from room creation through waves 1-5, evolution, Boss Prep, Boss Active, and VICTORY.
- P1 balance issue: automated players did not interrupt any of 3 boss charges. The charge warning and failed-charge consequence are visible in server events, but the interrupt success rate still needs a manual playtest pass or input-assist tuning.
- P1 balance issue: total sun and total plants are slightly above the ideal metric band, but base HP 1 and 6 ammo purchases produced a useful near-loss finish.
- P1 validation gap: direct visual browser result-screen smoke was attempted, but the in-app browser CDP connection timed out and then reported no active pane. The authoritative `match.ended` payload was observed.

## Critical Bugs

None observed:

- No server crash.
- No stuck wave state.
- No missing `match.ended`.
- No client-authored damage or victory path used in the full-loop playtest.

## Recommendation

Proceed to Phase 15, with a note to manually confirm the result screen visually and to revisit boss interrupt readability/control if playtesters also fail all charge interrupts.
