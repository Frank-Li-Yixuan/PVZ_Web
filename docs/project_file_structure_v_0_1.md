# PROJECT_FILE_STRUCTURE_V0_1.md

# 双人合作枪械英雄塔防 V0.1 项目文件结构规范

## 0. 文档目的

本文档定义 V0.1 项目的推荐目录结构、文件职责、模块边界、导入规则、资源目录、配置文件、脚本命名、测试目录和 Codex 创建文件时必须遵守的组织原则。

本文档解决的问题：

- Codex 建项目时目录不能乱；
- client/server/shared 边界必须清楚；
- 战斗数值不能散落；
- 网络消息类型必须共享；
- 美术和音频资源必须可追踪；
- 每个 Phase 该创建哪些文件必须明确；
- 后续扩展 V0.2 时不需要重构整个仓库。

本文档配合以下文档使用：

| 文档 | 作用 |
|---|---|
| `GAME_DESIGN_V0_1.md` | 总玩法设计 |
| `RULES_CORE_LOOP.md` | 核心规则循环 |
| `COMBAT_NUMBERS_V0_1.md` | 数值与波次 |
| `NETWORK_SYNC_SPEC.md` | 联机同步协议 |
| `ART_DIRECTION_V0_1.md` | 美术管线 |
| `AUDIO_PIPELINE_V0_1.md` | 音频管线 |
| `CODEX_IMPLEMENTATION_PLAN.md` | 开发阶段计划 |
| `CODEX_PROMPTS_PHASES_V0_1.md` | Codex 执行 Prompt 包 |

---

## 1. 总体结构原则

### 1.1 Monorepo 原则

V0.1 使用单仓库结构：

```text
project-root/
  client/
  server/
  shared/
  assets/
  docs/
  codex_prompts/
  tools/
  package.json
  README.md
```

原因：

- client 和 server 需要共享类型；
- 游戏数值要统一；
- Codex 更容易跨模块修改；
- 本地双开调试方便；
- V0.1 项目规模不需要拆多仓库。

### 1.2 三层代码边界

| 层 | 职责 |
|---|---|
| `client/` | Phaser 渲染、输入、UI、音频、资源加载、网络客户端 |
| `server/` | 房间、权威 GameLoop、玩法系统、状态机、快照广播 |
| `shared/` | 类型、枚举、配置、纯工具函数 |

### 1.3 资源与文档独立

| 目录 | 职责 |
|---|---|
| `assets/` | 美术、音频、资源状态表、license 文档 |
| `docs/` | 设计文档、技术规范、测试报告 |
| `codex_prompts/` | 给 Codex 直接执行的 Prompt 包 |
| `tools/` | 构建、资源处理、校验脚本 |

---

## 2. 推荐完整目录树

```text
project-root/
  README.md
  package.json
  package-lock.json / pnpm-lock.yaml
  tsconfig.base.json
  .gitignore
  .env.example

  docs/
    GAME_DESIGN_V0_1.md
    RULES_CORE_LOOP.md
    COMBAT_NUMBERS_V0_1.md
    NETWORK_SYNC_SPEC.md
    ART_DIRECTION_V0_1.md
    AUDIO_PIPELINE_V0_1.md
    CODEX_IMPLEMENTATION_PLAN.md
    CODEX_PROMPTS_PHASES_V0_1.md
    PROJECT_FILE_STRUCTURE_V0_1.md
    PLAYTEST_REPORT_V0_1.md
    V0_2_BACKLOG.md

  codex_prompts/
    00_MUST_READ_BEFORE_ANY_TASK.md
    00A_REPOSITORY_STATUS_CHECK.md
    00B_STABILIZE_CURRENT_PHASE.md
    01_PHASE_0_BOOTSTRAP.md
    02_PHASE_1_SHARED_TYPES_CONFIG.md
    03_PHASE_2_ROOM_READY.md
    04_PHASE_3_STATE_MACHINE_GAMELOOP.md
    05_PHASE_4_MAP_MOVEMENT.md
    06_PHASE_5_ECONOMY_PLANTING.md
    07_PHASE_6_ENEMIES_DEFENSE_LOOP.md
    08_PHASE_7_HERO_GUNPLAY.md
    09_PHASE_8_WAVES.md
    10_PHASE_9_EVOLUTION.md
    11_PHASE_10_BOSS.md
    12_PHASE_11_UI_RESULTS.md
    13_PHASE_12_AUDIO.md
    14_PHASE_13_ART.md
    15_PHASE_14_PLAYTEST_BALANCE.md
    16_PHASE_15_DEMO_DELIVERY.md

  shared/
    package.json
    tsconfig.json
    src/
      index.ts
      types/
        enums.ts
        entities.ts
        state.ts
        messages.ts
        network.ts
        events.ts
        stats.ts
      config/
        combatNumbers.ts
        wavesV01.ts
        networkTiming.ts
        mapConfig.ts
        difficulty.ts
      utils/
        math.ts
        id.ts
        time.ts
        random.ts
      validation/
        actionValidation.ts
        snapshotValidation.ts
    tests/
      combatNumbers.test.ts
      wavesV01.test.ts
      mapConfig.test.ts

  server/
    package.json
    tsconfig.json
    src/
      index.ts
      env.ts
      net/
        socketServer.ts
        messageHandlers.ts
        sessionManager.ts
        roomTransport.ts
      game/
        rooms/
          RoomManager.ts
          GameRoom.ts
          PlayerSession.ts
        loop/
          GameLoop.ts
          TickScheduler.ts
        state/
          createInitialGameState.ts
          GameStateStore.ts
          snapshotBuilder.ts
          matchStateMachine.ts
        systems/
          EconomySystem.ts
          PlantSystem.ts
          PlantCombatSystem.ts
          EnemySystem.ts
          ProjectileSystem.ts
          HeroSystem.ts
          WeaponSystem.ts
          WaveSystem.ts
          EvolutionSystem.ts
          BossSystem.ts
          StatsSystem.ts
          FeedbackSystem.ts
        rules/
          actionGuards.ts
          collisionRules.ts
          damageRules.ts
          targetingRules.ts
          winLossRules.ts
        debug/
          debugCommands.ts
          debugLogger.ts
      tests/
        economySystem.test.ts
        plantSystem.test.ts
        weaponSystem.test.ts
        waveSystem.test.ts
        bossSystem.test.ts
        matchStateMachine.test.ts

  client/
    package.json
    tsconfig.json
    vite.config.ts
    index.html
    public/
      favicon.png
    src/
      main.ts
      game.ts
      scenes/
        BootScene.ts
        PreloadScene.ts
        LobbyScene.ts
        BattleScene.ts
        ResultScene.ts
      net/
        socketClient.ts
        networkEvents.ts
        snapshotStore.ts
        snapshotInterpolator.ts
        clientPrediction.ts
        feedbackEventRouter.ts
      input/
        InputManager.ts
        keyBindings.ts
        pointerAim.ts
      rendering/
        renderLayers.ts
        entityRenderer.ts
        mapRenderer.ts
        projectileRenderer.ts
        effectsRenderer.ts
        interpolation.ts
      ui/
        Hud.ts
        LobbyPanel.ts
        PlantSelector.ts
        AmmoPanel.ts
        EvolutionPanel.ts
        BossPanel.ts
        ToastManager.ts
        ResultPanel.ts
        DebugOverlay.ts
        ControlsHelp.ts
      audio/
        AudioManager.ts
        audioRegistry.ts
        audioEvents.ts
        audioBuses.ts
      assets/
        artAssetRegistry.ts
        renderScaleV01.ts
        assetPreloader.ts
      debug/
        clientDebugCommands.ts
        debugFlags.ts
      styles/
        ui.css
    tests/
      snapshotInterpolator.test.ts
      audioRegistry.test.ts

  assets/
    art/
      source_prompts/
        image_gen_prompts_v0_1.md
      concepts/
        heroes/
        plants/
        enemies/
        boss/
        environment/
      sprites/
        heroes/
        plants/
        enemies/
        boss/
        projectiles/
        effects/
        environment/
        ui/
      placeholders/
        heroes/
        plants/
        enemies/
        boss/
        projectiles/
        effects/
        environment/
        ui/
      exports/
        atlas/
    audio/
      raw/
        sfx/
        music/
        ui/
        boss/
        enemies/
        weapons/
        plants/
      processed/
        sfx/
        music/
        ui/
      temp/
      docs/
        audio_asset_status_v0_1.md
        audio_licenses_v0_1.md
        attribution_v0_1.md
    docs/
      asset_status_v0_1.md

  tools/
    scripts/
      validateAssets.ts
      validateAudioLicenses.ts
      generatePlaceholderArt.ts
      buildAssetManifest.ts
      checkNoHardcodedNumbers.ts
    ffmpeg/
      convert_audio_examples.md
```

---

## 3. 根目录文件职责

### 3.1 `package.json`

根目录 `package.json` 负责统一脚本。

建议 scripts：

```json
{
  "scripts": {
    "dev:client": "npm --workspace client run dev",
    "dev:server": "npm --workspace server run dev",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "build": "npm --workspace shared run build && npm --workspace server run build && npm --workspace client run build",
    "typecheck": "npm --workspace shared run typecheck && npm --workspace server run typecheck && npm --workspace client run typecheck",
    "test": "npm --workspaces run test",
    "lint": "npm --workspaces run lint",
    "validate:assets": "tsx tools/scripts/validateAssets.ts",
    "validate:audio": "tsx tools/scripts/validateAudioLicenses.ts"
  }
}
```

### 3.2 `tsconfig.base.json`

统一 TypeScript 基础配置。

建议启用：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
```

### 3.3 `.env.example`

V0.1 不需要复杂 secret，但应保留示例：

```text
SERVER_PORT=3001
CLIENT_PORT=5173
CLIENT_VERSION=0.1.0
NODE_ENV=development
ENABLE_DEBUG_COMMANDS=true
```

### 3.4 `.gitignore`

必须忽略：

```text
node_modules/
dist/
build/
.env
.DS_Store
*.log
coverage/
assets/audio/temp/
```

不要忽略：

- docs；
- codex_prompts；
- asset status；
- license 文档；
- source prompts。

---

## 4. docs 目录规范

### 4.1 docs 必备文件

| 文件 | 责任 |
|---|---|
| `GAME_DESIGN_V0_1.md` | 总玩法设计 |
| `RULES_CORE_LOOP.md` | 核心循环与规则执行 |
| `COMBAT_NUMBERS_V0_1.md` | 数值、波次、Boss 时间轴 |
| `NETWORK_SYNC_SPEC.md` | 联机协议与同步边界 |
| `ART_DIRECTION_V0_1.md` | 美术方向与 image-gen 管线 |
| `AUDIO_PIPELINE_V0_1.md` | 音频资源与 license 管线 |
| `CODEX_IMPLEMENTATION_PLAN.md` | 分阶段施工计划 |
| `CODEX_PROMPTS_PHASES_V0_1.md` | Codex 可复制 Prompt 包 |
| `PROJECT_FILE_STRUCTURE_V0_1.md` | 文件结构规范 |
| `PLAYTEST_REPORT_V0_1.md` | 试玩与调参报告 |
| `V0_2_BACKLOG.md` | 超出 V0.1 的功能收集 |

### 4.2 docs 更新规则

Codex 修改系统时，必须同步更新相关文档：

| 修改类型 | 必须更新 |
|---|---|
| 改玩法规则 | `RULES_CORE_LOOP.md` |
| 改数值 | `COMBAT_NUMBERS_V0_1.md` |
| 改网络消息 | `NETWORK_SYNC_SPEC.md` |
| 改美术资源 | `ART_DIRECTION_V0_1.md` 或 asset status |
| 改音频资源 | `AUDIO_PIPELINE_V0_1.md` 或 audio status |
| 改阶段计划 | `CODEX_IMPLEMENTATION_PLAN.md` |
| 新功能延期 | `V0_2_BACKLOG.md` |

### 4.3 文档命名规则

- V0.1 文档使用大写 snake case：`SOMETHING_V0_1.md`
- Prompt 文件使用数字前缀：`01_PHASE_0_BOOTSTRAP.md`
- 报告文件使用用途名：`PLAYTEST_REPORT_V0_1.md`

---

## 5. codex_prompts 目录规范

### 5.1 目录目的

`codex_prompts/` 存放可直接复制给 Codex 执行的 Prompt。

不放普通设计文档。

### 5.2 文件拆分

虽然 `CODEX_PROMPTS_PHASES_V0_1.md` 已包含所有 Prompt，但为了实际使用方便，可以拆成多个文件。

推荐：

| 文件 | 用途 |
|---|---|
| `00_MUST_READ_BEFORE_ANY_TASK.md` | 每次新会话必读 |
| `00A_REPOSITORY_STATUS_CHECK.md` | 检查当前进度 |
| `00B_STABILIZE_CURRENT_PHASE.md` | 修复失败阶段 |
| `01_PHASE_0_BOOTSTRAP.md` | Phase 0 |
| `02_PHASE_1_SHARED_TYPES_CONFIG.md` | Phase 1 |
| ... | ... |
| `16_PHASE_15_DEMO_DELIVERY.md` | Phase 15 |

### 5.3 Prompt 文件格式

每个 Prompt 文件应包含：

```md
# Prompt Name

## When to use

## Required docs

## Task

## Must implement

## Must not implement

## Validation

## Required Gate Report
```

---

## 6. shared 目录规范

## 6.1 shared 的定位

`shared/` 是 client 和 server 的共同契约层。

只允许放：

- 类型；
- 枚举；
- 配置；
- 纯函数；
- 轻量 validation；
- 不依赖 Phaser；
- 不依赖 Socket.IO server runtime；
- 不依赖 Node-only API，除非明确服务端专用。

### 6.2 shared 禁止内容

禁止在 shared 中放：

- Phaser scene；
- DOM 操作；
- Socket.IO 实例；
- server room class；
- client UI；
- 文件系统读写；
- 音频播放；
- 图片加载。

### 6.3 `shared/src/types/enums.ts`

职责：定义稳定枚举与 union type。

应包含：

```ts
export type MatchState = ...;
export type RoomState = ...;
export type PlayerSlot = 0 | 1;
export type PlantType = "sunbloom" | "peashotter" | "barkwall";
export type EnemyType = "shambler" | "runner" | "brute";
export type EvolutionPath = "firepower" | "control" | "support";
export type BossType = "ironmaw_siege_beast";
```

### 6.4 `shared/src/types/entities.ts`

职责：定义实体状态类型。

应包含：

- `PlayerState`
- `PlantState`
- `EnemyState`
- `BulletState`
- `BossState`
- `BaseState`
- `EconomyState`
- `WaveState`

### 6.5 `shared/src/types/state.ts`

职责：定义 `GameStateSnapshot` 和整体状态。

应包含：

- `GameStateSnapshot`
- `MatchTimeState`
- `RoomStatePayload`

### 6.6 `shared/src/types/messages.ts`

职责：定义 C2S/S2C payload。

应包含：

- `CreateRoomRequest`
- `JoinRoomRequest`
- `MoveInputPayload`
- `AimInputPayload`
- `ShootRequestPayload`
- `PlantRequestPayload`
- `BuyAmmoRequestPayload`
- `EvolveRequestPayload`
- `ActionAcceptedPayload`
- `ActionRejectedPayload`

### 6.7 `shared/src/types/network.ts`

职责：定义 envelope、event names、network timing 相关类型。

应包含：

- `ClientMessageEnvelope<T>`
- `ServerMessageEnvelope<T>`
- `C2S`
- `S2C`
- `NetworkWarningReason`

### 6.8 `shared/src/types/events.ts`

职责：定义表现事件与反馈事件。

应包含：

- `FeedbackEvent`
- `MatchPhaseChangedEvent`
- `SunChangeEvent`
- `PlayerConnectionChangedEvent`

### 6.9 `shared/src/types/stats.ts`

职责：定义结算统计。

应包含：

- `MatchStats`
- `PlayerStats`
- `PlayerLiveStats`

### 6.10 `shared/src/config/combatNumbers.ts`

职责：唯一战斗数值来源。

禁止：

- 在 server/client 里重复硬编码相同数值；
- 在系统文件里写 magic number。

### 6.11 `shared/src/config/wavesV01.ts`

职责：Wave 1–5 刷怪脚本。

必须从 `COMBAT_NUMBERS_V0_1.md` 对齐。

### 6.12 `shared/src/config/networkTiming.ts`

职责：网络 tick 和 snapshot 频率。

### 6.13 `shared/src/config/mapConfig.ts`

职责：地图格子、路线、坐标计算的配置。

建议包含：

```ts
export const MapConfigV01 = {
  laneCount: 5,
  columnCount: 7,
  cellWidth: 96,
  laneHeight: 72,
  mapBounds: {...},
  baseX: ...,
  enemySpawnX: ...,
} as const;
```

### 6.14 `shared/src/utils/`

只能放纯函数。

推荐：

| 文件 | 职责 |
|---|---|
| `math.ts` | clamp、distance、normalize |
| `id.ts` | ID 类型辅助，不一定生成真实 ID |
| `time.ts` | 秒/毫秒转换 |
| `random.ts` | seed random 或随机辅助 |

---

## 7. server 目录规范

## 7.1 server 定位

`server/` 是权威世界。

它决定：

- 房间；
- 玩家身份；
- GameLoop；
- 所有核心玩法状态；
- 命中；
- 阳光；
- Boss；
- 胜负。

### 7.2 server 禁止内容

禁止在 server 放：

- Phaser 渲染；
- DOM/UI；
- 音频播放；
- image-gen 逻辑；
- 浏览器 localStorage；
- 客户端预测逻辑。

### 7.3 `server/src/index.ts`

职责：服务端入口。

应做：

- 读取 env；
- 创建 HTTP server；
- 初始化 Socket.IO；
- 初始化 RoomManager；
- 启动监听；
- 输出启动日志。

不应做：

- 直接写大量 Socket handler；
- 直接写玩法逻辑。

### 7.4 `server/src/env.ts`

职责：读取和校验环境变量。

建议变量：

```ts
SERVER_PORT
CLIENT_VERSION
ENABLE_DEBUG_COMMANDS
NODE_ENV
```

### 7.5 `server/src/net/socketServer.ts`

职责：创建 Socket.IO 服务和绑定连接生命周期。

不放具体玩法逻辑。

### 7.6 `server/src/net/messageHandlers.ts`

职责：把网络消息分发给 room/game systems。

例如：

- `room.create` → RoomManager.createRoom
- `action.plant` → GameRoom.handlePlantRequest

### 7.7 `server/src/net/sessionManager.ts`

职责：维护 socketId、playerId、reconnectToken 的绑定。

防止客户端伪造 playerId。

### 7.8 `server/src/game/rooms/RoomManager.ts`

职责：管理所有房间。

应包含：

- createRoom；
- joinRoom；
- leaveRoom；
- getRoom；
- cleanupRoom；
- reject full room；
- reconnect。

### 7.9 `server/src/game/rooms/GameRoom.ts`

职责：单个房间的聚合根。

它拥有：

- players；
- GameState；
- GameLoop；
- systems；
- message entry points；
- broadcast 方法。

GameRoom 可以协调系统，但不要把所有系统逻辑都写在 GameRoom 里。

### 7.10 `server/src/game/rooms/PlayerSession.ts`

职责：表示玩家连接状态。

包含：

- playerId；
- socketId；
- slot；
- ready；
- connected；
- reconnectToken；
- lastSeenAt。

---

## 8. server/game/loop 规范

### 8.1 `GameLoop.ts`

职责：固定 Tick 更新。

推荐顺序必须对齐 `RULES_CORE_LOOP.md`：

```text
1. apply inputs
2. update movement
3. process actions
4. update wave/boss
5. update plants
6. update projectiles
7. update enemies
8. update win/loss
9. build/broadcast snapshot
```

### 8.2 `TickScheduler.ts`

职责：处理 setInterval 或更稳的固定步长循环。

V0.1 可以简单实现，但必须避免重复启动多个 loop。

---

## 9. server/game/state 规范

### 9.1 `createInitialGameState.ts`

职责：根据 players 和 config 创建初始权威状态。

### 9.2 `GameStateStore.ts`

职责：持有可变 GameState。

如果 V0.1 简化，也可以由 GameRoom 持有，但推荐独立。

### 9.3 `snapshotBuilder.ts`

职责：从权威状态构建 `GameStateSnapshot`。

注意：snapshot 可以不暴露服务端内部字段。

### 9.4 `matchStateMachine.ts`

职责：管理 MatchState 合法转移。

禁止系统文件随意直接改 `matchState`。

推荐提供：

```ts
transitionTo(nextState, reason)
canTransitionTo(nextState)
getStateElapsedSeconds()
```

---

## 10. server/game/systems 规范

### 10.1 系统总原则

每个 System 只负责一个领域。

系统之间通过 GameState 协作，不应互相形成复杂循环依赖。

### 10.2 `EconomySystem.ts`

职责：共享阳光。

负责：

- addSun；
- spendSun；
- sun change log；
- prevent negative sun；
- sun suppression check。

不负责：

- 具体植物 AI；
- UI；
- 音效播放。

### 10.3 `PlantSystem.ts`

职责：种植与植物生命周期。

负责：

- plant request validation；
- create plant；
- cell occupancy；
- plant death release cell。

不负责：

- peashotter 攻击，建议放 `PlantCombatSystem`。

### 10.4 `PlantCombatSystem.ts`

职责：植物攻击。

负责：

- sunbloom production tick 可放 Economy 或 PlantCombat，推荐 Economy 调用 plant production；
- peashotter target selection；
- pea projectile spawn；
- plant attack cooldown。

### 10.5 `EnemySystem.ts`

职责：敌人移动、攻击、突破基地、死亡。

负责：

- enemy movement；
- attack plant；
- contact hero damage；
- base damage；
- death and sun drop。

### 10.6 `ProjectileSystem.ts`

职责：投射物移动与命中。

负责：

- hero bullet movement；
- pea projectile movement；
- collision；
- damage application；
- bullet lifetime；
- Boss weakpoint hit routing。

### 10.7 `HeroSystem.ts`

职责：玩家英雄状态。

负责：

- movement；
- HP；
- damage；
- death；
- respawn；
- invulnerability。

### 10.8 `WeaponSystem.ts`

职责：枪械和弹药。

负责：

- shoot validation；
- fire rate；
- ammo；
- reload；
- buyAmmo；
- weapon modifiers。

### 10.9 `WaveSystem.ts`

职责：普通波次。

负责：

- wave prep；
- spawn schedule；
- wave clear；
- evolution unlock；
- transition to boss prep。

### 10.10 `EvolutionSystem.ts`

职责：英雄进化。

负责：

- action.evolve；
- apply modifier；
- one-time enforcement；
- support/firepower/control logic hooks。

### 10.11 `BossSystem.ts`

职责：Boss 战。

负责：

- spawn；
- phase 1；
- phase 2；
- weakpoint；
- hammer slam；
- summon；
- charge；
- interrupt；
- sun suppression；
- boss death。

### 10.12 `StatsSystem.ts`

职责：统计。

负责：

- damage；
- kills；
- shots；
- purchases；
- plants placed；
- deaths；
- final result。

### 10.13 `FeedbackSystem.ts`

职责：生成表现事件。

注意：服务端不播放音频，只发送 feedback event。

---

## 11. server/game/rules 规范

`rules/` 放跨系统纯规则，避免重复写。

### 11.1 `actionGuards.ts`

职责：动作合法性公共检查。

例如：

- player alive；
- match state allows action；
- cooldown ready。

### 11.2 `collisionRules.ts`

职责：碰撞与距离判断。

### 11.3 `damageRules.ts`

职责：统一伤害应用辅助。

### 11.4 `targetingRules.ts`

职责：目标选择。

例如 peashotter 选最近基地的敌人。

### 11.5 `winLossRules.ts`

职责：胜负判定。

包括同 Tick 胜负冲突：失败优先。

---

## 12. client 目录规范

## 12.1 client 定位

`client/` 负责表现和交互。

允许：

- Phaser；
- UI；
- 输入；
- 音频；
- 资源加载；
- snapshot 插值；
- 本地轻量预测。

禁止：

- 决定命中；
- 扣阳光；
- 生成权威植物；
- 判定 Boss 打断；
- 判定胜负；
- 修改服务器权威状态。

### 12.2 `client/src/main.ts`

职责：浏览器入口，创建 Phaser game。

### 12.3 `client/src/game.ts`

职责：Phaser Game config。

包括：

- canvas size；
- physics 设置；
- scenes 注册；
- background color。

---

## 13. client/scenes 规范

### 13.1 `BootScene.ts`

职责：最早启动，做极少初始化。

### 13.2 `PreloadScene.ts`

职责：加载 assets。

应使用：

- artAssetRegistry；
- audioRegistry；
- fallback 机制。

### 13.3 `LobbyScene.ts`

职责：房间创建/加入/ready UI。

### 13.4 `BattleScene.ts`

职责：主战斗场景。

协调：

- input；
- renderers；
- HUD；
- network snapshot；
- audio feedback。

不要把所有渲染细节写死在 BattleScene。

### 13.5 `ResultScene.ts`

职责：胜负结算界面。

---

## 14. client/net 规范

### 14.1 `socketClient.ts`

职责：Socket.IO client 初始化与连接。

### 14.2 `networkEvents.ts`

职责：客户端事件绑定。

### 14.3 `snapshotStore.ts`

职责：保存最近 snapshots。

### 14.4 `snapshotInterpolator.ts`

职责：按插值延迟读取渲染状态。

### 14.5 `clientPrediction.ts`

职责：本地玩家移动轻量预测。

不能预测权威结果。

### 14.6 `feedbackEventRouter.ts`

职责：把服务器 feedback event 路由到：

- audio；
- VFX；
- UI toast；
- screen shake。

---

## 15. client/input 规范

### 15.1 `InputManager.ts`

职责：统一采集输入并发网络请求。

包括：

- WASD；
- mouse aim；
- left click shoot；
- R reload；
- Q buyAmmo；
- 1/2/3 plant select；
- E plant；
- F evolution；
- Space ready。

### 15.2 `keyBindings.ts`

职责：集中管理键位。

### 15.3 `pointerAim.ts`

职责：鼠标坐标转世界坐标。

---

## 16. client/rendering 规范

### 16.1 `renderLayers.ts`

职责：统一图层顺序。

推荐：

```text
background
laneGrid
plants
enemies
boss
players
projectiles
fx
ui
```

### 16.2 `entityRenderer.ts`

职责：根据 snapshot 渲染玩家、植物、敌人、Boss。

### 16.3 `mapRenderer.ts`

职责：渲染地图、路线、格子、基地。

### 16.4 `projectileRenderer.ts`

职责：渲染子弹和豌豆弹。

### 16.5 `effectsRenderer.ts`

职责：渲染短特效。

### 16.6 `interpolation.ts`

职责：位置插值函数。

---

## 17. client/ui 规范

### 17.1 UI 文件职责

| 文件 | 职责 |
|---|---|
| `Hud.ts` | 战斗 HUD 聚合 |
| `LobbyPanel.ts` | 房间 UI |
| `PlantSelector.ts` | 植物选择 |
| `AmmoPanel.ts` | 弹药显示 |
| `EvolutionPanel.ts` | 进化选择 |
| `BossPanel.ts` | Boss 血条、打断条 |
| `ToastManager.ts` | 操作失败提示 |
| `ResultPanel.ts` | 结算统计 |
| `DebugOverlay.ts` | 调试信息 |
| `ControlsHelp.ts` | 操作帮助 |

### 17.2 UI 禁止事项

UI 不能直接改 GameState。

UI 只能：

- 显示 snapshot；
- 发起 action request；
- 显示反馈。

---

## 18. client/audio 规范

### 18.1 文件职责

| 文件 | 职责 |
|---|---|
| `AudioManager.ts` | 播放、音量、节流、fallback |
| `audioRegistry.ts` | 音频资源映射 |
| `audioEvents.ts` | AudioEventId 类型与常量 |
| `audioBuses.ts` | master/sfx/music/ui bus |

### 18.2 AudioManager 禁止事项

AudioManager 不做：

- 网络判断；
- 玩法规则；
- license 管理；
- 下载音频。

---

## 19. client/assets 规范

### 19.1 `artAssetRegistry.ts`

职责：集中记录 art key 到路径。

### 19.2 `renderScaleV01.ts`

职责：集中记录显示缩放。

### 19.3 `assetPreloader.ts`

职责：统一 preload art/audio。

### 19.4 禁止事项

不允许在各个 renderer 中到处写：

```ts
this.load.image("xxx", "random/path.png")
```

必须通过 registry。

---

## 20. assets/art 目录规范

### 20.1 source_prompts

保存 image-gen prompt。

核心文件：

```text
assets/art/source_prompts/image_gen_prompts_v0_1.md
```

### 20.2 concepts

保存概念图。

不一定直接进游戏。

### 20.3 sprites

保存最终游戏内使用图片。

### 20.4 placeholders

保存占位资源。

任何 P0 资源缺失时，必须有 placeholder。

### 20.5 exports/atlas

后续用于 spritesheet/atlas。

V0.1 可以为空。

---

## 21. assets/audio 目录规范

### 21.1 raw

保存原始下载文件。

### 21.2 processed

保存游戏内使用文件。

### 21.3 temp

临时处理文件。

可以忽略提交，但不要把 license 文档放 temp。

### 21.4 docs

必须包含：

- `audio_asset_status_v0_1.md`
- `audio_licenses_v0_1.md`
- `attribution_v0_1.md`

---

## 22. tools 目录规范

### 22.1 tools/scripts

工具脚本放这里。

推荐：

| 文件 | 职责 |
|---|---|
| `validateAssets.ts` | 检查 asset_status 和文件存在 |
| `validateAudioLicenses.ts` | 检查真实音频是否有 license |
| `generatePlaceholderArt.ts` | 生成简单 placeholder |
| `buildAssetManifest.ts` | 生成资源 manifest |
| `checkNoHardcodedNumbers.ts` | 粗查 magic numbers |

### 22.2 tools/ffmpeg

保存音频处理说明，不保存大型工具二进制。

---

## 23. 测试目录规范

### 23.1 shared/tests

测试配置与纯函数。

优先测试：

- combatNumbers 基本完整性；
- wavesV01 时间排序；
- mapConfig 坐标；
- enum/type helper。

### 23.2 server/tests

测试权威逻辑。

优先测试：

- EconomySystem；
- PlantSystem；
- WeaponSystem；
- WaveSystem；
- BossSystem；
- MatchStateMachine。

### 23.3 client/tests

测试无 Phaser 重依赖的纯逻辑。

优先测试：

- snapshot interpolation；
- audio registry；
- input mapping；
- asset registry。

### 23.4 不强求的测试

V0.1 不强求：

- 完整 E2E 浏览器自动化；
- 视觉回归测试；
- 大规模压力测试。

但 Phase 14 必须手工端到端测试。

---

## 24. 导入规则

### 24.1 允许导入方向

```text
client -> shared
server -> shared
client -> assets paths through registry
server -> no client import
shared -> no client/server import
```

### 24.2 禁止导入方向

禁止：

```text
shared -> client
shared -> server
server -> client
client -> server
```

### 24.3 具体规则

| 模块 | 可以 import | 不可以 import |
|---|---|---|
| client | shared, client 内部模块 | server 内部模块 |
| server | shared, server 内部模块 | client 内部模块 |
| shared | shared 内部纯模块 | Phaser, Socket.IO 实例, fs, DOM |
| tools | shared, Node utils | client runtime 内部状态 |

### 24.4 路径别名建议

可配置：

```text
@shared/* -> shared/src/*
@client/* -> client/src/*
@server/* -> server/src/*
```

注意：路径别名必须在 tsconfig/vite/server build 中一致。

---

## 25. 文件命名规范

### 25.1 TypeScript 文件

推荐：

- 类文件使用 PascalCase：`GameRoom.ts`
- 普通模块使用 camelCase：`snapshotBuilder.ts`
- 配置使用 camelCase：`combatNumbers.ts`
- 类型文件使用小写描述：`entities.ts`

### 25.2 Markdown 文件

- 设计文档大写：`GAME_DESIGN_V0_1.md`
- Prompt 文件数字前缀：`01_PHASE_0_BOOTSTRAP.md`
- 报告文件描述清楚：`PLAYTEST_REPORT_V0_1.md`

### 25.3 资源文件

使用小写 snake_case：

```text
hero_ranger_a_idle.png
sfx_weapon_pistol_shot_01.ogg
ui_icon_sun.png
```

---

## 26. 配置与 magic number 规则

### 26.1 所有战斗数值必须来自 config

例如：

- hero HP；
- movement speed；
- plant cost；
- enemy HP；
- Boss cooldown；
- ammo size。

### 26.2 可以写在代码中的数值

允许少量表现层常量：

- UI padding；
- text font size；
- debug overlay position；
- animation tween duration。

但如果影响玩法，必须进入 shared config。

### 26.3 推荐检查

`tools/scripts/checkNoHardcodedNumbers.ts` 可粗查 server/game 中出现的可疑 magic numbers。

V0.1 不强制完美，但 Codex 不应大量硬编码玩法数值。

---

## 27. Phase 对应文件创建清单

### 27.1 Phase 0

创建：

```text
package.json
tsconfig.base.json
README.md
client/
server/
shared/
docs/
assets/
tools/
```

### 27.2 Phase 1

创建：

```text
shared/src/types/*
shared/src/config/*
shared/src/utils/*
```

### 27.3 Phase 2

创建：

```text
server/src/net/*
server/src/game/rooms/*
client/src/net/socketClient.ts
client/src/scenes/LobbyScene.ts
client/src/ui/LobbyPanel.ts
```

### 27.4 Phase 3

创建：

```text
server/src/game/loop/*
server/src/game/state/*
client/src/net/snapshotStore.ts
client/src/ui/DebugOverlay.ts
```

### 27.5 Phase 4

创建：

```text
client/src/scenes/BattleScene.ts
client/src/input/*
client/src/rendering/mapRenderer.ts
client/src/rendering/entityRenderer.ts
server/src/game/systems/HeroSystem.ts
```

### 27.6 Phase 5

创建：

```text
server/src/game/systems/EconomySystem.ts
server/src/game/systems/PlantSystem.ts
client/src/ui/PlantSelector.ts
client/src/ui/ToastManager.ts
```

### 27.7 Phase 6

创建：

```text
server/src/game/systems/EnemySystem.ts
server/src/game/systems/PlantCombatSystem.ts
server/src/game/systems/ProjectileSystem.ts
client/src/rendering/projectileRenderer.ts
client/src/rendering/effectsRenderer.ts
```

### 27.8 Phase 7

创建：

```text
server/src/game/systems/WeaponSystem.ts
client/src/ui/AmmoPanel.ts
```

### 27.9 Phase 8

创建：

```text
server/src/game/systems/WaveSystem.ts
```

### 27.10 Phase 9

创建：

```text
server/src/game/systems/EvolutionSystem.ts
client/src/ui/EvolutionPanel.ts
```

### 27.11 Phase 10

创建：

```text
server/src/game/systems/BossSystem.ts
client/src/ui/BossPanel.ts
```

### 27.12 Phase 11

创建：

```text
server/src/game/systems/StatsSystem.ts
client/src/ui/ResultPanel.ts
client/src/scenes/ResultScene.ts
```

### 27.13 Phase 12

创建：

```text
client/src/audio/*
assets/audio/docs/*
```

### 27.14 Phase 13

创建：

```text
client/src/assets/*
assets/art/source_prompts/*
assets/docs/asset_status_v0_1.md
```

### 27.15 Phase 14

创建：

```text
docs/PLAYTEST_REPORT_V0_1.md
```

### 27.16 Phase 15

更新：

```text
README.md
docs/PLAYTEST_REPORT_V0_1.md
assets/audio/docs/attribution_v0_1.md
```

---

## 28. Debug 文件规范

### 28.1 server debug

`server/src/game/debug/` 只允许开发环境启用。

必须受：

```text
ENABLE_DEBUG_COMMANDS=true
```

控制。

### 28.2 client debug

`client/src/debug/` 可放：

- debug flags；
- console commands；
- overlay helper。

Debug UI 不应影响正式玩法。

---

## 29. 资源状态文件规范

### 29.1 美术状态

文件：

```text
assets/docs/asset_status_v0_1.md
```

必须记录：

- Asset ID；
- Category；
- Priority；
- Status；
- Source；
- Path；
- Notes。

### 29.2 音频状态

文件：

```text
assets/audio/docs/audio_asset_status_v0_1.md
```

必须记录：

- Audio ID；
- Category；
- Priority；
- Status；
- Source；
- License；
- Attribution Required；
- Raw Path；
- Processed Path；
- Notes。

### 29.3 License 文件

文件：

```text
assets/audio/docs/audio_licenses_v0_1.md
assets/audio/docs/attribution_v0_1.md
```

任何真实音频必须记录。

---

## 30. README 必须包含

最终 README 至少包含：

```md
# Project Name

## V0.1 Scope

## Requirements

## Install

## Run Server

## Run Client

## Two-Client Local Test

## Controls

## Gameplay Goal

## Development Scripts

## Asset and Audio License Notes

## Known Issues

## Troubleshooting
```

README 不应夸大项目已完成内容。

---

## 31. Codex 文件创建硬性规则

Codex 创建文件时必须遵守：

1. 先检查是否已有同职责文件；
2. 不重复创建类似文件，如 `GameRoom2.ts`、`newGameRoom.ts`；
3. 不把多个系统塞进一个大文件；
4. 不把玩法数值写死在系统中；
5. 不让 client import server；
6. 不让 shared import client/server；
7. 不把资源 license 写在临时聊天里，必须落到 docs；
8. 不把 V0.2 功能放进 V0.1 目录；
9. 文件名必须可读、稳定；
10. 每阶段结束要列出 files changed。

---

## 32. 架构审查清单

每 2–3 个 Phase 后，检查：

| 检查项 | 通过标准 |
|---|---|
| 目录边界 | client/server/shared 未混乱 |
| 类型共享 | 网络类型来自 shared |
| 数值配置 | 玩法数值来自 shared/config |
| 服务器权威 | client 不判定核心结果 |
| 文件职责 | 没有超级大杂烩文件 |
| 资源状态 | asset/audio status 更新 |
| license | 音频 license 记录完整 |
| Prompt | codex_prompts 与当前计划一致 |
| 测试 | 关键纯逻辑有测试 |
| README | 不落后太多 |

---

## 33. 允许的简化

V0.1 可以接受以下简化：

- placeholder art；
- placeholder audio；
- 全量 snapshot；
- 简单 interpolation；
- 简单 room code；
- 单进程 server；
- 内存房间；
- 无数据库；
- 无账号；
- 无持久化；
- 无正式部署配置。

这些不是缺陷，而是 V0.1 范围控制。

---

## 34. 不允许的偷懒

V0.1 不允许：

- 客户端直接扣阳光；
- 客户端直接判定命中；
- 客户端直接创建权威敌人；
- Boss 打断由客户端请求；
- 胜负由客户端判断；
- 资源 license 不记录；
- 玩法数值到处硬编码；
- 所有逻辑塞进一个文件；
- 跳过 Gate Report；
- 失败后继续下一 Phase。

---

## 35. 当前版本最终结论

V0.1 的文件结构目标不是追求复杂企业级架构，而是建立一个**清晰、可控、可由 Codex 持续推进的工程骨架**。

核心原则：

> `shared` 定规则，`server` 定事实，`client` 做表现，`assets` 管资源，`docs` 管决策，`codex_prompts` 管执行。

只要这个结构稳定，后续增加新植物、新武器、新 Boss、新地图时，都可以在不推翻架构的前提下继续扩展。

