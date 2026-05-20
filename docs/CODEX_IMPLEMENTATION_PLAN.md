# CODEX_IMPLEMENTATION_PLAN.md

# 双人合作枪械英雄塔防 V0.1 Codex 分阶段实现计划

## 0. 文档目的

本文档是 V0.1 的 Codex 施工总控文档。

它负责把以下设计文档转化为可执行开发阶段：

| 文档 | 作用 |
|---|---|
| `GAME_DESIGN_V0_1.md` | 总玩法设计 |
| `RULES_CORE_LOOP.md` | 核心规则循环 |
| `COMBAT_NUMBERS_V0_1.md` | 数值、波次、Boss 参数 |
| `NETWORK_SYNC_SPEC.md` | 联机同步协议 |
| `ART_DIRECTION_V0_1.md` | 美术资源方向与 image-gen 管线 |
| `AUDIO_PIPELINE_V0_1.md` | 音频资源、license、AudioManager 管线 |

本文档用于约束 Codex：

- 每阶段必须先读相关文档；
- 每阶段只做明确范围；
- 每阶段必须给出计划、改动、验证、报告；
- 不允许随意扩大 V0.1 范围；
- 不允许把玩法、网络、美术、音频混乱堆叠；
- 不允许用未授权资源；
- 必须优先完成可玩的垂直切片闭环。

---

## 1. V0.1 最终交付目标

V0.1 最终应交付一个可本地运行的 Web 联机 Demo。

目标体验：

```text
两名玩家进入房间
  ↓
准备后进入战斗地图
  ↓
共享阳光
  ↓
种植物防守五路
  ↓
英雄持枪移动、射击、换弹、买弹药
  ↓
经历 5 波敌人
  ↓
Wave 3 后可进化
  ↓
进入 Boss 前准备
  ↓
与两阶段 Boss 战斗
  ↓
通过命中弱点打断 Boss 冲锋
  ↓
击败 Boss 胜利，或基地 HP 归零失败
  ↓
显示结算统计
```

---

## 2. Codex 总执行原则

### 2.1 永远先读文档

每个任务开始前，Codex 必须先读取相关文档，并在回复中简要列出本任务约束。

例如：

```text
Read:
- docs/GAME_DESIGN_V0_1.md
- docs/RULES_CORE_LOOP.md
- docs/NETWORK_SYNC_SPEC.md
```

### 2.2 永远阶段化实现

禁止一次性实现完整游戏。

每个阶段只能完成一个明确目标，例如：

- 只做房间；
- 只做移动；
- 只做种植；
- 只做枪械；
- 只做 Boss；
- 只做音频接入。

### 2.3 永远服务器权威

Codex 不得让客户端决定：

- 阳光；
- 命中；
- 死亡；
- Boss 打断；
- 胜负；
- 植物是否成功种下；
- 进化是否成功。

客户端只能提交输入和请求。

### 2.4 永远数据驱动

所有数值必须放入配置文件，不允许散落在逻辑代码中。

推荐：

```text
shared/config/combatNumbers.ts
shared/config/wavesV01.ts
shared/config/networkTiming.ts
client/src/assets/assetRegistry.ts
client/src/audio/audioRegistry.ts
```

### 2.5 美术和音频不能阻塞玩法

如果美术或音频未完成：

- 使用 placeholder；
- 更新资源状态；
- 继续玩法开发；
- 后续替换。

### 2.6 不扩大 V0.1 范围

Codex 不允许主动加入以下内容：

- 账号系统；
- 排位匹配；
- 商城；
- 皮肤；
- 3 人/4 人模式；
- 多地图；
- 多武器；
- 复杂局外成长；
- 移动端适配；
- P2P 联机；
- AI 队友；
- 大型剧情系统。

除非后续明确进入 V0.2。

---

## 3. Codex 每次任务固定输出格式

Codex 每次执行任务必须使用以下格式。

```md
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

- path/to/file.ts
- path/to/file.md

## 5. Validation Plan

Commands:
- npm run typecheck
- npm run test
- npm run dev

Runtime checks:
-
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
```

如果 Codex 没有按这个格式输出，任务视为不合格，需要重做总结。

---

## 4. 推荐 Monorepo 结构

V0.1 推荐项目结构：

```text
project-root/
  client/
    src/
      audio/
      entities/
      net/
      scenes/
      ui/
      rendering/
      assets/
      debug/
  server/
    src/
      game/
        systems/
        rooms/
        state/
        stats/
      net/
      debug/
  shared/
    config/
    types/
    utils/
  assets/
    art/
    audio/
  docs/
  codex_prompts/
  package.json
  README.md
```

### 4.1 client 责任

客户端负责：

- Phaser 渲染；
- 输入采集；
- Socket 连接；
- snapshot 插值；
- UI；
- 音频；
- 美术资源加载；
- debug overlay。

### 4.2 server 责任

服务端负责：

- 房间；
- 玩家 session；
- 权威 GameState；
- 固定 Tick；
- 核心系统；
- 状态快照；
- 动作校验；
- 胜负与结算。

### 4.3 shared 责任

shared 负责：

- 网络消息类型；
- 游戏状态类型；
- 枚举；
- 战斗数值；
- 波次配置；
- 网络时间配置；
- 纯函数工具。

---

## 5. 分阶段路线总览

| Phase | 名称 | 目标 |
|---|---|---|
| Phase 0 | 项目脚手架与文档落地 | 建立 monorepo、docs、基础启动 |
| Phase 1 | shared 类型与配置 | 建立共享类型、数值、事件名 |
| Phase 2 | 房间与双人 ready | 创建/加入房间，双人准备开始 |
| Phase 3 | 状态机与 GameLoop | 服务器权威 MatchState 与 Tick |
| Phase 4 | 地图、网格与玩家移动 | 5 路地图、玩家同步移动 |
| Phase 5 | 共享阳光与种植 | 阳光、三种植物、种植校验 |
| Phase 6 | 敌人与植物防线 | 敌人移动、攻击植物、基地受损 |
| Phase 7 | 英雄枪械系统 | 射击、子弹、换弹、买弹药 |
| Phase 8 | 波次系统 | Wave 1–5 刷怪脚本与推进 |
| Phase 9 | 英雄进化 | 三路线进化与数值效果 |
| Phase 10 | Boss 战 | 两阶段 Boss、弱点、打断、胜利 |
| Phase 11 | UI、反馈、结算 | 关键 UI、提示、结算统计 |
| Phase 12 | 音频管线接入 | AudioManager、P0 音频事件 |
| Phase 13 | 美术管线接入 | placeholder、image-gen 资源替换 |
| Phase 14 | 端到端平衡与打磨 | 完整试玩、调参、修复、报告 |
| Phase 15 | Demo 打包与交付 | README、运行脚本、演示检查 |

---

# Phase 0：项目脚手架与文档落地

## 0.1 目标

建立可运行的项目基础结构。

## 0.2 读取文档

```text
GAME_DESIGN_V0_1.md
RULES_CORE_LOOP.md
COMBAT_NUMBERS_V0_1.md
NETWORK_SYNC_SPEC.md
ART_DIRECTION_V0_1.md
AUDIO_PIPELINE_V0_1.md
```

## 0.3 实现内容

- 创建 monorepo；
- 创建 `client/`；
- 创建 `server/`；
- 创建 `shared/`；
- 创建 `docs/`；
- 创建 `assets/`；
- 配置 TypeScript；
- 配置 Vite + Phaser；
- 配置 Node.js + Socket.IO server；
- 配置 Vitest；
- 添加 README；
- 添加基础 scripts。

## 0.4 暂不实现

- 不做正式玩法；
- 不做房间逻辑；
- 不做美术生成；
- 不做音频下载。

## 0.5 验收标准

```text
npm install 成功
npm run dev:client 成功
npm run dev:server 成功
npm run typecheck 成功
npm run test 成功或至少测试框架可运行
```

## 0.6 Codex Prompt

```md
Task: Phase 0 - Bootstrap the project structure.

Read all V0.1 design docs first. Create a clean TypeScript monorepo with client, server, shared, docs, and assets folders. Set up Phaser 3 + Vite for the client, Node.js + Socket.IO for the server, shared TypeScript types/config package, and baseline scripts for dev, build, typecheck, and test.

Do not implement gameplay yet. The goal is a clean, runnable foundation.
```

---

# Phase 1：shared 类型与配置

## 1.1 目标

把设计文档中的核心 schema 和数值变成共享 TypeScript 类型与配置。

## 1.2 读取文档

```text
RULES_CORE_LOOP.md
COMBAT_NUMBERS_V0_1.md
NETWORK_SYNC_SPEC.md
```

## 1.3 实现内容

创建：

```text
shared/types/enums.ts
shared/types/state.ts
shared/types/messages.ts
shared/types/network.ts
shared/types/entities.ts
shared/config/combatNumbers.ts
shared/config/wavesV01.ts
shared/config/networkTiming.ts
shared/config/mapConfig.ts
shared/utils/math.ts
shared/utils/id.ts
```

包括：

- `MatchState`；
- `RoomState`；
- `PlayerState`；
- `PlantState`；
- `EnemyState`；
- `BulletState`；
- `BossState`；
- `GameStateSnapshot`；
- C2S / S2C event names；
- Action accepted/rejected；
- CombatNumbersV01；
- WavesV01。

## 1.4 暂不实现

- 不做实际服务器 GameLoop；
- 不做客户端渲染；
- 不做完整房间逻辑。

## 1.5 验收标准

- shared 类型可被 client/server 引用；
- 无循环依赖；
- typecheck 通过；
- 数值不散落在 server/client。

## 1.6 Codex Prompt

```md
Task: Phase 1 - Implement shared V0.1 types and configs.

Read RULES_CORE_LOOP.md, COMBAT_NUMBERS_V0_1.md, and NETWORK_SYNC_SPEC.md. Create shared TypeScript types for match state, room state, entities, network messages, snapshots, action rejection reasons, and feedback events. Create shared config files for combat numbers, waves, map config, and network timing.

No gameplay logic yet. This phase only establishes the typed contract used by client and server.
```

---

# Phase 2：房间与双人 ready

## 2.1 目标

实现最小可用双人房间流程。

## 2.2 读取文档

```text
NETWORK_SYNC_SPEC.md
RULES_CORE_LOOP.md
```

## 2.3 实现内容

服务端：

- `RoomManager`；
- `GameRoom` 基础结构；
- `room.create`；
- `room.join`；
- `room.leave`；
- `player.ready`；
- slot 0 / slot 1 分配；
- 第三人加入拒绝；
- `room.state` 广播；
- 基础 reconnectToken 生成。

客户端：

- 输入房间 ID；
- 创建房间；
- 加入房间；
- ready 按钮；
- 房间玩家列表；
- 连接状态显示。

## 2.4 暂不实现

- 不做战斗；
- 不做移动；
- 不做断线完整恢复。

## 2.5 验收标准

- 两个浏览器可以进入同一房间；
- 第三人加入被拒绝；
- 两名玩家 ready 后服务器进入 countdown 或准备开始 match；
- 房间状态两端同步。

## 2.6 Codex Prompt

```md
Task: Phase 2 - Implement 2-player room and ready flow.

Use Socket.IO and the shared network types. Implement createRoom, joinRoom, leaveRoom, player.ready, room.state broadcasts, slot assignment, and third-player rejection. Build a minimal client lobby UI to create/join a room and show both players' ready states.

Do not implement combat or movement yet.
```

---

# Phase 3：状态机与 GameLoop

## 3.1 目标

实现服务器权威 MatchStateMachine 和固定 Tick GameLoop。

## 3.2 读取文档

```text
RULES_CORE_LOOP.md
NETWORK_SYNC_SPEC.md
COMBAT_NUMBERS_V0_1.md
```

## 3.3 实现内容

服务端：

- `MatchStateMachine`；
- `GameLoop`；
- `GameState` 初始化；
- `LOBBY → COUNTDOWN → WAVE_PREP`；
- `stateElapsedSeconds`；
- `stateRemainingSeconds`；
- 20Hz tick；
- 10Hz snapshot broadcast；
- `match.phaseChanged` event。

客户端：

- 接收 snapshot；
- 显示 matchState；
- 显示倒计时；
- debug overlay 基础信息。

## 3.4 暂不实现

- 不做敌人刷怪；
- 不做玩家移动；
- 不做植物。

## 3.5 验收标准

- ready 后进入 countdown；
- countdown 后进入 `WAVE_PREP`；
- 快照持续广播；
- 客户端显示状态；
- 进入终止状态后 tick 不继续修改战斗。

## 3.6 Codex Prompt

```md
Task: Phase 3 - Implement authoritative match state machine and game loop.

Create MatchStateMachine and GameLoop on the server using the state flow from RULES_CORE_LOOP.md. Add timed transitions from LOBBY/COUNTDOWN/WAVE_PREP and periodic GameStateSnapshot broadcasts. The client should display match state, timers, and debug overlay data.

Do not implement movement, planting, enemies, or combat yet.
```

---

# Phase 4：地图、网格与玩家移动

## 4.1 目标

实现战斗地图、5 路 × 7 格、双玩家服务器权威移动同步。

## 4.2 读取文档

```text
GAME_DESIGN_V0_1.md
RULES_CORE_LOOP.md
NETWORK_SYNC_SPEC.md
COMBAT_NUMBERS_V0_1.md
ART_DIRECTION_V0_1.md
```

## 4.3 实现内容

服务端：

- map bounds；
- lane/cell 坐标计算；
- player spawn positions；
- `input.move`；
- `input.aim`；
- 服务器位置更新；
- 边界限制。

客户端：

- Phaser BattleScene；
- 绘制 5 路；
- 绘制 7 列 plant cells；
- 绘制基地 placeholder；
- 绘制两名玩家 placeholder；
- snapshot 插值；
- 本地玩家轻量预测。

## 4.4 暂不实现

- 不做种植；
- 不做射击；
- 不做敌人。

## 4.5 验收标准

- 两名玩家互相看到移动；
- 玩家不能出界；
- 地图路线清楚；
- plant cells 可见；
- 位置由服务器修正。

## 4.6 Codex Prompt

```md
Task: Phase 4 - Implement battle map, grid, and server-authoritative player movement.

Build the 5-lane by 7-column battlefield with placeholder graphics. Implement input.move and input.aim using server-authoritative positions. Render both players in Phaser using snapshots and interpolation. Add debug overlay for position, lane grid, and snapshot sequence.

Do not implement planting or combat yet.
```

---

# Phase 5：共享阳光与种植系统

## 5.1 目标

实现共享阳光、三种植物和服务器权威种植校验。

## 5.2 读取文档

```text
RULES_CORE_LOOP.md
COMBAT_NUMBERS_V0_1.md
NETWORK_SYNC_SPEC.md
ART_DIRECTION_V0_1.md
```

## 5.3 实现内容

服务端：

- `EconomySystem`；
- `PlantSystem`；
- sharedSun 初始化；
- `action.plant`；
- 种植合法性校验；
- cell occupancy；
- `sunbloom` 周期产阳光；
- PlantState snapshot；
- action accepted/rejected。

客户端：

- 植物选择 UI：1/2/3；
- E 键种植；
- hover cell；
- 显示 sharedSun；
- 显示植物 placeholder；
- 操作失败提示。

## 5.4 暂不实现

- 输出植物攻击；
- 敌人；
- 植物受伤。

## 5.5 验收标准

- 两名玩家共享同一阳光池；
- 任意玩家种植物会扣团队阳光；
- 同格种植一个成功一个失败；
- 阳光不足拒绝；
- 距离太远拒绝；
- `sunbloom` 自动产阳光。

## 5.6 Codex Prompt

```md
Task: Phase 5 - Implement shared sunlight economy and planting.

Create EconomySystem and PlantSystem. Implement sharedSun, plant costs, action.plant validation, cell occupancy, and sunbloom production. Add client UI for selecting plants, planting with E, showing shared sunlight, and displaying rejected action reasons.

Do not implement enemies or plant attacks yet.
```

---

# Phase 6：敌人与植物防线循环

## 6.1 目标

实现敌人移动、植物攻击、植物受伤、基地受损，形成基础塔防循环。

## 6.2 读取文档

```text
RULES_CORE_LOOP.md
COMBAT_NUMBERS_V0_1.md
NETWORK_SYNC_SPEC.md
```

## 6.3 实现内容

服务端：

- `EnemySystem`；
- `PlantCombatSystem`；
- shambler / runner / brute；
- enemy spawn debug command；
- enemy lane movement；
- enemy attack plant；
- plant death and cell release；
- peashotter attack；
- pea projectile；
- base damage；
- enemy death and sun drop。

客户端：

- 显示 enemies；
- 显示 pea projectiles；
- 显示 HP bars 或 debug HP；
- base HP UI；
- hit/death placeholder feedback。

## 6.4 暂不实现

- 正式 wave schedule；
- 英雄枪械；
- Boss。

## 6.5 验收标准

- 敌人沿 lane 移动；
- 遇到植物停止攻击；
- 植物死亡释放格子；
- peashotter 自动攻击；
- 敌人死亡掉阳光；
- 敌人突破基地扣 HP；
- baseHp <= 0 进入 DEFEAT。

## 6.6 Codex Prompt

```md
Task: Phase 6 - Implement enemies and basic plant defense loop.

Create EnemySystem and PlantCombatSystem. Implement the three enemy types, lane movement, attacking plants, plant death, peashotter projectile attacks, enemy death, sun drops, and base damage. Use debug spawning before full waves.

Do not implement formal waves, hero gunplay, or boss yet.
```

---

# Phase 7：英雄枪械系统

## 7.1 目标

实现英雄射击、子弹命中、换弹、弹药购买与相关 UI。

## 7.2 读取文档

```text
RULES_CORE_LOOP.md
COMBAT_NUMBERS_V0_1.md
NETWORK_SYNC_SPEC.md
```

## 7.3 实现内容

服务端：

- `WeaponSystem`；
- `action.shoot`；
- `action.reload`；
- `action.buyAmmo`；
- magazine / reserveAmmo；
- fire rate；
- reload timer；
- ammo purchase cooldown；
- hero bullet；
- hero bullet hit enemy；
- stats: shotsFired, shotsHit, damageDealt。

客户端：

- 鼠标瞄准；
- 左键射击；
- R 换弹；
- Q 买弹药；
- ammo UI；
- reload UI；
- cooldown UI；
- muzzle flash placeholder。

## 7.4 暂不实现

- Boss 弱点；
- 进化修改枪械；
- 高级命中特效。

## 7.5 验收标准

- 弹匣耗尽不能射击；
- 换弹期间不能射击；
- 备弹为空不能换弹；
- 买弹药扣 sharedSun；
- 冷却中买弹药被拒绝；
- 子弹命中由服务器判定；
- 英雄不能绕过弹药限制。

## 7.6 Codex Prompt

```md
Task: Phase 7 - Implement hero pistol gunplay, reload, ammo purchase, and bullet hit detection.

Create WeaponSystem with server-authoritative shoot/reload/buyAmmo logic. Implement pistol ammo, fire rate, reload timer, reserve ammo, ammo purchase cooldown, hero bullets, and server-side collision with enemies. Add client input and ammo UI.

Do not implement boss weak points or evolution modifiers yet.
```

---

# Phase 8：正式波次系统

## 8.1 目标

接入 `WavesV01`，实现 Wave 1–5 正式流程。

## 8.2 读取文档

```text
RULES_CORE_LOOP.md
COMBAT_NUMBERS_V0_1.md
NETWORK_SYNC_SPEC.md
```

## 8.3 实现内容

服务端：

- `WaveSystem`；
- WAVE_PREP；
- WAVE_ACTIVE；
- WAVE_CLEAR；
- spawn schedule；
- waveSpawnComplete；
- enemiesRemainingInWave；
- Wave 3 后 evolutionUnlocked；
- Wave 5 后 BOSS_PREP。

客户端：

- wave UI；
- prep countdown；
- wave start feedback；
- evolution unlocked UI placeholder。

## 8.4 暂不实现

- Boss 本体；
- 进化效果。

## 8.5 验收标准

- Wave 1–5 按脚本刷怪；
- 本波刷完且场上敌人清空后进入下一阶段；
- Wave 3 清完后进化解锁；
- Wave 5 清完后进入 BOSS_PREP；
- 没有卡在波次中间。

## 8.6 Codex Prompt

```md
Task: Phase 8 - Implement formal WaveSystem using WavesV01.

Implement wave prep, wave active, wave clear, spawn schedules, wave completion detection, evolution unlock after Wave 3, and transition to BOSS_PREP after Wave 5. Add client wave UI and transition feedback.

Do not implement boss or evolution effects yet.
```

---

# Phase 9：英雄进化系统

## 9.1 目标

实现 Wave 3 后的一次性英雄进化。

## 9.2 读取文档

```text
RULES_CORE_LOOP.md
COMBAT_NUMBERS_V0_1.md
NETWORK_SYNC_SPEC.md
```

## 9.3 实现内容

服务端：

- `EvolutionSystem`；
- `action.evolve`；
- firepower；
- control；
- support；
- sharedSun 扣除；
- one-time limit；
- modifier application；
- stats evolutionPath。

客户端：

- F 打开进化 UI；
- 三路线按钮；
- cost 显示；
- hasEvolved 状态；
- rejected reason 显示。

## 9.4 V0.1 可降级项

如果支援护盾实现成本高：

- 先实现弹药折扣；
- 先实现掉落概率加成；
- 护盾标记为 TODO Polish。

但必须在报告中说明。

## 9.5 验收标准

- 未解锁不能进化；
- 阳光不足不能进化；
- 每人只能进化一次；
- 火力路线提高伤害/弹匣；
- 控制路线提供减速/打断加成接口；
- 支援路线降低买弹药成本；
- 进化不自动补满弹药。

## 9.6 Codex Prompt

```md
Task: Phase 9 - Implement hero evolution system.

Create EvolutionSystem. Implement action.evolve with firepower, control, and support paths using CombatNumbersV01. Enforce unlock timing, shared sun cost, one-time limit, and no ammo refill on evolve. Add client evolution UI.

If support shield is too complex, implement ammo discount and sun drop bonus first and document the shield as a polish task.
```

---

# Phase 10：Boss 战

## 10.1 目标

实现两阶段 Boss：铁颚攻城兽。

## 10.2 读取文档

```text
GAME_DESIGN_V0_1.md
RULES_CORE_LOOP.md
COMBAT_NUMBERS_V0_1.md
NETWORK_SYNC_SPEC.md
ART_DIRECTION_V0_1.md
```

## 10.3 实现内容

服务端：

- `BossSystem`；
- Boss spawn；
- Boss HP；
- Boss phase 1；
- hammer slam；
- summon minions；
- weakpoint expose；
- phase 2 transition；
- charge windup；
- interruptProgress；
- charge success/fail；
- sun suppression；
- boss death victory。

客户端：

- Boss placeholder sprite；
- Boss HP bar；
- weakpoint marker；
- charge warning；
- interrupt bar；
- phase change feedback。

## 10.4 暂不实现

- 多 Boss；
- 复杂 Boss 动画；
- Cinematic cutscene。

## 10.5 验收标准

- Wave 5 后 Boss 出现；
- Boss HP 同步；
- phase 2 在 50% HP 触发；
- Boss 弱点能显示；
- 英雄子弹命中弱点增加打断进度；
- 植物不能增加打断进度；
- 打断成功取消冲锋；
- 打断失败 Boss 冲锋并造成伤害；
- Boss 死亡进入 VICTORY。

## 10.6 Codex Prompt

```md
Task: Phase 10 - Implement the two-phase V0.1 boss fight.

Create BossSystem for ironmaw_siege_beast using CombatNumbersV01. Implement spawn after BOSS_PREP, phase 1 skills, weak point exposure, phase 2 transition, charge windup, server-authoritative interrupt progress from hero bullet weak-point hits, charge success/fail effects, sun suppression, and victory on boss death.

Do not add additional bosses or cutscenes.
```

---

# Phase 11：UI、反馈、结算

## 11.1 目标

完成 V0.1 必要 UI、操作反馈和结算统计。

## 11.2 读取文档

```text
GAME_DESIGN_V0_1.md
RULES_CORE_LOOP.md
NETWORK_SYNC_SPEC.md
AUDIO_PIPELINE_V0_1.md
```

## 11.3 实现内容

客户端 UI：

- sharedSun；
- baseHp；
- wave；
- player HP；
- ammo；
- reload；
- ammo purchase cooldown；
- selected plant；
- evolution UI；
- boss HP；
- boss interrupt bar；
- rejected action toast；
- victory/defeat screen。

服务端统计：

- clearTime；
- finalWave；
- baseHpRemaining；
- totalSunEarned；
- totalSunSpent；
- plantsPlaced；
- enemiesKilled；
- player damage；
- shotsFired；
- shotsHit；
- ammoPurchases；
- deaths；
- evolutionPath。

## 11.4 暂不实现

- 排行榜；
- 账号保存；
- 局外奖励。

## 11.5 验收标准

- 玩家能通过 UI 理解当前状态；
- 操作失败有明确提示；
- 胜负后显示统计；
- 统计来自服务器；
- UI 不遮挡关键战场。

## 11.6 Codex Prompt

```md
Task: Phase 11 - Implement required UI, feedback, and match results.

Add all V0.1 gameplay UI: shared sun, base HP, wave, player HP, ammo, reload, ammo purchase cooldown, selected plant, evolution state, boss HP, boss interrupt bar, rejected action toast, and victory/defeat result screen. Implement server-side match stats and include them in match.ended.

Do not implement accounts, rewards, leaderboard, or persistence.
```

---

# Phase 12：音频管线接入

## 12.1 目标

建立 AudioManager，并让 P0 音频事件全部可触发。

## 12.2 读取文档

```text
AUDIO_PIPELINE_V0_1.md
NETWORK_SYNC_SPEC.md
RULES_CORE_LOOP.md
```

## 12.3 实现内容

文件：

```text
client/src/audio/AudioManager.ts
client/src/audio/audioRegistry.ts
client/src/audio/audioEvents.ts
client/src/audio/audioBuses.ts
assets/audio/docs/audio_asset_status_v0_1.md
assets/audio/docs/audio_licenses_v0_1.md
assets/audio/docs/attribution_v0_1.md
```

功能：

- master/sfx/music/ui bus；
- P0 AudioEvent registry；
- missing audio fallback；
- feedback event 映射；
- browser audio unlock；
- minInterval throttle；
- placeholder beep 或静音资源。

## 12.4 暂不强制

- 不强制立刻找到全部真实音频；
- 不强制 BGM；
- 不强制复杂混音。

## 12.5 验收标准

- 开枪/空枪/换弹/种植/阳光/Boss 警告/胜负等事件可触发音频；
- 缺失音频不崩溃；
- 音频状态表存在；
- 所有真实资源 license 已记录。

## 12.6 Codex Prompt

```md
Task: Phase 12 - Implement V0.1 audio pipeline and P0 audio hooks.

Read AUDIO_PIPELINE_V0_1.md. Create AudioManager, audio registry, audio buses, audio event mapping, missing-resource fallback, and audio asset tracking docs. Wire server FeedbackEvent to AudioEvent playback. Use placeholders when real licensed audio is not available.

Do not use any audio file without explicit license information.
```

---

# Phase 13：美术管线接入

## 13.1 目标

建立 art asset registry、placeholder 管线，并逐步接入 image-gen / game-studio 生成资源。

## 13.2 读取文档

```text
ART_DIRECTION_V0_1.md
GAME_DESIGN_V0_1.md
```

## 13.3 实现内容

文件：

```text
client/src/assets/artAssetRegistry.ts
client/src/assets/renderScaleV01.ts
assets/art/source_prompts/image_gen_prompts_v0_1.md
assets/docs/asset_status_v0_1.md
```

功能：

- P0 placeholder 全部存在；
- Phaser preload 使用 registry；
- 每个实体根据 type 映射 asset key；
- renderScaleV01；
- image-gen prompt 保存；
- Batch A 资源生成或 prompt_ready；
- asset status 更新。

## 13.4 批次顺序

1. Placeholder 全量接入；
2. Batch A：英雄、植物、敌人、Boss；
3. Batch B：地图、投射物、特效；
4. Batch C：UI 图标；
5. Batch D：Boss 二阶段与打磨。

## 13.5 验收标准

- 没有资源也能运行；
- P0 单位全部可视；
- 资源路径集中管理；
- image-gen prompt 可复现；
- 游戏内大小合理；
- 不使用侵权视觉资源。

## 13.6 Codex Prompt

```md
Task: Phase 13 - Implement the V0.1 art asset pipeline and placeholder integration.

Read ART_DIRECTION_V0_1.md. Create art asset registry, render scale config, placeholder assets or Phaser Graphics fallbacks, asset status docs, and image generation prompt sheets. Integrate P0 assets into Phaser rendering. If image-gen or game-studio tools are available, generate Batch A assets; otherwise mark prompt_ready and keep placeholders.

Do not use copyrighted or unclear external game assets.
```

---

# Phase 14：端到端平衡与打磨

## 14.1 目标

完整跑通一局，修复阻塞问题，根据日志调整初版数值。

## 14.2 读取文档

```text
GAME_DESIGN_V0_1.md
RULES_CORE_LOOP.md
COMBAT_NUMBERS_V0_1.md
NETWORK_SYNC_SPEC.md
ART_DIRECTION_V0_1.md
AUDIO_PIPELINE_V0_1.md
```

## 14.3 实现内容

- 完整端到端试玩；
- 记录一局总时长；
- 记录总阳光获得/消耗；
- 记录弹药购买次数；
- 记录 Boss 战时长；
- 记录 Boss 打断成功率；
- 记录基地剩余 HP；
- 修复严重 bug；
- 调整 Wave/Boss/经济参数；
- 写 `docs/PLAYTEST_REPORT_V0_1.md`。

## 14.4 调参优先级

按 `COMBAT_NUMBERS_V0_1.md`：

1. 敌人数量和刷怪时间；
2. 经济植物产出；
3. 弹药购买价格和冷却；
4. Boss HP；
5. Boss 打断需求；
6. 植物伤害与 HP；
7. 英雄伤害。

## 14.5 验收标准

- 两个本地客户端能完整通关或失败结算；
- 游戏时长在 5–8 分钟；
- Boss 战可理解；
- 不出现严重同步错误；
- 没有关键崩溃；
- Playtest report 存在。

## 14.6 Codex Prompt

```md
Task: Phase 14 - End-to-end playtest, bug fixing, and first balance pass.

Run the full V0.1 loop from lobby to result screen with two local clients. Record metrics: total match time, total sun earned/spent, ammo purchases, plants placed, boss fight duration, boss interrupt success/failure, base HP remaining, player deaths, and critical bugs. Fix blockers and tune only the smallest necessary set of numbers.

Create docs/PLAYTEST_REPORT_V0_1.md.
```

---

# Phase 15：Demo 打包与交付

## 15.1 目标

把 V0.1 整理成可以演示、复现、交给别人试玩的 Demo。

## 15.2 实现内容

- README 完善；
- 环境要求；
- 安装步骤；
- 启动步骤；
- 双开客户端说明；
- 常见问题；
- 已知问题；
- 版本边界；
- 截图或录屏建议；
- asset/license 说明；
- build 脚本。

## 15.3 验收标准

- 新环境能根据 README 跑起来；
- `npm run build` 通过；
- `npm run typecheck` 通过；
- `npm run test` 通过或明确说明未覆盖项；
- license/attribution 文档存在；
- Demo 可完整体验。

## 15.4 Codex Prompt

```md
Task: Phase 15 - Prepare V0.1 demo delivery package.

Create a clear README with setup, install, run, build, and two-client testing instructions. Verify build/typecheck/test. Document known issues, V0.1 scope boundaries, asset/audio license notes, and demo controls. Ensure the project can be handed to another developer or tester.
```

---

## 6. 关键系统实现顺序依赖

### 6.1 强依赖链

```text
shared types/config
  ↓
room + ready
  ↓
GameLoop + snapshot
  ↓
movement
  ↓
planting + economy
  ↓
enemy + plant combat
  ↓
hero gunplay
  ↓
waves
  ↓
evolution
  ↓
boss
  ↓
UI/feedback/results
  ↓
audio/art polish
  ↓
playtest/balance
```

### 6.2 不应提前做的内容

| 不应提前做 | 原因 |
|---|---|
| Boss 美术动画 | Boss 机制未稳定前会返工 |
| 大量音频搜索 | 事件名和 AudioManager 未稳定前会混乱 |
| 多植物 | 三种植物核心未验证 |
| 多武器 | 手枪弹药循环未验证 |
| 局外成长 | 单局循环未验证 |
| 商业 UI | 规则和状态还会变 |

---

## 7. Codex 任务验收 Gate

每个 Phase 完成必须通过一个 Gate。

### 7.1 Gate 格式

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

### 7.2 不能进入下一 Phase 的情况

如果出现以下问题，不允许继续下一阶段：

- typecheck 失败；
- server 启动失败；
- client 启动失败；
- 两人房间不可用；
- GameLoop 不稳定；
- snapshot 崩溃；
- sharedSun 能变负数；
- 客户端能篡改权威状态；
- 种植/射击核心请求没有 rejected path；
- Boss 打断由客户端直接决定。

---

## 8. 测试策略

### 8.1 单元测试优先对象

优先测试纯逻辑：

| 系统 | 测试内容 |
|---|---|
| EconomySystem | 阳光增加、扣除、不变负 |
| PlantSystem | 种植合法性、同格拒绝、距离拒绝 |
| WeaponSystem | 弹药、射速、换弹、买弹药 |
| WaveSystem | 刷怪时间、波次完成、进化解锁 |
| BossSystem | 阶段转换、打断、冲锋结果 |
| MatchStateMachine | 状态转移合法性 |

### 8.2 集成测试优先对象

| 测试 | 目标 |
|---|---|
| 双人创建/加入 | 房间稳定 |
| ready 到 countdown | 状态机稳定 |
| 种植请求 | sharedSun 和 grid 一致 |
| 射击敌人 | 子弹命中服务器权威 |
| Wave 1 完成 | 波次推进 |
| Boss 打断 | 关键机制成立 |

### 8.3 手工测试清单

每次大阶段后至少手工检查：

- 双开浏览器；
- 创建/加入房间；
- ready；
- 移动同步；
- 种植物；
- 阳光变化；
- 敌人进攻；
- 射击和换弹；
- 买弹药；
- 进化；
- Boss；
- 结算。

---

## 9. Debug 工具要求

### 9.1 Client Debug Overlay

至少显示：

- FPS；
- ping；
- matchId；
- playerId；
- slot；
- matchState；
- serverSeq；
- sharedSun；
- currentWave；
- player position；
- entity counts；
- snapshot buffer size。

### 9.2 Server Debug Logs

至少记录：

- room create/join/leave；
- ready；
- state transition；
- action rejected reason；
- wave start/end；
- Boss phase transition；
- victory/defeat；
- disconnect/reconnect。

### 9.3 Debug Commands

仅开发环境启用：

- addSun；
- spawnEnemy；
- killAllEnemies；
- startBoss；
- damageBoss；
- forceVictory；
- forceDefeat。

正式 demo 默认关闭或隐藏。

---

## 10. 美术与音频介入时机

### 10.1 美术介入原则

美术不应早于 gameplay placeholder。

推荐：

| 阶段 | 美术动作 |
|---|---|
| Phase 0–4 | Phaser Graphics / placeholder 即可 |
| Phase 5–7 | P0 placeholder 全量接入 |
| Phase 8–10 | 生成 Batch A 核心单位候选 |
| Phase 11 | UI icon 和 Boss 表现接入 |
| Phase 13 | 系统化 image-gen 替换 |
| Phase 14 | 游戏内可读性调优 |

### 10.2 音频介入原则

音频应在关键事件稳定后接入。

推荐：

| 阶段 | 音频动作 |
|---|---|
| Phase 0–7 | 不必正式接入 |
| Phase 8–10 | 明确 feedback event |
| Phase 11 | 建立 feedback 映射 |
| Phase 12 | AudioManager + P0 音频 |
| Phase 14 | 混音与节流调整 |

---

## 11. 资源安全规则

### 11.1 美术

Codex 只能使用：

- 自己生成的原创资源；
- placeholder；
- 明确 license 的外部资源。

禁止：

- 复制 PVZ 或其他游戏角色；
- 使用来源不明素材；
- 使用带水印素材；
- 使用不允许商用素材。

### 11.2 音频

Codex 只能使用：

- CC0；
- 明确可商用 royalty-free；
- 需要署名且已记录 attribution 的 CC BY；
- 自制合成音；
- placeholder。

禁止：

- 未知 license；
- 游戏提取音频；
- 影视/动漫/短视频截取；
- 只写 free 但没有授权说明的资源。

---

## 12. 性能目标

### 12.1 V0.1 性能目标

| 项目 | 目标 |
|---|---:|
| 客户端 FPS | 60 FPS，最低不低于 45 |
| 服务端 Tick | 20 Hz |
| Snapshot | 10 Hz |
| 同屏敌人 | 15–25 可稳定 |
| 同屏植物 | 20 可稳定 |
| 同屏子弹 | 30 可稳定 |
| 首次加载 | 本地开发环境可接受，后续优化 |

### 12.2 不需要提前优化

V0.1 不提前做：

- ECS 重构；
- 大规模对象池；
- rollback netcode；
- delta compression；
- GPU 粒子系统；
- 复杂资源 streaming。

只有出现实际瓶颈再优化。

---

## 13. 风险清单与应对

### 13.1 联机状态不同步

风险：客户端显示与服务器事实不一致。

应对：

- 全量 snapshot；
- 服务器权威；
- debug overlay；
- 禁止客户端判定命中。

### 13.2 玩法范围膨胀

风险：Codex 主动加入新系统。

应对：

- 每阶段明确 NOT implement；
- Gate report；
- 新想法进入 V0.2 backlog。

### 13.3 英雄过强

风险：植物失去意义。

应对：

- 弹药限制；
- 买弹药消耗阳光；
- 敌人数量与装甲压力；
- 平衡日志。

### 13.4 经济崩坏

风险：阳光过多或过少。

应对：

- 记录 totalSunEarned/Spent；
- 单次只调一个参数；
- 保持 COMBAT_NUMBERS 可配置。

### 13.5 Boss 太复杂

风险：Boss 卡住开发。

应对：

- 先实现 HP + 弱点 + charge；
- summon/sun suppression 可后补；
- 保持 BossSystem 独立。

### 13.6 资源版权风险

风险：使用侵权美术/音频。

应对：

- image-gen 原创；
- license 文档；
- 可疑资源 reject；
- placeholder fallback。

---

## 14. V0.2 Backlog 规则

任何超出 V0.1 的想法必须进入 backlog，不进入当前实现。

Backlog 示例：

```md
# V0.2_BACKLOG.md

## Candidate Features

- Shotgun weapon
- Ice control plant
- Landmine plant
- Second boss
- Roguelite upgrade pool
- Out-of-run unlocks
- More maps
- Hero classes
- Matchmaking
```

Codex 如果想到新功能，应写入 backlog，而不是直接实现。

---

## 15. 最终 V0.1 Definition of Done

V0.1 完成必须满足以下条件。

### 15.1 玩法完成

- 2 人房间可用；
- 双人 ready 后开局；
- 五路地图可见；
- 双人移动同步；
- 共享阳光可用；
- 三种植物可种植；
- 三种敌人可进攻；
- 植物能攻击；
- 敌人能攻击植物；
- 英雄能射击、换弹、买弹药；
- 5 波完整推进；
- Wave 3 后可进化；
- Boss 两阶段可战斗；
- Boss 冲锋可被打断；
- 胜利/失败可结算。

### 15.2 工程完成

- typecheck 通过；
- build 通过；
- 关键测试通过；
- README 完整；
- docs 更新；
- shared config 使用正常；
- 没有严重 TODO 阻塞；
- 服务器权威边界没有破坏。

### 15.3 资源完成

- P0 美术 placeholder 或 generated 资源可用；
- P0 音频 placeholder 或 verified 资源可用；
- asset status 存在；
- audio license 文档存在；
- attribution 文档存在；
- 不包含明显侵权素材。

### 15.4 可演示完成

- 新用户根据 README 可以启动；
- 双开浏览器可测试；
- 一局能在 5–8 分钟内结束；
- 游戏过程中主要规则可理解；
- Boss 战有明确高潮；
- 失败原因基本可从结算和过程看出。

---

## 16. 给用户的审查建议

用户作为项目负责人，不需要手写代码，但每个 Phase 应重点审查：

| Phase | 用户重点看什么 |
|---|---|
| 0–1 | 结构是否干净，文档是否落地 |
| 2–3 | 房间和状态机是否稳定 |
| 4 | 移动和地图是否舒服 |
| 5 | 共享阳光和种植是否符合合作感 |
| 6 | 防线循环是否成立 |
| 7 | 英雄是否有用但不过强 |
| 8 | 波次节奏是否清晰 |
| 9 | 进化选择是否有意义 |
| 10 | Boss 是否真正需要合作 |
| 11 | UI 是否能看懂 |
| 12 | 音效是否增强反馈，不吵 |
| 13 | 美术是否原创且可读 |
| 14 | 是否愿意再打一局 |
| 15 | 别人能否按 README 跑起来 |

---

## 17. 当前版本最终执行结论

Codex 的核心任务不是“一次生成完整游戏”，而是按阶段把 V0.1 垂直切片打通。

最重要的执行纪律是：

> **先闭环，再扩展；先规则正确，再表现漂亮；先服务器权威，再客户端炫技；先 placeholder 保证可玩，再用 image-gen 和免费音频替换资源。**

只要 Codex 严格按本文档推进，项目就能稳定从设计蓝图进入可玩的 Web 联机 Demo。

