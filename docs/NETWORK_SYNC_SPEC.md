# NETWORK_SYNC_SPEC.md

# 双人合作枪械英雄塔防 V0.1 联机同步规范

## 0. 文档目的

本文档定义 V0.1 的联机同步架构、服务器权威边界、客户端输入协议、服务器广播状态、请求/拒绝格式、房间生命周期、断线处理、基础反作弊规则和 Codex 实现建议。

本文档的目标是让 Codex 可以直接基于该规范实现：

- 2 人房间制联机；
- 服务器权威战斗状态；
- 客户端输入与请求；
- 状态快照广播；
- 客户端插值显示；
- 种植、射击、换弹、买弹药、进化、Boss 打断等关键操作的同步；
- 基础断线/重连处理；
- 端到端调试与验收。

本文档配合以下文档使用：

| 文档 | 作用 |
|---|---|
| `GAME_DESIGN_V0_1.md` | 总玩法设计 |
| `RULES_CORE_LOOP.md` | 核心规则循环 |
| `COMBAT_NUMBERS_V0_1.md` | 数值和波次 |
| `CODEX_IMPLEMENTATION_PLAN.md` | 实现阶段计划 |

---

## 1. 联机架构结论

V0.1 必须采用：

> **服务器权威 Server-Authoritative Room Model**

客户端只负责：

- 采集玩家输入；
- 发送操作意图；
- 渲染服务器状态；
- 做表现层预测和插值；
- 播放 UI、动画、音效。

服务器负责：

- 房间创建和加入；
- 玩家身份与 slot 分配；
- 单局状态机；
- 共享阳光；
- 种植合法性；
- 移动边界；
- 射击频率、弹药、换弹；
- 子弹命中；
- 植物攻击；
- 敌人移动、攻击、死亡；
- Wave 推进；
- Boss 技能、弱点、打断；
- 胜负判定；
- 结算统计。

---

## 2. 技术选择

### 2.1 V0.1 推荐技术栈

| 层 | 推荐 |
|---|---|
| 客户端 | Phaser 3 + TypeScript + Vite |
| 服务端 | Node.js + TypeScript |
| 网络库 | Socket.IO |
| 类型共享 | `shared/` TypeScript package |
| 配置共享 | `shared/config/` |
| 测试 | Vitest |

### 2.2 为什么 V0.1 推荐 Socket.IO

Socket.IO 对 V0.1 更适合，原因：

- 房间 join/leave 简单；
- 事件式消息适合离散请求；
- 本地双开调试容易；
- Codex 更容易生成稳定代码；
- Web 原型开发速度快；
- 后续如果需要更专业状态同步，可迁移到 Colyseus。

### 2.3 暂不做 P2P

V0.1 不采用 P2P。

原因：

- 子弹命中、Boss 打断、共享阳光都需要权威判定；
- P2P 容易状态分歧；
- 防作弊困难；
- Codex 实现难度更高；
- 服务器权威更利于后续扩展。

---

## 3. 网络设计核心原则

### 3.1 服务器权威原则

以下状态永远由服务器决定：

| 状态 | 是否客户端可直接修改 |
|---|---:|
| `sharedSun` | 否 |
| `baseHp` | 否 |
| 玩家真实位置 | 否 |
| 玩家 HP | 否 |
| 弹匣 / 备弹 | 否 |
| 是否成功种植 | 否 |
| 子弹是否命中 | 否 |
| 敌人 HP / 死亡 | 否 |
| 植物 HP / 死亡 | 否 |
| Boss HP / 阶段 | 否 |
| Boss 弱点是否激活 | 否 |
| Boss 是否被打断 | 否 |
| 进化是否成功 | 否 |
| 胜负结果 | 否 |

### 3.2 客户端只发送意图

客户端发送的是：

- 我想往某个方向移动；
- 我想朝某个方向射击；
- 我想换弹；
- 我想在某格种某植物；
- 我想购买弹药；
- 我想选择某个进化路线；
- 我准备好了。

客户端不能发送：

- 我命中了某个敌人；
- 我杀死了某个敌人；
- 我增加了阳光；
- 我打断了 Boss；
- 我赢了。

### 3.3 状态同步优先于帧同步

V0.1 不做严格 lockstep。

采用：

```text
客户端发送输入 / 请求
服务器固定 Tick 更新世界
服务器定期广播 GameStateSnapshot
客户端插值渲染
```

### 3.4 先全量快照，后续再优化增量

V0.1 可以先使用全量快照。

原因：

- 实体数量可控；
- 实现简单；
- 调试方便；
- Codex 更不容易写错。

如果后续实体数量明显增加，再优化为 delta snapshot。

---

## 4. 网络频率目标

### 4.1 推荐频率

| 项目 | 值 |
|---|---:|
| 服务器 Game Tick | 20 Hz |
| 状态快照广播 | 10 Hz，必要时 15–20 Hz |
| 客户端输入发送 | 20 Hz 或输入变化时发送 |
| 客户端渲染帧率 | 60 FPS |
| 客户端插值延迟 | 100–150 ms |
| 心跳 / ping | 5 秒一次 |
| 断线宽限 | 20 秒 |

### 4.2 V0.1 推荐默认值

```ts
export const NetworkTimingV01 = {
  serverTickRate: 20,
  snapshotRate: 10,
  clientInputRate: 20,
  interpolationDelayMs: 120,
  pingIntervalMs: 5000,
  disconnectGraceMs: 20000,
} as const;
```

### 4.3 为什么不是 60Hz 服务器

该游戏不是高强度竞技射击，而是合作塔防动作游戏。

20Hz 服务器 Tick 足以处理：

- 玩家移动；
- 子弹；
- 敌人；
- 植物攻击；
- Boss 技能；
- 共享阳光。

这样能降低实现复杂度和服务器压力。

---

## 5. 目录与共享类型建议

### 5.1 推荐目录

```text
project-root/
  client/
    src/
      net/
        socketClient.ts
        clientPrediction.ts
        snapshotInterpolator.ts
        eventHandlers.ts
      scenes/
      ui/
      entities/
  server/
    src/
      net/
        socketServer.ts
        roomManager.ts
        messageHandlers.ts
      game/
        GameRoom.ts
        GameLoop.ts
        GameState.ts
        systems/
  shared/
    types/
      network.ts
      state.ts
      messages.ts
      enums.ts
    config/
      combatNumbers.ts
      wavesV01.ts
      networkTiming.ts
```

### 5.2 类型共享原则

客户端和服务端必须复用 `shared/types` 中的消息类型。

禁止客户端和服务端分别手写一套 schema。

原因：

- 避免字段名不一致；
- 降低 Codex 后续修改出错概率；
- 便于自动化测试。

---

## 6. 核心 ID 规范

### 6.1 ID 类型

```ts
export type MatchId = string;
export type PlayerId = string;
export type EntityId = string;
export type SocketId = string;
```

### 6.2 Entity ID 生成规则

服务器生成所有实体 ID。

实体包括：

- 玩家；
- 植物；
- 敌人；
- 子弹；
- Boss；
- 临时效果事件。

推荐格式：

```text
player_<shortid>
plant_<increment>
enemy_<increment>
bullet_<increment>
boss_<matchid>
```

### 6.3 客户端临时 ID

V0.1 不要求复杂客户端预测实体 ID。

客户端可以在本地显示临时效果，但正式实体必须以服务器 ID 为准。

例如：

- 客户端点击射击时可以立即播放枪口火光；
- 但正式子弹由服务器 `BulletState` 或 `ServerEvent` 创建。

---

## 7. 房间生命周期

### 7.1 RoomState 枚举

```ts
export type RoomState =
  | "OPEN"
  | "FULL"
  | "COUNTDOWN"
  | "IN_MATCH"
  | "ENDED"
  | "CLOSED";
```

### 7.2 房间流程

```text
Client A -> createRoom
Server -> roomCreated
Client B -> joinRoom
Server -> roomJoined
Both Clients -> setReady(true)
Server -> matchCountdownStarted
Server -> matchStarted
Game Loop runs
Server -> matchEnded
Room remains briefly for result viewing
Server -> closeRoom or returnToLobby
```

### 7.3 玩家 slot

V0.1 固定两个玩家 slot：

```ts
export type PlayerSlot = 0 | 1;
```

服务器分配 slot。

规则：

- 第一个进入房间的玩家通常是 slot 0；
- 第二个进入房间的玩家是 slot 1；
- slot 决定默认出生位置、颜色和 UI 排列；
- slot 不代表权限高低。

### 7.4 房间人数限制

V0.1 每个正式房间最多 2 人。

第三个加入请求应返回：

```ts
{ ok: false, reason: "ROOM_FULL" }
```

### 7.5 房间关闭条件

房间可以关闭于：

- 比赛结束后所有玩家离开；
- Lobby 中所有玩家离开；
- 服务端手动清理超时房间；
- 异常状态恢复失败。

---

## 8. Match 状态同步

### 8.1 MatchState

与 `RULES_CORE_LOOP.md` 保持一致：

```ts
export type MatchState =
  | "LOBBY"
  | "COUNTDOWN"
  | "WAVE_PREP"
  | "WAVE_ACTIVE"
  | "WAVE_CLEAR"
  | "BOSS_PREP"
  | "BOSS_ACTIVE"
  | "VICTORY"
  | "DEFEAT";
```

### 8.2 状态机只在服务器运行

客户端可以显示 `matchState`，但不能推进状态机。

例如：

- 客户端不能自己认为 Wave 结束；
- 客户端不能自己生成 Boss；
- 客户端不能自己进入胜利。

### 8.3 状态转移广播

服务器状态切换时，除普通快照外，还应发送一次事件：

```ts
export type MatchPhaseChangedEvent = {
  type: "match.phaseChanged";
  matchId: MatchId;
  previousState: MatchState;
  nextState: MatchState;
  serverTimeMs: number;
  waveIndex?: number;
};
```

客户端用它来播放：

- Wave 开始提示；
- Boss 登场；
- 胜利/失败界面；
- 音效和过渡动画。

---

## 9. 客户端到服务器消息 C2S

### 9.1 C2S 消息总表

| 消息 | 用途 | 类型 |
|---|---|---|
| `room.create` | 创建房间 | request |
| `room.join` | 加入房间 | request |
| `room.leave` | 离开房间 | request/event |
| `player.ready` | 设置准备状态 | request |
| `input.move` | 移动方向 | continuous input |
| `input.aim` | 瞄准方向/点 | continuous input |
| `action.shoot` | 请求射击 | discrete request |
| `action.reload` | 请求换弹 | discrete request |
| `action.plant` | 请求种植 | discrete request |
| `action.buyAmmo` | 请求购买弹药 | discrete request |
| `action.evolve` | 请求进化 | discrete request |
| `client.pong` | 心跳响应 | system |
| `debug.command` | 本地调试命令，仅开发环境 | debug |

---

## 10. 服务器到客户端消息 S2C

### 10.1 S2C 消息总表

| 消息 | 用途 |
|---|---|
| `room.created` | 房间创建成功 |
| `room.joined` | 加入房间成功 |
| `room.error` | 房间操作失败 |
| `room.state` | Lobby/房间状态更新 |
| `match.started` | 比赛开始 |
| `match.phaseChanged` | Match 状态变化 |
| `state.snapshot` | 权威状态快照 |
| `action.accepted` | 离散动作成功 |
| `action.rejected` | 离散动作失败 |
| `event.feedback` | 表现层事件，如枪声、命中、Boss 警告 |
| `match.ended` | 胜负和结算 |
| `server.ping` | 心跳 |
| `server.warning` | 网络或同步警告 |

---

## 11. 通用消息 Envelope

### 11.1 为什么需要 Envelope

Envelope 用于统一：

- 请求 ID；
- 客户端本地序号；
- 服务器时间；
- 错误追踪；
- 调试日志。

### 11.2 C2S Envelope

```ts
export type ClientMessageEnvelope<T> = {
  type: string;
  requestId?: string;
  clientSeq: number;
  clientTimeMs: number;
  payload: T;
};
```

### 11.3 S2C Envelope

```ts
export type ServerMessageEnvelope<T> = {
  type: string;
  requestId?: string;
  serverSeq: number;
  serverTimeMs: number;
  payload: T;
};
```

### 11.4 requestId 规则

对于离散请求必须带 `requestId`：

- `action.shoot`；
- `action.reload`；
- `action.plant`；
- `action.buyAmmo`；
- `action.evolve`；
- `player.ready`。

服务器返回 `action.accepted` 或 `action.rejected` 时携带同一个 `requestId`。

移动输入可以不带 requestId。

---

## 12. 房间消息 Schema

### 12.1 创建房间

C2S:

```ts
export type CreateRoomRequest = {
  playerName?: string;
  clientVersion: string;
};
```

S2C:

```ts
export type RoomCreatedPayload = {
  matchId: MatchId;
  playerId: PlayerId;
  playerSlot: PlayerSlot;
  reconnectToken: string;
};
```

### 12.2 加入房间

C2S:

```ts
export type JoinRoomRequest = {
  matchId: MatchId;
  playerName?: string;
  clientVersion: string;
};
```

S2C:

```ts
export type RoomJoinedPayload = {
  matchId: MatchId;
  playerId: PlayerId;
  playerSlot: PlayerSlot;
  reconnectToken: string;
};
```

### 12.3 房间错误

```ts
export type RoomErrorReason =
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "MATCH_ALREADY_STARTED"
  | "VERSION_MISMATCH"
  | "INVALID_RECONNECT_TOKEN"
  | "UNKNOWN_ERROR";

export type RoomErrorPayload = {
  reason: RoomErrorReason;
  message: string;
};
```

### 12.4 Lobby 房间状态

```ts
export type RoomStatePayload = {
  matchId: MatchId;
  roomState: RoomState;
  players: Array<{
    playerId: PlayerId;
    slot: PlayerSlot;
    name: string;
    connected: boolean;
    ready: boolean;
  }>;
};
```

---

## 13. 输入消息 Schema

### 13.1 移动输入

```ts
export type MoveInputPayload = {
  dirX: number;
  dirY: number;
};
```

规则：

- `dirX` 和 `dirY` 范围建议为 -1 到 1；
- 服务器必须归一化；
- 如果长度 > 1，则 normalize；
- 如果玩家死亡或 matchState 不允许移动，则忽略。

### 13.2 瞄准输入

推荐发送世界坐标瞄准点：

```ts
export type AimInputPayload = {
  worldX: number;
  worldY: number;
};
```

服务器根据玩家当前位置计算方向。

原因：

- 客户端鼠标天然对应世界坐标；
- 服务端可验证方向有效；
- 后续可支持手柄方向。

### 13.3 输入节流

客户端不需要每帧发送输入。

推荐：

- 移动方向变化时立即发送；
- 瞄准方向可以 20Hz 发送；
- 如果无变化，可降低频率；
- 每次 snapshot 后客户端用插值修正。

---

## 14. 离散动作消息 Schema

### 14.1 射击请求

C2S:

```ts
export type ShootRequestPayload = {
  aimWorldX: number;
  aimWorldY: number;
};
```

服务器校验：

- 玩家存活；
- 当前状态允许射击；
- 不在换弹；
- 未超过射速；
- 弹匣 > 0；
- 方向有效。

成功后：

- 弹匣 -1；
- 创建服务器权威子弹；
- 增加 shotsFired；
- 广播 snapshot 或 event。

### 14.2 换弹请求

C2S:

```ts
export type ReloadRequestPayload = {};
```

服务器校验：

- 玩家存活；
- 不在换弹；
- 弹匣未满；
- 备弹 > 0；
- 当前状态允许操作。

成功后：

- 设置 `reloading = true`；
- 设置 `reloadCompleteAtServerTimeMs`；
- 到时间后由服务器转移弹药。

### 14.3 种植请求

C2S:

```ts
export type PlantRequestPayload = {
  plantType: "sunbloom" | "peashotter" | "barkwall";
  laneIndex: 0 | 1 | 2 | 3 | 4;
  columnIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6;
};
```

服务器校验：

- 当前状态允许种植；
- 玩家存活；
- 目标格子合法；
- 目标格子为空；
- 目标格子没有敌人阻挡；
- 玩家距离目标格子小于交互距离；
- sharedSun 足够。

成功后：

- 扣 sharedSun；
- 创建植物；
- 更新格子占用；
- 记录统计；
- 返回 accepted。

### 14.4 购买弹药请求

C2S:

```ts
export type BuyAmmoRequestPayload = {};
```

服务器校验：

- 玩家存活；
- 当前状态允许操作；
- sharedSun 足够；
- 购买冷却结束；
- reserveAmmo 未满。

成功后：

- 扣 sharedSun；
- 增加 reserveAmmo，不超过上限；
- 设置下次可购买时间；
- 记录统计。

### 14.5 进化请求

C2S:

```ts
export type EvolveRequestPayload = {
  path: "firepower" | "control" | "support";
};
```

服务器校验：

- evolutionUnlocked；
- 玩家存活；
- 玩家未进化；
- 路线合法；
- sharedSun 足够；
- 当前状态允许进化。

成功后：

- 扣 sharedSun；
- 设置 player.evolutionPath；
- 应用数值 modifier；
- 记录统计。

---

## 15. 动作确认与拒绝

### 15.1 ActionAccepted

```ts
export type ActionAcceptedPayload = {
  requestId: string;
  action:
    | "shoot"
    | "reload"
    | "plant"
    | "buyAmmo"
    | "evolve"
    | "ready";
  serverTimeMs: number;
  affectedEntityIds?: EntityId[];
};
```

### 15.2 ActionRejected

```ts
export type ActionRejectedPayload = {
  requestId: string;
  action:
    | "shoot"
    | "reload"
    | "plant"
    | "buyAmmo"
    | "evolve"
    | "ready";
  reason: ActionRejectReason;
  message: string;
  serverTimeMs: number;
};
```

### 15.3 拒绝原因

```ts
export type ActionRejectReason =
  | "NOT_IN_VALID_MATCH_STATE"
  | "PLAYER_DEAD"
  | "NOT_ENOUGH_SUN"
  | "OUT_OF_RANGE"
  | "CELL_OCCUPIED"
  | "CELL_NOT_PLANTABLE"
  | "ENEMY_BLOCKING_CELL"
  | "AMMO_EMPTY"
  | "RESERVE_AMMO_EMPTY"
  | "RELOADING"
  | "FIRE_RATE_LIMITED"
  | "AMMO_PURCHASE_COOLDOWN"
  | "RESERVE_AMMO_FULL"
  | "EVOLUTION_NOT_UNLOCKED"
  | "ALREADY_EVOLVED"
  | "INVALID_EVOLUTION_PATH"
  | "ROOM_NOT_READY"
  | "UNKNOWN_ERROR";
```

### 15.4 客户端如何处理拒绝

客户端收到拒绝后：

- 不强行本地执行动作；
- 显示短提示；
- 播放无效音效；
- 等待下一次 snapshot 修正 UI。

---

## 16. GameStateSnapshot

### 16.1 快照总结构

```ts
export type GameStateSnapshot = {
  matchId: MatchId;
  serverSeq: number;
  serverTimeMs: number;
  matchState: MatchState;
  roomState: RoomState;

  time: MatchTimeState;
  economy: EconomyState;
  base: BaseState;
  players: PlayerState[];
  plants: PlantState[];
  enemies: EnemyState[];
  bullets: BulletState[];
  boss?: BossState;
  wave: WaveState;
  events?: SnapshotEventHint[];
};
```

### 16.2 时间状态

```ts
export type MatchTimeState = {
  elapsedMatchSeconds: number;
  stateElapsedSeconds: number;
  stateRemainingSeconds?: number;
};
```

### 16.3 经济状态

```ts
export type EconomyState = {
  sharedSun: number;
  totalSunEarned: number;
  totalSunSpent: number;
  sunSuppressed: boolean;
  sunSuppressionRemainingSeconds?: number;
};
```

### 16.4 基地状态

```ts
export type BaseState = {
  hp: number;
  maxHp: number;
};
```

### 16.5 玩家状态

```ts
export type PlayerState = {
  playerId: PlayerId;
  slot: PlayerSlot;
  name: string;
  connected: boolean;

  x: number;
  y: number;
  aimX: number;
  aimY: number;

  hp: number;
  maxHp: number;
  alive: boolean;
  respawnRemainingSeconds?: number;
  invulnerableRemainingSeconds?: number;

  ammoInMagazine: number;
  magazineSize: number;
  reserveAmmo: number;
  maxReserveAmmo: number;
  reloading: boolean;
  reloadRemainingSeconds?: number;
  ammoPurchaseCooldownRemainingSeconds: number;

  evolutionPath?: "firepower" | "control" | "support";
  hasEvolved: boolean;

  stats: Partial<PlayerLiveStats>;
};
```

### 16.6 植物状态

```ts
export type PlantState = {
  id: EntityId;
  type: "sunbloom" | "peashotter" | "barkwall";
  laneIndex: number;
  columnIndex: number;
  hp: number;
  maxHp: number;
  shield?: number;
  alive: boolean;
  cooldownRemainingSeconds?: number;
};
```

### 16.7 敌人状态

```ts
export type EnemyState = {
  id: EntityId;
  type: "shambler" | "runner" | "brute";
  laneIndex: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  state: "MOVING" | "ATTACKING_PLANT" | "DEAD";
  targetPlantId?: EntityId;
  slowed?: boolean;
  slowRemainingSeconds?: number;
};
```

### 16.8 子弹状态

```ts
export type BulletState = {
  id: EntityId;
  ownerPlayerId?: PlayerId;
  ownerPlantId?: EntityId;
  type: "hero_bullet" | "pea_projectile";
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  speed: number;
  remainingLifetimeSeconds: number;
};
```

### 16.9 Boss 状态

```ts
export type BossState = {
  id: EntityId;
  bossType: "ironmaw_siege_beast";
  x: number;
  y: number;
  laneIndex: number;
  hp: number;
  maxHp: number;
  phase: 1 | 2;

  weakPointActive: boolean;
  weakPointX?: number;
  weakPointY?: number;
  weakPointRemainingSeconds?: number;

  currentSkill?:
    | "hammer_slam"
    | "summon_minions"
    | "weakpoint_expose"
    | "charge_windup"
    | "charge_dash"
    | "sun_suppression";

  skillRemainingSeconds?: number;
  charging: boolean;
  interruptProgress: number;
  interruptRequired: number;
};
```

### 16.10 Wave 状态

```ts
export type WaveState = {
  currentWaveIndex: number;
  totalWaves: number;
  waveSpawnComplete: boolean;
  enemiesRemainingInWave: number;
  evolutionUnlocked: boolean;
};
```

---

## 17. SnapshotEventHint 表现事件

### 17.1 为什么需要事件提示

纯 snapshot 可以同步状态，但不一定适合表现层。

例如：

- 枪声；
- 命中特效；
- Boss 怒吼；
- Wave 开始提示；
- 阳光产出特效。

这些可以通过 `event.feedback` 或 snapshot 中的 `events` 发送。

V0.1 推荐：重要表现事件单独发 `event.feedback`，轻量事件可以放在 snapshot hints 中。

### 17.2 FeedbackEvent

```ts
export type FeedbackEvent = {
  id: string;
  eventType:
    | "hero.shoot"
    | "hero.reloadStart"
    | "hero.reloadComplete"
    | "hero.dryFire"
    | "plant.placed"
    | "plant.destroyed"
    | "sun.gained"
    | "enemy.hit"
    | "enemy.killed"
    | "base.damaged"
    | "wave.started"
    | "boss.spawned"
    | "boss.phaseChanged"
    | "boss.weakPointExposed"
    | "boss.chargeStarted"
    | "boss.interrupted"
    | "boss.chargeFailed"
    | "match.victory"
    | "match.defeat";
  serverTimeMs: number;
  entityId?: EntityId;
  playerId?: PlayerId;
  x?: number;
  y?: number;
  data?: Record<string, unknown>;
};
```

### 17.3 事件去重

客户端应记录最近收到的 event id，避免重复播放。

```ts
recentFeedbackEventIds: Set<string>
```

---

## 18. 客户端预测与插值

### 18.1 V0.1 预测范围

V0.1 只做轻量预测。

允许客户端预测：

- 本地玩家移动显示；
- 枪口火光；
- 射击音效；
- 点击种植时的临时高亮；
- UI 按钮按下反馈。

不允许客户端预测：

- 阳光扣除；
- 植物真正生成；
- 子弹真正命中；
- 敌人死亡；
- Boss 打断；
- 胜负结果。

### 18.2 位置插值

客户端渲染远端实体时使用 snapshot buffer。

流程：

```text
收到 snapshot
  ↓
加入 buffer
  ↓
以 serverTime - interpolationDelay 渲染
  ↓
在两个 snapshot 之间插值位置
```

### 18.3 本地玩家修正

本地玩家可以即时移动，但必须根据服务器 snapshot 修正。

简单策略：

- 如果预测位置和服务器位置差距 < 16 px，平滑拉回；
- 如果差距 >= 16 px，快速修正；
- 如果差距 >= 80 px，直接 snap。

### 18.4 子弹表现

V0.1 有两种可选方案：

#### 方案 A：服务器同步子弹实体

优点：最清晰、最权威。  
缺点：快照稍大。

推荐 V0.1 使用。

#### 方案 B：服务器只广播射击事件，客户端表现子弹

优点：省带宽。  
缺点：命中表现可能和服务器结果不一致。

V0.1 不优先。

---

## 19. 子弹命中同步规则

### 19.1 服务器命中判定

服务器负责：

- 更新子弹位置；
- 检测碰撞；
- 应用伤害；
- 移除命中子弹；
- 触发命中事件。

客户端不能报告命中。

### 19.2 英雄子弹命中优先级

服务器检测顺序：

1. 如果 Boss 存在且弱点激活，检测 Boss 弱点；
2. 检测 Boss 本体；
3. 检测敌人；
4. 如果无命中，子弹继续飞行。

注意：实际可根据距离排序，但弱点检测必须优先于 Boss 本体。

### 19.3 豌豆弹命中优先级

豌豆弹：

1. 只命中同路线敌人；
2. Boss 战中如果 Boss 处于可被该路线攻击范围，则可命中 Boss 本体；
3. 不检测弱点；
4. 不触发打断。

### 19.4 Boss 打断不接受客户端请求

客户端不能发送：

```ts
bossInterruptRequest
```

Boss 打断只能由服务器在英雄子弹命中弱点时自然累计。

---

## 20. 共享阳光同步规则

### 20.1 阳光只在服务器变化

服务器中所有阳光变化必须记录来源：

```ts
export type SunChangeReason =
  | "initial"
  | "sunbloom_produce"
  | "enemy_drop"
  | "boss_phase_reward"
  | "plant_purchase"
  | "ammo_purchase"
  | "evolution_purchase"
  | "debug";
```

### 20.2 SunChangeEvent

```ts
export type SunChangeEvent = {
  previousSun: number;
  nextSun: number;
  delta: number;
  reason: SunChangeReason;
  actorPlayerId?: PlayerId;
  entityId?: EntityId;
  serverTimeMs: number;
};
```

客户端用它播放阳光获得或消费反馈。

### 20.3 同时消费冲突

服务器按接收顺序处理消费请求。

同一 Tick 内：

- 先处理到达服务器的请求；
- 成功后更新 sharedSun；
- 后续请求基于新 sharedSun 重新校验；
- 不足则拒绝。

---

## 21. 种植同步规则

### 21.1 客户端本地选择

客户端可以本地维护：

- 当前选中植物；
- hover cell；
- cell 是否看起来可种；
- 范围提示。

但这些只是 UI 辅助。

### 21.2 服务器最终判定

服务器收到 `action.plant` 后最终判定。

成功时：

- snapshot 中出现新 plant；
- sharedSun 减少；
- event.feedback 播放 `plant.placed`。

失败时：

- 返回 `action.rejected`；
- 不改变权威状态。

### 21.3 防止双人同格种植

两个玩家同时在同一格种植物：

- 服务器按请求顺序处理；
- 第一个成功；
- 第二个因 `CELL_OCCUPIED` 被拒绝。

---

## 22. 换弹与弹药同步规则

### 22.1 换弹开始

换弹请求成功后，服务器立即广播：

- `player.reloading = true`；
- `reloadRemainingSeconds`；
- `hero.reloadStart` feedback。

### 22.2 换弹完成

到达服务器时间后：

- 计算需要补充的子弹；
- 从 reserveAmmo 转移到 ammoInMagazine；
- 设置 `reloading = false`；
- 广播 `hero.reloadComplete`。

### 22.3 换弹期间射击

换弹期间收到射击请求：

```ts
ActionRejected: "RELOADING"
```

### 22.4 买弹药同步

买弹药成功后：

- sharedSun 减少；
- 当前玩家 reserveAmmo 增加；
- ammoPurchaseCooldownRemainingSeconds 重置；
- 广播 `action.accepted` 和 snapshot。

---

## 23. 进化同步规则

### 23.1 进化解锁广播

Wave 3 清理完成后：

```ts
wave.evolutionUnlocked = true
```

客户端显示进化 UI。

### 23.2 进化成功

服务器成功处理 `action.evolve` 后：

- sharedSun 减少；
- player.hasEvolved = true；
- player.evolutionPath = path；
- 应用数值 modifier；
- 发送 feedback `hero.evolved`，可扩展；
- snapshot 同步。

### 23.3 进化失败

常见拒绝：

- `EVOLUTION_NOT_UNLOCKED`；
- `NOT_ENOUGH_SUN`；
- `ALREADY_EVOLVED`；
- `PLAYER_DEAD`。

---

## 24. Boss 同步规则

### 24.1 Boss 生成

Boss 只由服务器生成。

生成时发送：

- `match.phaseChanged` 到 `BOSS_ACTIVE`；
- snapshot 中出现 `boss`；
- `event.feedback: boss.spawned`。

### 24.2 Boss 弱点

Boss 弱点状态在 snapshot 中同步：

```ts
weakPointActive: boolean;
weakPointX?: number;
weakPointY?: number;
weakPointRemainingSeconds?: number;
```

客户端根据该状态显示弱点视觉。

### 24.3 Boss 冲锋读条

冲锋开始时：

- boss.currentSkill = `charge_windup`；
- boss.charging = true；
- weakPointActive = true；
- interruptProgress = 0；
- interruptRequired = 6；
- feedback `boss.chargeStarted`。

### 24.4 Boss 打断进度

打断进度由服务器在英雄子弹命中弱点时增加。

snapshot 中同步：

```ts
interruptProgress: number;
interruptRequired: number;
```

客户端显示打断条。

### 24.5 打断成功

服务器判定：

```text
interruptProgress >= interruptRequired
```

结果：

- 取消冲锋；
- weakPointActive = false；
- boss.currentSkill = undefined 或 recovery；
- 进入短硬直；
- feedback `boss.interrupted`。

### 24.6 打断失败

读条结束仍未达标：

- Boss 执行冲锋；
- 造成植物或英雄伤害；
- feedback `boss.chargeFailed`；
- snapshot 更新 Boss 位置和受损对象。

---

## 25. 断线与重连

### 25.1 V0.1 断线策略

V0.1 采用简单重连策略。

玩家断线后：

- 服务器保留玩家 slot 20 秒；
- 玩家角色留在原地或进入 idle；
- 不自动让 AI 接管；
- 如果 20 秒内重连，恢复控制；
- 如果超时未重连，房间可以继续但标记该玩家 disconnected，或直接结束比赛。

推荐 V0.1：

- Lobby 阶段断线：移除玩家；
- 战斗阶段断线：保留 20 秒；
- 超过 20 秒：进入 `DEFEAT` 或 `MATCH_ABORTED`。

为了简单，V0.1 可以把战斗中长时间断线视为失败。

### 25.2 Reconnect Token

玩家创建或加入房间时，服务器返回：

```ts
reconnectToken: string;
```

客户端保存在 localStorage 或内存中。

重连请求：

```ts
export type ReconnectRequest = {
  matchId: MatchId;
  playerId: PlayerId;
  reconnectToken: string;
  clientVersion: string;
};
```

成功后：

- 绑定新 socket；
- 恢复 player slot；
- 立即发送最新 snapshot。

### 25.3 断线广播

服务器应广播：

```ts
export type PlayerConnectionChangedEvent = {
  playerId: PlayerId;
  connected: boolean;
  graceRemainingSeconds?: number;
};
```

---

## 26. 版本校验

### 26.1 Client Version

所有创建/加入房间请求必须带：

```ts
clientVersion: string;
```

V0.1 简单规则：

- 客户端版本与服务器版本完全一致才允许加入；
- 不一致返回 `VERSION_MISMATCH`。

### 26.2 为什么需要版本校验

因为共享 types/config 变动后，旧客户端可能：

- 发送错误字段；
- 缺少新状态；
- 造成同步异常。

---

## 27. 安全与反作弊边界

### 27.1 V0.1 防作弊目标

V0.1 不是正式商业服，但必须避免最明显的客户端篡改。

### 27.2 必须防止的作弊

| 作弊 | 防法 |
|---|---|
| 客户端加阳光 | sharedSun 只在服务器变化 |
| 客户端直接种植物 | 种植必须服务器校验 |
| 客户端无限射击 | 服务器检查射速和弹药 |
| 客户端命中上报 | 服务器自己做命中 |
| 客户端打断 Boss | 打断由服务器命中弱点产生 |
| 客户端瞬移 | 服务器按速度更新并限制边界 |
| 客户端重复请求消费 | requestId 去重 + 状态校验 |
| 客户端伪造 playerId | socket 绑定 player session，不信任 payload playerId |

### 27.3 playerId 不应信任客户端

客户端消息中可以不带 playerId。

服务器应通过 socket session 找到 playerId。

即使客户端传 playerId，也只能用于 debug，不能作为权威身份依据。

### 27.4 请求去重

服务器应维护最近处理的 requestId。

```ts
processedRequestIdsByPlayer: Map<PlayerId, Set<string>>
```

如果收到重复 requestId：

- 不重复执行；
- 可以返回上次结果或忽略。

---

## 28. 调试与开发工具

### 28.1 Debug Overlay

客户端应显示可开关 debug overlay：

- ping；
- matchId；
- playerId；
- slot；
- serverSeq；
- snapshot buffer size；
- matchState；
- currentWave；
- sharedSun；
- entity counts。

### 28.2 服务端日志

服务端应记录：

- 房间创建/关闭；
- 玩家加入/离开/重连；
- matchState 转移；
- action rejected 的原因；
- 胜负结果；
- 异常。

### 28.3 Debug Command

V0.1 可在开发环境支持 debug 命令，但必须只在 dev 模式启用。

示例：

```ts
export type DebugCommandPayload =
  | { command: "addSun"; amount: number }
  | { command: "spawnEnemy"; enemyType: EnemyType; laneIndex: number }
  | { command: "startBoss" }
  | { command: "killAllEnemies" };
```

生产或演示模式必须禁用。

---

## 29. 错误处理

### 29.1 网络错误类型

```ts
export type NetworkWarningReason =
  | "HIGH_LATENCY"
  | "SNAPSHOT_DELAY"
  | "DESYNC_CORRECTED"
  | "SERVER_OVERLOADED"
  | "RECONNECTING"
  | "RECONNECTED"
  | "DISCONNECTED";
```

### 29.2 客户端显示策略

| 错误 | 显示 |
|---|---|
| 短暂高延迟 | 小图标即可 |
| 正在重连 | 屏幕顶部提示 |
| 重连失败 | 回到房间或菜单 |
| 版本不匹配 | 阻止进入房间，提示刷新 |

---

## 30. 带宽预估

### 30.1 实体数量预估

V0.1 同屏通常：

| 实体 | 数量 |
|---|---:|
| 玩家 | 2 |
| 植物 | 5–18 |
| 敌人 | 0–15 |
| 子弹 | 0–20 |
| Boss | 0–1 |

10Hz 全量 snapshot 足够。

### 30.2 优化阈值

如果出现以下情况，再考虑增量同步：

- snapshot 超过 20KB；
- 同屏敌人超过 50；
- 子弹超过 80；
- 客户端明显卡顿；
- 网络延迟造成明显漂移。

V0.1 不优先做增量优化。

---

## 31. Codex 实现顺序

### 31.1 Phase A：网络基础

实现：

- Socket.IO server；
- client socket；
- createRoom；
- joinRoom；
- room state；
- ready；
- basic snapshot heartbeat。

验收：

- 两个浏览器能进同一房间；
- 能看到房间玩家列表；
- ready 后进入 match。

### 31.2 Phase B：玩家移动同步

实现：

- input.move；
- input.aim；
- PlayerState snapshot；
- 客户端插值；
- debug overlay。

验收：

- 两名玩家能互相看到移动；
- 位置由服务器修正；
- 玩家不能出边界。

### 31.3 Phase C：离散动作协议

实现：

- action.shoot；
- action.reload；
- action.plant；
- action.buyAmmo；
- action.evolve；
- action.accepted / rejected。

验收：

- 每种请求都有成功和失败路径；
- UI 能显示拒绝原因；
- requestId 可追踪。

### 31.4 Phase D：完整快照结构

实现：

- GameStateSnapshot；
- players/plants/enemies/bullets/boss/wave/economy/base；
- snapshot buffer；
- 客户端渲染映射。

验收：

- 所有实体能通过 snapshot 渲染；
- 断开重连后能收到最新状态。

### 31.5 Phase E：Boss 与战斗关键同步

实现：

- Boss 弱点；
- Boss charge；
- interruptProgress；
- feedback events。

验收：

- Boss 打断完全由服务器判定；
- 客户端显示打断进度；
- 弱点表现与服务器状态一致。

---

## 32. 验收测试清单

### 32.1 房间测试

| 测试 | 预期 |
|---|---|
| 创建房间 | 返回 matchId、playerId、slot 0 |
| 第二人加入 | 返回 slot 1 |
| 第三人加入 | 拒绝 `ROOM_FULL` |
| 双方 ready | 进入 countdown |
| 一人取消 ready | 不开始 |

### 32.2 移动同步测试

| 测试 | 预期 |
|---|---|
| 玩家 A 移动 | 玩家 B 看到 A 移动 |
| 玩家越界移动 | 服务器限制边界 |
| 高延迟下移动 | 客户端插值，不严重抖动 |

### 32.3 动作请求测试

| 测试 | 预期 |
|---|---|
| 阳光足够种植 | 成功，植物出现，阳光减少 |
| 阳光不足种植 | 拒绝 `NOT_ENOUGH_SUN` |
| 同格双人种植 | 一个成功，一个 `CELL_OCCUPIED` |
| 空弹匣射击 | 拒绝 `AMMO_EMPTY` |
| 换弹期间射击 | 拒绝 `RELOADING` |
| 冷却中买弹药 | 拒绝 `AMMO_PURCHASE_COOLDOWN` |
| 未解锁进化 | 拒绝 `EVOLUTION_NOT_UNLOCKED` |

### 32.4 Boss 同步测试

| 测试 | 预期 |
|---|---|
| Boss 弱点暴露 | 两客户端同时看到弱点 |
| 英雄命中弱点 | 服务器增加 interruptProgress |
| 植物命中 Boss | 不增加 interruptProgress |
| 打断达标 | Boss 被打断，播放反馈 |
| 打断失败 | Boss 冲锋并造成权威伤害 |

### 32.5 断线重连测试

| 测试 | 预期 |
|---|---|
| Lobby 断线 | 玩家从房间移除或标记 disconnected |
| 战斗中短暂断线 | slot 保留，重连恢复 |
| 战斗中超时断线 | 进入失败或中止 |
| 错误 token 重连 | 拒绝 |

---

## 33. 常见实现错误与禁止事项

### 33.1 禁止客户端判定命中

错误：

```text
client says: enemy X hit by bullet Y
```

正确：

```text
client says: I want to shoot toward point P
server creates bullet and checks collision
```

### 33.2 禁止客户端本地扣阳光

错误：

```text
client immediately subtracts sun when planting
```

正确：

```text
client sends plant request
server accepts and snapshot updates sun
client may show pending feedback but not authority change
```

### 33.3 禁止 Boss 打断请求

错误：

```text
client sends boss.interrupt
```

正确：

```text
server detects hero bullet hitting active weak point
server increases interrupt progress
```

### 33.4 禁止没有 requestId 的消费动作

所有会改变资源的动作必须有 requestId，方便追踪和去重。

### 33.5 禁止代码中散落事件名字符串

事件名必须集中定义：

```ts
shared/types/networkEvents.ts
```

避免拼写错误。

---

## 34. 推荐事件名常量

```ts
export const C2S = {
  ROOM_CREATE: "room.create",
  ROOM_JOIN: "room.join",
  ROOM_LEAVE: "room.leave",
  PLAYER_READY: "player.ready",
  INPUT_MOVE: "input.move",
  INPUT_AIM: "input.aim",
  ACTION_SHOOT: "action.shoot",
  ACTION_RELOAD: "action.reload",
  ACTION_PLANT: "action.plant",
  ACTION_BUY_AMMO: "action.buyAmmo",
  ACTION_EVOLVE: "action.evolve",
  CLIENT_PONG: "client.pong",
  DEBUG_COMMAND: "debug.command",
} as const;

export const S2C = {
  ROOM_CREATED: "room.created",
  ROOM_JOINED: "room.joined",
  ROOM_ERROR: "room.error",
  ROOM_STATE: "room.state",
  MATCH_STARTED: "match.started",
  MATCH_PHASE_CHANGED: "match.phaseChanged",
  STATE_SNAPSHOT: "state.snapshot",
  ACTION_ACCEPTED: "action.accepted",
  ACTION_REJECTED: "action.rejected",
  FEEDBACK_EVENT: "event.feedback",
  MATCH_ENDED: "match.ended",
  SERVER_PING: "server.ping",
  SERVER_WARNING: "server.warning",
} as const;
```

---

## 35. 最小可用联机闭环 Definition of Done

`NETWORK_SYNC_SPEC.md` 对应的最小完成标准：

1. 两名玩家能进入同一个 room；
2. 两名玩家 ready 后进入 match；
3. 玩家移动由服务器广播；
4. sharedSun 只由服务器变化；
5. 种植请求成功/失败都能正确返回；
6. 射击、换弹、买弹药由服务器校验；
7. 子弹命中由服务器判定；
8. Wave 和 Boss 状态由服务器推进；
9. Boss 打断由服务器命中弱点产生；
10. 胜负由服务器判定；
11. 客户端能通过 snapshot 完整渲染当前状态；
12. 断线重连至少有基础处理；
13. Debug overlay 能帮助定位同步问题。

---

## 36. 当前版本最终结论

V0.1 联机同步的关键不是追求复杂网络技术，而是把权威边界写死：

> **客户端只提交意图，服务器决定结果；客户端负责表现，服务器负责事实。**

只要这条线不被破坏，后续增加更多植物、武器、Boss、局外成长和匹配系统时，项目仍然可控。

V0.1 应优先做出稳定的双人合作本地/公网测试 Demo，再考虑增量同步、预测优化、反作弊强化和正式账号体系。

