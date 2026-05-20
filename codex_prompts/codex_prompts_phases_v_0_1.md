# CODEX_PROMPTS_PHASES_V0_1.md

# 双人合作枪械英雄塔防 V0.1 Codex 分阶段 Prompt 包

## 0. 文档目的

本文档是给 Codex 直接使用的分阶段 Prompt 包。

它不是普通设计文档，而是**可复制执行的任务指令集合**。

使用方式：

1. 先把本文档保存到项目：`codex_prompts/CODEX_PROMPTS_PHASES_V0_1.md`
2. 每次只复制一个 Prompt 给 Codex。
3. 不要一次性把所有 Phase 都让 Codex 执行。
4. 每个 Phase 完成后，先审查 Gate Report，再进入下一 Phase。
5. 如果某阶段失败，不要跳阶段，先让 Codex 修复当前阶段。

---

## 1. Prompt 使用总规则

### 1.1 每次只执行一个 Phase

禁止一次性输入：

```text
帮我从 Phase 0 一直做到 Phase 15
```

正确方式：

```text
执行 Phase 0。完成后给 Gate Report。
```

### 1.2 每次必须要求 Codex 先读文档

每个 Prompt 都会列出必须读取的文档。

Codex 必须在开始实现前简要说明：

- 读了哪些文档；
- 本阶段受哪些规则约束；
- 本阶段不做什么。

### 1.3 每次必须生成 Gate Report

每个 Phase 完成后必须输出：

```md
# Phase X Gate Report

## Scope Completed
-

## Validation Commands
-

## Runtime Verification
-

## Files Changed
-

## Known Issues
-

## Risk Level
Low / Medium / High

## Can Proceed to Next Phase?
Yes / No

## Next Phase Recommendation
-
```

没有 Gate Report，不能进入下一阶段。

---

## 2. Prompt 00：全局总控 Prompt

> 每次新开 Codex 会话或 Codex 上下文压缩后，先喂这个。

```md
You are the lead implementation agent for this project.

Project:
A V0.1 web-based 2-player cooperative 2.5D plant-defense + gun-hero tower defense game.

Core gameplay:
Two players join the same online room, share sunlight as a team resource, plant defensive units on a 5-lane grid, control gun heroes with limited ammo, buy ammo using shared sunlight, evolve heroes mid-run, survive 5 waves, and defeat a two-phase boss.

Primary goal:
Build a playable V0.1 vertical slice, not a full commercial game.

Mandatory design docs:
- docs/GAME_DESIGN_V0_1.md
- docs/RULES_CORE_LOOP.md
- docs/COMBAT_NUMBERS_V0_1.md
- docs/NETWORK_SYNC_SPEC.md
- docs/ART_DIRECTION_V0_1.md
- docs/AUDIO_PIPELINE_V0_1.md
- docs/CODEX_IMPLEMENTATION_PLAN.md

Hard constraints:
1. Use server-authoritative multiplayer.
2. The client only sends player intent.
3. The server decides sunlight, planting, hit detection, enemy death, boss interrupt, evolution, victory, and defeat.
4. Keep V0.1 scope strict.
5. Do not add accounts, matchmaking, shop, skins, extra weapons, extra maps, extra bosses, or out-of-run progression unless explicitly requested.
6. All gameplay numbers must be data-driven through shared config.
7. Art must be original or placeholder. Do not copy existing IP.
8. Audio must be placeholder, self-synthesized, CC0, or explicitly licensed. Never use unclear-license audio.
9. Do not block gameplay implementation on missing final art or audio.
10. Every task must end with validation results and a Gate Report.

Technology preference:
- Client: Phaser 3 + TypeScript + Vite
- Server: Node.js + TypeScript + Socket.IO
- Shared: TypeScript shared types/config
- Test: Vitest

Required response format for every task:

## 1. Scope Summary
- This task will implement:
- This task will NOT implement:

## 2. Relevant Design Constraints
- Documents read:
- Key constraints:

## 3. Implementation Plan
1.
2.
3.

## 4. Files to Create / Modify
-

## 5. Validation Plan
Commands:
-

Runtime checks:
-

## 6. Completion Report
Completed:
-

Validation result:
-

Known issues:
-

Next recommended task:
-

## 7. Phase Gate Report
- Scope Completed:
- Validation Commands:
- Runtime Verification:
- Files Changed:
- Known Issues:
- Risk Level:
- Can Proceed to Next Phase?
- Next Phase Recommendation:

If the implementation becomes too large, stop at the smallest stable milestone and report exactly what remains.
```

---

## 3. Prompt 00A：项目现状快速检查 Prompt

> 每次你不确定 Codex 当前代码库状态时，用这个。

```md
Task: Repository status and consistency check.

Read the existing repository structure and the V0.1 docs:
- docs/GAME_DESIGN_V0_1.md
- docs/RULES_CORE_LOOP.md
- docs/COMBAT_NUMBERS_V0_1.md
- docs/NETWORK_SYNC_SPEC.md
- docs/ART_DIRECTION_V0_1.md
- docs/AUDIO_PIPELINE_V0_1.md
- docs/CODEX_IMPLEMENTATION_PLAN.md

Goal:
Determine the current implementation phase, detect missing or inconsistent files, and recommend the next safe task.

Do not make code changes unless a tiny documentation/status fix is necessary and clearly reported.

Check:
1. Project structure.
2. Client build status.
3. Server build status.
4. Shared types/config status.
5. Current implemented gameplay systems.
6. Current networking state.
7. Asset/audio pipeline status.
8. Existing tests.
9. Any broken scripts.
10. Which phase from CODEX_IMPLEMENTATION_PLAN.md is currently complete.

Output:
- Current phase estimate.
- Completed systems.
- Missing systems.
- Broken or risky areas.
- Recommended next phase.
- Exact commands to validate.
```

---

## 4. Prompt 00B：失败修复 Prompt

> 如果 Codex 某阶段跑崩、typecheck 失败、server 启动失败，用这个。

```md
Task: Stabilize the current phase before moving forward.

The previous task produced errors or incomplete validation. Do not add new features. Your only goal is to make the current phase stable.

Read:
- docs/CODEX_IMPLEMENTATION_PLAN.md
- The relevant phase docs for the current feature
- The latest error output / failing validation logs

Rules:
1. Do not expand scope.
2. Do not rewrite unrelated systems.
3. Fix the smallest set of files needed.
4. Preserve server-authoritative boundaries.
5. After each fix, run typecheck/tests/build as applicable.
6. Provide a root-cause explanation.
7. Provide a Gate Report.

Output:
- Root cause.
- Files changed.
- Fix explanation.
- Validation commands and results.
- Whether the current phase can now proceed.
```

---

# Phase 0 Prompt：项目脚手架与文档落地

```md
Task: Phase 0 - Project bootstrap and documentation grounding.

Read first:
- docs/GAME_DESIGN_V0_1.md
- docs/RULES_CORE_LOOP.md
- docs/COMBAT_NUMBERS_V0_1.md
- docs/NETWORK_SYNC_SPEC.md
- docs/ART_DIRECTION_V0_1.md
- docs/AUDIO_PIPELINE_V0_1.md
- docs/CODEX_IMPLEMENTATION_PLAN.md

Goal:
Create a clean, runnable monorepo foundation for the V0.1 web multiplayer game.

Implement:
1. Project root package setup.
2. `client/` using Phaser 3 + TypeScript + Vite.
3. `server/` using Node.js + TypeScript + Socket.IO.
4. `shared/` package for common types/config.
5. `docs/` folder containing or preserving all V0.1 documents.
6. `assets/` folder for art/audio pipeline.
7. Baseline scripts:
   - dev:client
   - dev:server
   - build
   - typecheck
   - test
8. Basic client scene that displays a placeholder title screen.
9. Basic server that starts and logs readiness.
10. README with install/run instructions.

Do NOT implement yet:
- Multiplayer room logic.
- GameLoop.
- Player movement.
- Plants.
- Enemies.
- Gunplay.
- Boss.
- Final art/audio downloads.

Validation:
Run or document:
- npm install
- npm run dev:client
- npm run dev:server
- npm run typecheck
- npm run test

Completion requirement:
End with Phase 0 Gate Report.
```

---

# Phase 1 Prompt：Shared 类型与配置

```md
Task: Phase 1 - Implement shared V0.1 types and config contracts.

Read first:
- docs/RULES_CORE_LOOP.md
- docs/COMBAT_NUMBERS_V0_1.md
- docs/NETWORK_SYNC_SPEC.md
- docs/CODEX_IMPLEMENTATION_PLAN.md

Goal:
Create the shared TypeScript contract used by both client and server.

Implement files under `shared/`:
1. `shared/types/enums.ts`
2. `shared/types/entities.ts`
3. `shared/types/state.ts`
4. `shared/types/messages.ts`
5. `shared/types/network.ts`
6. `shared/types/events.ts`
7. `shared/config/combatNumbers.ts`
8. `shared/config/wavesV01.ts`
9. `shared/config/networkTiming.ts`
10. `shared/config/mapConfig.ts`
11. `shared/utils/math.ts`
12. `shared/utils/id.ts`

Must include:
- MatchState.
- RoomState.
- PlayerSlot.
- PlantType.
- EnemyType.
- EvolutionPath.
- BossState.
- GameStateSnapshot.
- C2S / S2C event constants.
- ActionAcceptedPayload.
- ActionRejectedPayload.
- ActionRejectReason.
- FeedbackEvent.
- CombatNumbersV01 from COMBAT_NUMBERS_V0_1.md.
- WavesV01 from COMBAT_NUMBERS_V0_1.md.
- NetworkTimingV01 from NETWORK_SYNC_SPEC.md.

Do NOT implement yet:
- Server GameLoop.
- Room manager.
- Client rendering.
- Gameplay logic.

Validation:
- shared package compiles.
- client/server can import shared types.
- npm run typecheck passes.
- no duplicate schema definitions in client/server.

Completion requirement:
End with Phase 1 Gate Report.
```

---

# Phase 2 Prompt：房间与双人 Ready

```md
Task: Phase 2 - Implement 2-player room creation, joining, and ready flow.

Read first:
- docs/NETWORK_SYNC_SPEC.md
- docs/RULES_CORE_LOOP.md
- docs/CODEX_IMPLEMENTATION_PLAN.md
- shared/types/network.ts
- shared/types/messages.ts

Goal:
Implement the minimum multiplayer room flow before gameplay begins.

Server requirements:
1. Create `RoomManager`.
2. Create basic `GameRoom` class.
3. Implement Socket.IO handlers:
   - room.create
   - room.join
   - room.leave
   - player.ready
4. Assign fixed slots: 0 and 1.
5. Reject third player with ROOM_FULL.
6. Reject join to missing room with ROOM_NOT_FOUND.
7. Return reconnectToken on create/join.
8. Broadcast room.state to all players in the room.
9. When both players are ready, transition room toward countdown-ready state.

Client requirements:
1. Create minimal lobby UI.
2. Allow create room.
3. Allow join room by matchId.
4. Show current matchId.
5. Show player list, slots, connected status, ready status.
6. Add ready button.
7. Show connection errors.

Do NOT implement yet:
- Match GameLoop.
- Battle scene.
- Movement.
- Combat.
- Plants/enemies.

Validation:
1. Open two browser clients.
2. Client A creates room.
3. Client B joins room.
4. Both see each other.
5. Third client is rejected.
6. Ready states sync.
7. Server logs room lifecycle.
8. npm run typecheck passes.

Completion requirement:
End with Phase 2 Gate Report.
```

---

# Phase 3 Prompt：MatchStateMachine 与 GameLoop

```md
Task: Phase 3 - Implement authoritative MatchStateMachine and server GameLoop.

Read first:
- docs/RULES_CORE_LOOP.md
- docs/NETWORK_SYNC_SPEC.md
- docs/COMBAT_NUMBERS_V0_1.md
- docs/CODEX_IMPLEMENTATION_PLAN.md
- shared/config/networkTiming.ts
- shared/config/combatNumbers.ts

Goal:
After both players ready, run the authoritative match state machine and broadcast snapshots.

Server requirements:
1. Implement `MatchStateMachine`.
2. Implement `GameLoop` at 20Hz.
3. Implement snapshot broadcast at 10Hz.
4. Initialize basic GameState:
   - matchId
   - matchState
   - roomState
   - time
   - economy placeholder
   - base placeholder
   - players
   - empty plants/enemies/bullets
   - wave placeholder
5. Implement transitions:
   - LOBBY
   - COUNTDOWN
   - WAVE_PREP
6. Broadcast `match.phaseChanged` on state changes.
7. Stop combat mutation after VICTORY/DEFEAT, even if those states are not reachable yet.

Client requirements:
1. Receive `state.snapshot`.
2. Display matchState.
3. Display countdown/prep timer.
4. Add basic debug overlay:
   - matchId
   - playerId
   - slot
   - matchState
   - serverSeq
   - snapshot rate

Do NOT implement yet:
- Movement.
- Map rendering beyond basic placeholder.
- Plants.
- Enemies.
- Weapons.
- Boss.

Validation:
1. Two players ready.
2. Server emits countdown.
3. Match transitions to WAVE_PREP.
4. Snapshots continue broadcasting.
5. Client displays state/timer.
6. No runaway intervals when room closes.
7. npm run typecheck passes.

Completion requirement:
End with Phase 3 Gate Report.
```

---

# Phase 4 Prompt：地图、网格与玩家移动

```md
Task: Phase 4 - Implement battle map, 5-lane grid, and server-authoritative player movement.

Read first:
- docs/GAME_DESIGN_V0_1.md
- docs/RULES_CORE_LOOP.md
- docs/NETWORK_SYNC_SPEC.md
- docs/COMBAT_NUMBERS_V0_1.md
- docs/ART_DIRECTION_V0_1.md
- shared/config/mapConfig.ts
- shared/config/combatNumbers.ts

Goal:
Create the playable battlefield and synchronized player movement.

Server requirements:
1. Define map bounds.
2. Define lane and plant cell coordinate helpers.
3. Initialize two player spawn positions.
4. Implement `input.move`.
5. Implement `input.aim`.
6. Server updates player position in GameLoop.
7. Normalize movement direction.
8. Clamp players inside map bounds.
9. Include player position and aim in GameStateSnapshot.

Client requirements:
1. Create `BattleScene`.
2. Render 5 lanes.
3. Render 7 plantable columns per lane.
4. Render base placeholder on the left.
5. Render enemy spawn side marker on the right.
6. Render both players with placeholders.
7. Capture WASD movement.
8. Capture mouse aim world position.
9. Use snapshot interpolation for remote player.
10. Use light local prediction for local player if simple.
11. Extend debug overlay with position and entity counts.

Do NOT implement yet:
- Planting.
- Shooting.
- Enemies.
- Combat.

Validation:
1. Two clients can move independently.
2. Both clients see both players.
3. Players cannot leave map bounds.
4. Aim direction updates.
5. Snapshot corrections do not cause severe jitter.
6. npm run typecheck passes.

Completion requirement:
End with Phase 4 Gate Report.
```

---

# Phase 5 Prompt：共享阳光与种植

```md
Task: Phase 5 - Implement shared sunlight economy and plant placement.

Read first:
- docs/RULES_CORE_LOOP.md
- docs/COMBAT_NUMBERS_V0_1.md
- docs/NETWORK_SYNC_SPEC.md
- docs/ART_DIRECTION_V0_1.md
- shared/config/combatNumbers.ts
- shared/config/mapConfig.ts

Goal:
Implement server-authoritative shared sunlight and planting for three plant types.

Server requirements:
1. Create `EconomySystem`.
2. Create `PlantSystem`.
3. Initialize sharedSun using CombatNumbersV01.
4. Implement `action.plant`.
5. Validate:
   - match state allows planting
   - player alive
   - valid plant type
   - valid lane/column
   - cell plantable
   - cell empty
   - no enemy blocking cell
   - player within interact range
   - enough sharedSun
6. On success:
   - deduct sharedSun
   - create PlantState
   - mark cell occupied
   - record stats
   - emit action.accepted and feedback event
7. On failure:
   - emit action.rejected with exact reason
8. Implement `sunbloom` production:
   - first delay
   - periodic production
   - blocked by sun suppression later, but can be false for now
9. Include plants and economy in snapshots.

Client requirements:
1. Plant selection with keys 1/2/3.
2. E key sends plant request for selected/hovered cell.
3. Display selected plant.
4. Display sharedSun.
5. Render plant placeholders.
6. Show rejected action toast.
7. Show plant placement hover/highlight.

Do NOT implement yet:
- Peashotter attacks.
- Enemies.
- Plant damage/death.
- Audio final assets.

Validation:
1. Both players see same sharedSun.
2. Player A planting reduces Player B's displayed sharedSun.
3. Same-cell double plant: one success, one CELL_OCCUPIED.
4. Not enough sun returns NOT_ENOUGH_SUN.
5. Too far returns OUT_OF_RANGE.
6. Sunbloom produces sun over time.
7. sharedSun never goes negative.
8. npm run typecheck passes.

Completion requirement:
End with Phase 5 Gate Report.
```

---

# Phase 6 Prompt：敌人与植物防线循环

```md
Task: Phase 6 - Implement enemies, plant combat, base damage, and the basic defense loop.

Read first:
- docs/RULES_CORE_LOOP.md
- docs/COMBAT_NUMBERS_V0_1.md
- docs/NETWORK_SYNC_SPEC.md
- shared/config/combatNumbers.ts
- shared/config/mapConfig.ts

Goal:
Make the tower-defense loop functional before formal waves.

Server requirements:
1. Create `EnemySystem`.
2. Create `PlantCombatSystem`.
3. Create `ProjectileSystem` if needed for pea projectiles.
4. Implement enemy types:
   - shambler
   - runner
   - brute
5. Add dev-only debug command to spawn enemy by lane/type.
6. Enemies move from right to left along lane.
7. Enemies detect blocking plants.
8. Enemies stop and attack plants.
9. Plants lose HP.
10. Plants die and release cells.
11. Peashotter attacks same-lane enemies.
12. Pea projectile hits enemies server-side.
13. Enemies die and may drop sunlight.
14. Enemies reaching base reduce baseHp.
15. baseHp <= 0 enters DEFEAT.
16. Include enemies, bullets, base, plants in snapshots.

Client requirements:
1. Render enemies with placeholders.
2. Render pea projectiles.
3. Render base HP.
4. Optionally render HP bars/debug HP.
5. Render hit/death placeholder feedback.

Do NOT implement yet:
- Formal WavesV01.
- Hero gunplay.
- Evolution.
- Boss.

Validation:
1. Spawn each enemy type with debug command.
2. Enemy moves along lane.
3. Enemy stops at plant.
4. Enemy damages plant.
5. Plant death releases cell.
6. Peashotter shoots enemies.
7. Enemy death can generate sunlight.
8. Enemy reaching base damages base.
9. baseHp <= 0 triggers DEFEAT.
10. npm run typecheck passes.

Completion requirement:
End with Phase 6 Gate Report.
```

---

# Phase 7 Prompt：英雄枪械系统

```md
Task: Phase 7 - Implement hero pistol gunplay, ammo, reload, ammo purchase, and server-side bullet hits.

Read first:
- docs/RULES_CORE_LOOP.md
- docs/COMBAT_NUMBERS_V0_1.md
- docs/NETWORK_SYNC_SPEC.md
- shared/config/combatNumbers.ts

Goal:
Make gun heroes useful but limited by ammo and shared sunlight.

Server requirements:
1. Create `WeaponSystem`.
2. Implement `action.shoot`.
3. Implement `action.reload`.
4. Implement `action.buyAmmo`.
5. Track:
   - ammoInMagazine
   - magazineSize
   - reserveAmmo
   - maxReserveAmmo
   - reloading
   - reloadRemainingSeconds
   - nextAllowedShotTime
   - ammoPurchaseCooldown
6. Validate shoot:
   - player alive
   - state allows shooting
   - not reloading
   - fire rate ready
   - ammoInMagazine > 0
7. On shoot success:
   - ammoInMagazine -= 1
   - create hero bullet
   - stats.shotsFired += 1
8. On empty shoot:
   - reject AMMO_EMPTY or emit dryFire feedback
9. Validate reload:
   - not already reloading
   - magazine not full
   - reserveAmmo > 0
10. Complete reload after reload timer.
11. Validate buyAmmo:
   - enough sharedSun
   - cooldown ready
   - reserve not full
12. Hero bullets hit enemies server-side.
13. Damage, death, stats update server-side.

Client requirements:
1. Mouse left click sends shoot request.
2. R sends reload request.
3. Q sends buyAmmo request.
4. UI shows magazine/reserve.
5. UI shows reload state.
6. UI shows ammo purchase cooldown.
7. Render hero bullet placeholders.
8. Render muzzle flash placeholder or event.
9. Show rejected action reasons.

Do NOT implement yet:
- Boss weak point hit.
- Evolution modifiers.
- Advanced weapons.

Validation:
1. Shooting consumes ammo.
2. Empty magazine cannot shoot.
3. Reload transfers reserve ammo correctly.
4. Reload cannot happen if reserve empty.
5. Cannot shoot during reload.
6. Buy ammo consumes sharedSun.
7. Buy ammo cooldown works.
8. Reserve ammo cap enforced.
9. Hero bullets hit enemies server-side.
10. Client cannot report hits.
11. npm run typecheck passes.

Completion requirement:
End with Phase 7 Gate Report.
```

---

# Phase 8 Prompt：正式波次系统

```md
Task: Phase 8 - Implement formal WaveSystem using WavesV01.

Read first:
- docs/RULES_CORE_LOOP.md
- docs/COMBAT_NUMBERS_V0_1.md
- docs/NETWORK_SYNC_SPEC.md
- shared/config/wavesV01.ts
- shared/config/combatNumbers.ts

Goal:
Replace debug spawning with the V0.1 five-wave progression.

Server requirements:
1. Create `WaveSystem`.
2. Use WavesV01 from shared config.
3. Implement:
   - WAVE_PREP
   - WAVE_ACTIVE
   - WAVE_CLEAR
4. Spawn enemies according to per-wave event times.
5. Track waveSpawnComplete.
6. Track enemiesRemainingInWave.
7. Detect wave clear only when:
   - all spawn events executed
   - all wave enemies resolved
   - baseHp > 0
8. After Wave 3 clear, set evolutionUnlocked = true.
9. After Wave 5 clear, enter BOSS_PREP.
10. Broadcast phase changes and wave state.

Client requirements:
1. Display current wave.
2. Display prep timer.
3. Display wave transition banner.
4. Display evolution unlocked indicator after Wave 3.
5. Keep debug overlay updated.

Do NOT implement yet:
- Evolution action effects.
- Boss entity.
- Boss fight.

Validation:
1. Wave 1 starts after prep.
2. Wave 1 spawns exactly as config.
3. Wave 1 clears and transitions.
4. Wave 1–5 all progress without debug command.
5. Wave 3 unlocks evolution.
6. Wave 5 clear enters BOSS_PREP.
7. No stuck wave state.
8. npm run typecheck passes.

Completion requirement:
End with Phase 8 Gate Report.
```

---

# Phase 9 Prompt：英雄进化系统

```md
Task: Phase 9 - Implement one-time hero evolution paths.

Read first:
- docs/RULES_CORE_LOOP.md
- docs/COMBAT_NUMBERS_V0_1.md
- docs/NETWORK_SYNC_SPEC.md
- shared/config/combatNumbers.ts

Goal:
Allow each player to spend shared sunlight once to choose one evolution path after Wave 3.

Server requirements:
1. Create `EvolutionSystem`.
2. Implement `action.evolve`.
3. Validate:
   - evolutionUnlocked = true
   - player alive
   - player has not evolved
   - valid path
   - enough sharedSun
   - matchState allows evolve
4. On success:
   - deduct sharedSun
   - set hasEvolved
   - set evolutionPath
   - apply modifiers
   - update stats
   - emit accepted + feedback
5. Implement firepower:
   - pistol damage 35
   - magazine size 10
   - max reserve 36
   - weak point multiplier 2.5 later for Boss
6. Implement control:
   - slow on hit
   - stronger runner slow
   - Boss interrupt bonus interface for Phase 10
7. Implement support:
   - ammo purchase cost 40
   - ammo purchase cooldown 8 seconds
   - sun drop chance bonus
8. If support shield is too large, document it as Phase 14 polish, but do not block.

Client requirements:
1. Press F to open evolution UI.
2. Show three paths:
   - firepower
   - control
   - support
3. Show cost.
4. Show availability.
5. Show selected path after success.
6. Show rejected reasons.

Do NOT implement yet:
- Extra evolution choices.
- Permanent progression.
- New heroes.

Validation:
1. Before unlock, evolve rejected.
2. After Wave 3 clear, evolve available.
3. Not enough sun rejected.
4. Each player can evolve once.
5. Firepower changes weapon stats.
6. Control applies slow on enemies.
7. Support changes ammo purchase cost/cooldown.
8. Evolve does not refill ammo.
9. npm run typecheck passes.

Completion requirement:
End with Phase 9 Gate Report.
```

---

# Phase 10 Prompt：Boss 战

```md
Task: Phase 10 - Implement the V0.1 two-phase boss fight.

Read first:
- docs/GAME_DESIGN_V0_1.md
- docs/RULES_CORE_LOOP.md
- docs/COMBAT_NUMBERS_V0_1.md
- docs/NETWORK_SYNC_SPEC.md
- docs/ART_DIRECTION_V0_1.md
- shared/config/combatNumbers.ts

Goal:
Implement Ironmaw Siege Beast as the final V0.1 boss.

Server requirements:
1. Create `BossSystem`.
2. Spawn boss after BOSS_PREP.
3. Boss appears in snapshot only during BOSS_ACTIVE.
4. Implement Boss HP and phase.
5. Phase 1:
   - slow advance
   - hammer_slam
   - summon_minions
   - weakpoint_expose
6. Phase transition at 50% HP:
   - 2 second transition
   - team sun reward
   - phase = 2
   - speed increase
7. Phase 2:
   - charge_windup
   - weakPointActive during windup
   - interruptProgress
   - requiredInterruptPoints
   - charge success/fail
   - phase2 summon
   - sun_suppression
8. Hero bullets can hit Boss.
9. Hero bullets hitting active weak point increase interrupt progress.
10. Plant projectiles damage Boss but do not increase interrupt progress.
11. Control evolution applies interrupt bonus according to COMBAT_NUMBERS.
12. Firepower evolution applies weak point damage multiplier.
13. Boss death with baseHp > 0 triggers VICTORY.
14. If baseHp <= 0 on same tick, DEFEAT wins.

Client requirements:
1. Render Boss placeholder.
2. Render Boss HP bar.
3. Render Boss phase.
4. Render weak point marker.
5. Render charge warning.
6. Render interrupt progress bar.
7. Display Boss phase change feedback.

Do NOT implement:
- More bosses.
- Cutscenes.
- Complex final animations.
- New enemy types.

Validation:
1. Boss spawns after Wave 5 and Boss Prep.
2. Boss takes damage from plants and heroes.
3. Boss phase 2 triggers at 50% HP.
4. Weak point appears.
5. Hero weak point hits increase interruptProgress.
6. Plant hits do not increase interruptProgress.
7. Charge can be interrupted.
8. Failed charge damages plant/hero as configured.
9. Boss death triggers VICTORY.
10. npm run typecheck passes.

Completion requirement:
End with Phase 10 Gate Report.
```

---

# Phase 11 Prompt：UI、反馈与结算

```md
Task: Phase 11 - Implement required gameplay UI, feedback toasts, and result screen.

Read first:
- docs/GAME_DESIGN_V0_1.md
- docs/RULES_CORE_LOOP.md
- docs/NETWORK_SYNC_SPEC.md
- docs/AUDIO_PIPELINE_V0_1.md
- docs/CODEX_IMPLEMENTATION_PLAN.md

Goal:
Make the full V0.1 loop understandable to players and produce server-side match results.

Client UI requirements:
1. Shared sunlight display.
2. Base HP display.
3. Current wave display.
4. Prep/countdown display.
5. Player HP display.
6. Ammo display.
7. Reload display.
8. Ammo purchase cooldown display.
9. Selected plant display.
10. Evolution availability and selected path.
11. Boss HP bar.
12. Boss phase indicator.
13. Boss interrupt bar.
14. Boss charge warning.
15. Rejected action toast.
16. Victory screen.
17. Defeat screen.
18. Basic controls help panel.

Server stats requirements:
1. clearTimeSeconds.
2. result.
3. finalWave.
4. baseHpRemaining.
5. totalSunEarned.
6. totalSunSpent.
7. totalPlantsPlaced.
8. totalEnemiesKilled.
9. bossDamageTotal.
10. Per-player:
   - damageDealt
   - enemiesKilled
   - shotsFired
   - shotsHit
   - ammoPurchases
   - sunSpentByActions
   - plantsPlaced
   - deaths
   - evolutionPath

Network requirements:
1. Send `match.ended` with results.
2. Preserve final snapshot.
3. Stop combat mutation after result.

Do NOT implement:
- Leaderboard.
- Account persistence.
- Rewards.
- Unlocks.

Validation:
1. UI lets player understand current state.
2. Rejected actions show correct reason.
3. Victory shows result stats.
4. Defeat shows result stats.
5. Stats come from server.
6. UI does not block essential battlefield view.
7. npm run typecheck passes.

Completion requirement:
End with Phase 11 Gate Report.
```

---

# Phase 12 Prompt：音频管线接入

```md
Task: Phase 12 - Implement V0.1 audio pipeline and P0 audio event hooks.

Read first:
- docs/AUDIO_PIPELINE_V0_1.md
- docs/NETWORK_SYNC_SPEC.md
- docs/RULES_CORE_LOOP.md
- docs/CODEX_IMPLEMENTATION_PLAN.md

Goal:
Build the audio infrastructure and hook P0 audio events without creating copyright risk.

Implement files:
1. `client/src/audio/AudioManager.ts`
2. `client/src/audio/audioRegistry.ts`
3. `client/src/audio/audioEvents.ts`
4. `client/src/audio/audioBuses.ts`
5. `assets/audio/docs/audio_asset_status_v0_1.md`
6. `assets/audio/docs/audio_licenses_v0_1.md`
7. `assets/audio/docs/attribution_v0_1.md`

AudioManager requirements:
1. master/sfx/music/ui buses.
2. play(AudioEventId).
3. random variants support.
4. minInterval throttling.
5. missing resource fallback.
6. browser audio unlock after user interaction.
7. dev warnings for missing audio.
8. no crash if audio file missing.

P0 event hooks:
- weapon.pistolShot
- weapon.dryFire
- weapon.reload
- plant.place
- plant.shoot
- sun.gain
- enemy.hit
- enemy.death
- base.damaged
- wave.start
- boss.spawn
- boss.chargeWarning
- boss.interrupted
- match.victory
- match.defeat
- ui.error
- ui.click

Resource rules:
1. If real audio files are not available, create placeholder strategy.
2. Do not download or include unclear-license files.
3. Every real audio asset must be documented with license.
4. Attribution-required assets must update attribution document.

Do NOT implement:
- Complex dynamic music.
- Voice acting.
- Unlicensed audio.

Validation:
1. AudioManager initializes after user interaction.
2. P0 events can be triggered.
3. Missing files do not crash game.
4. Boss warning audio is mapped.
5. Victory/defeat audio is mapped.
6. audio_asset_status exists and is populated.
7. npm run typecheck passes.

Completion requirement:
End with Phase 12 Gate Report.
```

---

# Phase 13 Prompt：美术管线接入

```md
Task: Phase 13 - Implement V0.1 art asset pipeline, placeholders, and image-gen prompt assets.

Read first:
- docs/ART_DIRECTION_V0_1.md
- docs/GAME_DESIGN_V0_1.md
- docs/CODEX_IMPLEMENTATION_PLAN.md

Goal:
Make all gameplay entities visually manageable through a centralized asset pipeline, while keeping placeholders if generated art is not available.

Implement files:
1. `client/src/assets/artAssetRegistry.ts`
2. `client/src/assets/renderScaleV01.ts`
3. `assets/art/source_prompts/image_gen_prompts_v0_1.md`
4. `assets/docs/asset_status_v0_1.md`

Requirements:
1. Centralize all art asset keys.
2. Centralize render scale by entity type.
3. Ensure every P0 gameplay object has a placeholder or generated asset path.
4. Use Phaser Graphics fallback if image files are missing.
5. Add prompts from ART_DIRECTION_V0_1.md into image_gen_prompts_v0_1.md.
6. Track asset status:
   - missing
   - placeholder
   - prompt_ready
   - generated
   - integrated
   - approved
   - rejected
7. Integrate P0 placeholders for:
   - two heroes
   - three plants
   - three enemies
   - boss
   - hero bullet
   - pea projectile
   - lane tile
   - plant cell
   - base
   - core UI icons
   - core FX placeholders
8. If image-gen or game-studio tools are available, generate Batch A assets.
9. If generation is unavailable, mark Batch A as prompt_ready and keep placeholders.

Hard rules:
1. Do not use PVZ names or art.
2. Do not use external game assets with unclear license.
3. Do not block gameplay on final art.
4. Game readability is more important than visual detail.

Validation:
1. Game runs with missing final art.
2. All major entities are visible and distinguishable.
3. Asset registry is used by rendering code.
4. asset_status_v0_1.md exists and is updated.
5. Generated/prompt assets follow original IP constraints.
6. npm run typecheck passes.

Completion requirement:
End with Phase 13 Gate Report.
```

---

# Phase 13A Prompt：Image-gen Batch A 核心单位生成

> 如果 Codex 环境中真的有 image-gen / game-studio 插件，用这个作为子任务。

```md
Task: Phase 13A - Generate Art Batch A core gameplay entities.

Read first:
- docs/ART_DIRECTION_V0_1.md
- assets/art/source_prompts/image_gen_prompts_v0_1.md
- assets/docs/asset_status_v0_1.md

Goal:
Generate or prepare original 2.5D top-down gameplay sprites for the core V0.1 units.

Batch A assets:
1. hero_ranger_a
2. hero_ranger_b
3. plant_sunbloom
4. plant_peashotter
5. plant_barkwall
6. enemy_shambler
7. enemy_runner
8. enemy_brute
9. boss_ironmaw_phase1

For each asset:
1. Use the prompt from ART_DIRECTION_V0_1.md.
2. Preserve original IP constraints.
3. Require transparent background.
4. Require no text, logo, or watermark.
5. Ensure readable silhouette at small size.
6. Save output to correct folder.
7. Update asset_status_v0_1.md.
8. Integrate into art registry if usable.
9. If output is too similar to existing IP, reject and regenerate or keep placeholder.

Do NOT generate:
- Additional heroes.
- Additional plants.
- Extra enemies.
- Skins.
- Commercial UI polish.

Validation:
1. Each generated asset exists or is marked prompt_ready.
2. No obvious copyrighted resemblance.
3. Game still runs if any asset is missing.
4. Integrated assets appear at readable size.

Completion requirement:
End with Phase 13A Gate Report.
```

---

# Phase 13B Prompt：Image-gen Batch B 地图、投射物、特效

```md
Task: Phase 13B - Generate Art Batch B environment, projectiles, and core FX.

Read first:
- docs/ART_DIRECTION_V0_1.md
- assets/docs/asset_status_v0_1.md

Goal:
Generate or prepare V0.1 support assets for battlefield readability and combat feedback.

Batch B assets:
1. tile_ground_lane
2. tile_plant_cell
3. base_greenhouse_core
4. projectile_hero_bullet
5. projectile_pea
6. fx_muzzle_flash
7. fx_hit_spark
8. fx_sun_gain
9. fx_plant_place
10. fx_boss_weakpoint
11. fx_boss_charge_warning

Requirements:
1. Follow ART_DIRECTION_V0_1.md.
2. Keep backgrounds transparent for sprites/FX.
3. Make lane/cell visuals readable but not distracting.
4. Make projectiles small but high contrast.
5. Boss weak point and charge warning must be highly visible.
6. Update asset status.
7. Integrate usable assets into Phaser preload/registry.

Do NOT add new gameplay systems.

Validation:
1. Battlefield is still readable.
2. Plant cells do not obscure plants.
3. Projectiles are visible.
4. Boss warning is visually clear.
5. npm run typecheck passes.

Completion requirement:
End with Phase 13B Gate Report.
```

---

# Phase 14 Prompt：端到端试玩、修复与第一次平衡

```md
Task: Phase 14 - End-to-end V0.1 playtest, bug fixing, and first balance pass.

Read first:
- docs/GAME_DESIGN_V0_1.md
- docs/RULES_CORE_LOOP.md
- docs/COMBAT_NUMBERS_V0_1.md
- docs/NETWORK_SYNC_SPEC.md
- docs/ART_DIRECTION_V0_1.md
- docs/AUDIO_PIPELINE_V0_1.md
- docs/CODEX_IMPLEMENTATION_PLAN.md

Goal:
Run the full V0.1 game loop with two local clients, fix blockers, and tune the smallest necessary set of numbers.

Test full flow:
1. Create room.
2. Join with second client.
3. Both ready.
4. Countdown.
5. Wave 1–5.
6. Evolution after Wave 3.
7. Boss Prep.
8. Boss Active.
9. Victory or Defeat.
10. Result screen.

Record metrics:
1. Total match duration.
2. Wave durations.
3. Total sun earned.
4. Total sun spent.
5. Plants placed.
6. Ammo purchases.
7. Player deaths.
8. Enemy kills.
9. Boss fight duration.
10. Boss charge attempts.
11. Boss charge interrupts.
12. Base HP remaining.
13. Critical bugs.

Fix only blockers and severe issues.

Tuning priority:
1. Enemy count and spawn timing.
2. Sunbloom production.
3. Ammo purchase cost/cooldown.
4. Boss HP.
5. Boss interrupt requirement.
6. Plant HP/damage.
7. Hero damage.

Create:
- docs/PLAYTEST_REPORT_V0_1.md

Do NOT add new features.
Do NOT add V0.2 systems.
Do NOT rewrite architecture unless a blocker proves it necessary.

Validation:
1. Full match completes.
2. No critical crashes.
3. Server remains authoritative.
4. Match duration targets 5–8 minutes.
5. Boss fight is understandable.
6. Results screen appears.
7. npm run typecheck passes.
8. npm run build passes if practical.

Completion requirement:
End with Phase 14 Gate Report.
```

---

# Phase 15 Prompt：Demo 打包与交付

```md
Task: Phase 15 - Prepare the V0.1 demo delivery package.

Read first:
- docs/CODEX_IMPLEMENTATION_PLAN.md
- docs/PLAYTEST_REPORT_V0_1.md
- docs/ART_DIRECTION_V0_1.md
- docs/AUDIO_PIPELINE_V0_1.md

Goal:
Make the project easy to run, test, and hand off.

Implement/document:
1. Update README.md.
2. Add environment requirements.
3. Add install instructions.
4. Add dev server startup instructions.
5. Add two-client local test instructions.
6. Add controls.
7. Add V0.1 scope summary.
8. Add known issues.
9. Add troubleshooting.
10. Add asset/audio license notes.
11. Ensure attribution document is referenced.
12. Ensure build script works.
13. Ensure typecheck script works.
14. Ensure test script works or document limitations.
15. Add demo checklist.

README must explain:
- How to start server.
- How to start client.
- How to create room.
- How to join room.
- How to play.
- How to trigger a full run.

Do NOT add new gameplay features.

Validation:
1. Fresh install instructions are accurate.
2. npm run typecheck passes.
3. npm run build passes.
4. npm run test passes or known limitations are documented.
5. Two-client demo is reproducible.
6. License/attribution docs exist.

Completion requirement:
End with Phase 15 Gate Report and final V0.1 status summary.
```

---

## 5. Prompt：阶段完成后代码审查

> 每完成 2–3 个阶段，建议执行一次。

```md
Task: Architecture and scope review.

Read:
- docs/CODEX_IMPLEMENTATION_PLAN.md
- All docs relevant to implemented phases
- Current codebase

Goal:
Review whether the implementation still follows V0.1 architecture and scope.

Check:
1. Server-authoritative boundaries.
2. Shared types/config usage.
3. Whether gameplay numbers are hardcoded outside config.
4. Whether client is deciding any authoritative result.
5. Whether room/game lifecycle is clean.
6. Whether any V0.2 feature accidentally entered V0.1.
7. Whether code structure remains maintainable.
8. Whether docs/status files are updated.
9. Whether tests cover critical pure logic.
10. Whether assets/audio violate licensing rules.

Do not implement new features.
Only fix tiny documentation or obvious safety issues if necessary.

Output:
- Architecture status.
- Scope drift findings.
- Server authority findings.
- Test gaps.
- Refactor recommendations.
- Next safest task.
```

---

## 6. Prompt：V0.2 Backlog 收敛

> 如果 Codex 或你想到新点子，但不想污染 V0.1，用这个。

```md
Task: Add ideas to V0.2 backlog without changing V0.1 scope.

Read:
- docs/GAME_DESIGN_V0_1.md
- docs/CODEX_IMPLEMENTATION_PLAN.md

Goal:
Capture new feature ideas safely without implementing them now.

Create or update:
- docs/V0_2_BACKLOG.md

For each idea, record:
- Feature name
- Description
- Why it is not V0.1
- Dependency
- Risk
- Suggested priority

Do not change gameplay code.
Do not implement backlog items.
```

---

## 7. Prompt：给 Codex 的最终纪律提醒

> 如果你发现 Codex 开始乱扩功能，把这段喂给它。

```md
Stop scope expansion.

You are currently working on V0.1 only.

Do not implement:
- extra weapons
- extra heroes
- extra plants
- extra maps
- extra bosses
- accounts
- matchmaking
- shop
- skins
- mobile support
- out-of-run progression
- P2P networking
- AI teammates
- cinematic cutscenes

Your task is to complete the current phase according to CODEX_IMPLEMENTATION_PLAN.md and the relevant design docs.

If you have a new idea, add it to docs/V0_2_BACKLOG.md instead of implementing it.

Now restate the current phase scope, what you will not implement, and the validation plan before changing code.
```

---

## 8. 最终使用建议

推荐实际执行顺序：

```text
Prompt 00
Prompt 00A, optional status check
Phase 0
Phase 1
Phase 2
Phase 3
Architecture Review
Phase 4
Phase 5
Phase 6
Architecture Review
Phase 7
Phase 8
Phase 9
Architecture Review
Phase 10
Phase 11
Phase 12
Phase 13
Phase 13A/B if image-gen available
Phase 14
Phase 15
```

执行纪律：

- 一个阶段一个阶段推进；
- 每阶段必须 Gate Report；
- 失败先修复，不跳阶段；
- 有新想法进 V0.2 backlog；
- 美术音频缺失用 placeholder；
- 先让游戏完整可玩，再追求漂亮。

