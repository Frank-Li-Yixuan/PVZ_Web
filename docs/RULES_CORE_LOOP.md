# RULES_CORE_LOOP.md

# 双人合作枪械英雄塔防 V0.1 核心循环与规则执行文档

## 0. 文档目的

本文档定义 V0.1 的**核心循环规则**与**运行时判定规则**。

它回答的问题不是“游戏是什么”，而是：

- 一局游戏从开始到结束如何流转；
- 每个阶段允许玩家做什么；
- 玩家操作如何被判定成功或失败；
- 植物、英雄、敌人、Boss、阳光之间如何互相作用；
- 哪些逻辑必须由服务器权威决定；
- Codex 实现时应如何避免规则混乱。

本文档是 `GAME_DESIGN_V0_1.md` 的执行层补充。具体数值放入 `COMBAT_NUMBERS_V0_1.md`，网络消息格式放入 `NETWORK_SYNC_SPEC_V0_1.md`。

---

## 1. 核心循环一句话

**两名玩家共享阳光，在多波敌人压力下，通过种植植物建立防线、操控持枪英雄救场、有限弹药管理和中期英雄进化，最终合作击败 Boss。**

---

## 2. 单局状态机

### 2.1 MatchState 枚举

V0.1 一局游戏必须使用明确状态机，避免不同系统同时乱跑。

```ts
type MatchState =
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

### 2.2 状态含义

| 状态 | 含义 | 玩家是否可移动 | 是否可种植 | 是否可射击 | 是否刷怪 |
|---|---|---:|---:|---:|---:|
| `LOBBY` | 房间等待，两名玩家加入与准备 | 否 | 否 | 否 | 否 |
| `COUNTDOWN` | 双方准备后进入开局倒计时 | 否或可轻微移动 | 否 | 否 | 否 |
| `WAVE_PREP` | 波次前准备期 | 是 | 是 | 是 | 否 |
| `WAVE_ACTIVE` | 当前波次进行中 | 是 | 是 | 是 | 是 |
| `WAVE_CLEAR` | 当前波次清理完成后的短暂间隔 | 是 | 是 | 是 | 否 |
| `BOSS_PREP` | Boss 前准备期 | 是 | 是 | 是 | 否 |
| `BOSS_ACTIVE` | Boss 战进行中 | 是 | 是 | 是 | Boss 与小怪 |
| `VICTORY` | 胜利结算 | 否 | 否 | 否 | 否 |
| `DEFEAT` | 失败结算 | 否 | 否 | 否 | 否 |

### 2.3 状态转移规则

```text
LOBBY
  -> 两名玩家都 ready
COUNTDOWN
  -> 倒计时结束
WAVE_PREP
  -> 准备时间结束
WAVE_ACTIVE
  -> 当前波次刷怪结束且场上普通敌人清空
WAVE_CLEAR
  -> 短暂间隔结束
WAVE_PREP / BOSS_PREP
  -> 如果还有普通波次，进入下一轮 WAVE_PREP
  -> 如果普通波次全部完成，进入 BOSS_PREP
BOSS_ACTIVE
  -> Boss HP <= 0，进入 VICTORY
任意战斗状态
  -> baseHp <= 0，进入 DEFEAT
```

### 2.4 禁止状态跳转

以下跳转不允许：

- `LOBBY` 直接进入 `WAVE_ACTIVE`；
- `WAVE_ACTIVE` 跳过 `WAVE_CLEAR` 直接进入下一波；
- `WAVE_ACTIVE` 在普通敌人未清空时进入下一波，除非后续明确设计为叠波；
- `BOSS_ACTIVE` 回到普通波次；
- `VICTORY` 或 `DEFEAT` 后继续战斗 Tick。

V0.1 不做复杂叠波。每波必须清理完成后再进入下一阶段。

---

## 3. 一局完整流程

### 3.1 宏观流程

```text
1. 玩家 A 创建房间
2. 玩家 B 加入房间
3. 两名玩家点击准备
4. 进入倒计时
5. 初始化战斗地图、基地、共享阳光、玩家英雄
6. 进入 Wave 1 准备期
7. Wave 1 开始并刷怪
8. 当前波次敌人全部处理完毕
9. 进入波次清理间隔
10. 重复 Wave 2 到 Wave 5
11. 进入 Boss 前准备期
12. Boss 登场
13. Boss 进入阶段 1
14. Boss HP 低于阈值进入阶段 2
15. 玩家击败 Boss，胜利
16. 或基地生命归零，失败
17. 显示结算
```

### 3.2 每局初始化内容

进入战斗前，服务器必须初始化：

| 对象 | 初始化内容 |
|---|---|
| Match | 状态、时间、当前波次、随机种子 |
| Players | 位置、HP、弹匣、备弹、进化状态、统计数据 |
| Shared Economy | 初始阳光、累计获得、累计消耗 |
| Map | 5 路、7 列格子、基地位置 |
| Plants | 空列表 |
| Enemies | 空列表 |
| Bullets | 空列表 |
| Boss | 暂不生成，Boss 阶段生成 |
| Stats | 击杀、伤害、消费、购买弹药、种植数量等 |

---

## 4. 核心 Tick 循环

### 4.1 服务器 Tick 是权威循环

服务器以固定 Tick 更新战斗世界。

每个 Tick 的推荐顺序：

```text
1. 读取并应用玩家输入意图
2. 更新玩家移动
3. 处理射击、换弹、购买弹药、种植、进化请求
4. 更新波次或 Boss 状态
5. 生成敌人或 Boss 小怪
6. 更新植物生产与植物攻击
7. 更新子弹移动与命中
8. 更新敌人移动、攻击、死亡、突破基地
9. 更新 Boss 行为、弱点、读条、打断、阶段转换
10. 清理死亡或过期实体
11. 更新胜负条件
12. 广播状态快照给客户端
```

### 4.2 Tick 顺序设计原因

这个顺序的目的是保证规则一致：

- 玩家输入先处理，操作响应更及时；
- 种植先于敌人移动，可以让关键时刻的种植生效；
- 植物攻击和英雄子弹都在敌人攻击前处理，提升操作反馈；
- 胜负判定放在最后，避免同一 Tick 中状态半更新。

### 4.3 同 Tick 冲突处理原则

如果同一 Tick 中发生冲突，按以下优先级处理：

1. 服务器权威状态优先；
2. 已确认的死亡实体不再执行后续行为；
3. 基地生命归零优先进入失败；
4. Boss HP 归零优先进入胜利，除非同一 Tick 基地也归零；
5. 如果胜利与失败同 Tick 同时发生，V0.1 规则：**失败优先**，因为基地被摧毁代表防守失败。

---

## 5. 玩家核心循环

### 5.1 玩家每轮决策

玩家在每个短时间窗口内的决策结构：

```text
观察路线压力
  ↓
判断当前资源
  ↓
选择动作：移动 / 射击 / 换弹 / 种植 / 买弹药 / 进化
  ↓
服务器校验动作
  ↓
动作成功或失败反馈
  ↓
状态变化影响下一次决策
```

### 5.2 玩家可执行动作

| 动作 | 说明 | 是否消耗阳光 | 是否受冷却 | 是否需要服务器确认 |
|---|---|---:|---:|---:|
| 移动 | WASD 移动英雄 | 否 | 否 | 是 |
| 射击 | 使用枪械发射子弹 | 否 | 受射速限制 | 是 |
| 换弹 | 将备弹装入弹匣 | 否 | 换弹时间 | 是 |
| 种植 | 在格子上种植物 | 是 | 可选种植冷却 | 是 |
| 买弹药 | 消耗阳光补充备弹 | 是 | 是 | 是 |
| 进化 | 消耗阳光选择路线 | 是 | 一局一次 | 是 |
| 准备 | Lobby 中确认准备 | 否 | 否 | 是 |

### 5.3 玩家动作失败反馈

所有失败动作都应该给客户端返回原因。

常见失败原因：

```ts
type ActionRejectReason =
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
  | "INVALID_EVOLUTION_PATH";
```

---

## 6. 输入与请求规则

### 6.1 输入分两类

V0.1 输入分为：

| 类型 | 说明 | 示例 |
|---|---|---|
| Continuous Input | 持续输入，每 Tick 生效 | 移动方向、瞄准方向 |
| Discrete Request | 离散请求，需要单次校验 | 射击、换弹、种植、买弹药、进化 |

### 6.2 Continuous Input 规则

移动输入：

- 客户端发送方向；
- 服务器归一化方向向量；
- 服务器计算位置；
- 服务器限制地图边界；
- 客户端只做显示预测或插值。

### 6.3 Discrete Request 规则

离散请求必须：

1. 带 playerId 或由 socket 绑定 playerId；
2. 由服务器读取当前权威状态；
3. 完整校验；
4. 成功则修改权威状态；
5. 失败则返回失败原因；
6. 任何客户端本地预测都不能覆盖服务器结果。

---

## 7. 共享阳光核心规则

### 7.1 共享阳光变量

服务器维护：

```ts
sharedSun: number;
totalSunEarned: number;
totalSunSpent: number;
sunSpendLog: SunSpendEvent[];
```

### 7.2 阳光获得流程

```text
触发阳光来源
  ↓
服务器计算获得量
  ↓
sharedSun 增加
  ↓
totalSunEarned 增加
  ↓
记录来源
  ↓
广播 UI 更新
```

阳光来源包括：

- 经济植物周期产出；
- 敌人死亡概率掉落；
- Boss 阶段转换奖励；
- 后续版本的关卡事件奖励。

### 7.3 阳光消费流程

```text
玩家发起消费请求
  ↓
服务器检查 sharedSun 是否足够
  ↓
检查该消费类型的额外条件
  ↓
成功：扣除 sharedSun
  ↓
执行对应效果
  ↓
记录消费日志
  ↓
广播状态
```

### 7.4 阳光消费优先级

阳光没有自动优先级，所有消费由玩家主动触发。

但是同一 Tick 如果两名玩家同时消费，服务器必须确定顺序。

V0.1 推荐规则：

1. 按服务器接收时间排序；
2. 如果同 Tick 时间相同，按 playerSlot 排序；
3. 第一个消费成功后，第二个消费基于剩余阳光重新校验；
4. 若阳光不足，第二个请求失败并返回 `NOT_ENOUGH_SUN`。

### 7.5 为什么不做投票消费

V0.1 不做消费投票确认。

原因：

- 影响操作节奏；
- 实现复杂度增加；
- 当前有冷却和上限可限制乱花；
- 共享阳光带来的合作冲突本身是玩法的一部分。

---

## 8. 种植核心循环

### 8.1 种植流程

```text
玩家选择植物类型
  ↓
玩家靠近目标格子
  ↓
玩家按 E 发起 PlantRequest
  ↓
服务器校验格子、距离、阳光、状态
  ↓
成功：扣阳光并创建植物
  ↓
失败：返回失败原因
  ↓
客户端更新 UI 与反馈
```

### 8.2 种植请求字段

```ts
type PlantRequest = {
  plantType: "sunbloom" | "peashotter" | "barkwall";
  laneIndex: number;
  columnIndex: number;
};
```

### 8.3 种植合法条件

种植必须全部满足：

1. 当前 MatchState 允许种植；
2. 玩家存活；
3. plantType 有效；
4. laneIndex 和 columnIndex 在范围内；
5. 目标格子是 plantable；
6. 目标格子为空；
7. 目标格子没有敌人占据或正在攻击；
8. 玩家距离目标格子中心点小于交互距离；
9. sharedSun 足够支付成本；
10. 服务器成功扣除阳光。

### 8.4 种植成功结果

成功后：

- 创建 PlantEntity；
- 写入格子占用状态；
- 扣除共享阳光；
- 增加玩家种植统计；
- 播放种植反馈；
- 广播植物生成。

### 8.5 种植失败结果

失败后：

- 不扣阳光；
- 不创建植物；
- 返回具体失败原因；
- 客户端显示提示和无效音效。

### 8.6 植物死亡后的格子规则

植物死亡：

```text
Plant HP <= 0
  ↓
Plant 标记死亡
  ↓
释放格子
  ↓
删除或播放死亡动画后删除
  ↓
敌人继续前进
```

植物死亡不返还阳光。

---

## 9. 植物运行循环

### 9.1 植物通用属性

所有植物至少包含：

```ts
type PlantState = {
  id: string;
  type: PlantType;
  laneIndex: number;
  columnIndex: number;
  hp: number;
  maxHp: number;
  cooldownTimer?: number;
  alive: boolean;
};
```

### 9.2 经济植物循环

```text
每个 Tick 更新产出计时器
  ↓
计时器达到产出间隔
  ↓
服务器增加 sharedSun
  ↓
重置计时器
  ↓
广播阳光变化和产出特效
```

规则：

- 死亡的经济植物不产出；
- 产出不需要玩家点击收集；
- V0.1 直接加入共享阳光，降低实现复杂度；
- 后续版本可做掉落阳光需要拾取。

### 9.3 输出植物循环

```text
每个 Tick 检查攻击冷却
  ↓
检查本路线前方是否有敌人
  ↓
如果有目标且冷却结束
  ↓
创建植物子弹
  ↓
重置攻击冷却
```

目标选择规则：

1. 只攻击同一路线；
2. 只攻击植物前方的敌人；
3. 选择距离基地最近或距离植物最近的敌人，V0.1 推荐选择**距离基地最近的敌人**，因为更符合防守优先级；
4. 不攻击已经死亡的敌人；
5. 不攻击 Boss 弱点，只对 Boss 本体造成普通伤害。

### 9.4 防御植物循环

防御植物本身不主动行动。

它的作用是：

- 占据格子；
- 作为敌人攻击目标；
- 阻止敌人继续前进。

防御植物不需要攻击逻辑。

---

## 10. 英雄枪械核心循环

### 10.1 射击流程

```text
玩家按鼠标左键
  ↓
客户端发送 ShootRequest
  ↓
服务器检查玩家状态、弹药、射速、换弹状态
  ↓
成功：弹匣 -1，创建子弹
  ↓
失败：返回原因
  ↓
广播子弹和弹药状态
```

### 10.2 射击合法条件

射击必须满足：

1. 当前 MatchState 允许射击；
2. 玩家存活；
3. 玩家不在换弹中；
4. 当前时间超过下一次可射击时间；
5. ammoInMagazine > 0；
6. aimDirection 有效；
7. 服务器创建子弹。

### 10.3 空枪规则

如果玩家弹匣为 0 并尝试射击：

- 不创建子弹；
- 返回 `AMMO_EMPTY`；
- 客户端播放空枪音效；
- UI 提示需要换弹或购买弹药。

### 10.4 换弹流程

```text
玩家按 R
  ↓
服务器检查是否能换弹
  ↓
进入 reloading 状态
  ↓
换弹计时结束
  ↓
从 reserveAmmo 转移到 ammoInMagazine
  ↓
退出 reloading 状态
```

### 10.5 换弹合法条件

换弹必须满足：

1. 玩家存活；
2. 玩家不在换弹中；
3. ammoInMagazine < magazineSize；
4. reserveAmmo > 0；
5. 当前状态允许换弹。

### 10.6 买弹药流程

```text
玩家按 Q
  ↓
服务器检查 sharedSun、冷却、备弹上限
  ↓
扣除 sharedSun
  ↓
增加 reserveAmmo
  ↓
启动购买冷却
  ↓
广播阳光和弹药变化
```

### 10.7 买弹药合法条件

买弹药必须满足：

1. 玩家存活；
2. 当前 MatchState 允许操作；
3. sharedSun 足够；
4. 玩家弹药购买冷却结束；
5. reserveAmmo 未达到上限。

### 10.8 子弹命中规则

英雄子弹：

- 按方向移动；
- 命中第一个有效敌方目标后消失；
- 可以命中普通敌人；
- Boss 战中可以命中 Boss；
- Boss 弱点暴露时，如果命中弱点区域，则触发弱点效果；
- 不穿透，除非进化路线明确提供穿透。

---

## 11. 英雄生命与复活循环

### 11.1 英雄受伤

英雄可被敌人或 Boss 技能伤害。

受伤后：

- HP 减少；
- 进入短暂无敌时间；
- 客户端播放受击反馈；
- 如果 HP <= 0，进入死亡状态。

### 11.2 英雄死亡

英雄死亡后：

- 不能移动；
- 不能射击；
- 不能换弹；
- 不能种植；
- 不能买弹药；
- 不能进化；
- 保留当前进化路线；
- 保留当前弹药状态，V0.1 不掉弹药。

### 11.3 英雄复活

复活流程：

```text
Hero HP <= 0
  ↓
进入 DEAD 状态
  ↓
启动 respawnTimer
  ↓
倒计时结束
  ↓
英雄在基地附近复活
  ↓
HP 恢复到 maxHp
```

V0.1 不做队友扶起，不做复活消耗阳光。

---

## 12. 敌人核心循环

### 12.1 敌人生成流程

```text
WaveSystem 到达刷怪时间点
  ↓
选择 enemyType 和 laneIndex
  ↓
在敌人出生点创建 EnemyEntity
  ↓
加入 enemies 列表
  ↓
广播生成事件
```

### 12.2 敌人通用状态

```ts
type EnemyState = {
  id: string;
  type: EnemyType;
  laneIndex: number;
  x: number;
  hp: number;
  maxHp: number;
  state: "MOVING" | "ATTACKING_PLANT" | "DEAD";
  targetPlantId?: string;
};
```

### 12.3 敌人移动流程

```text
敌人处于 MOVING
  ↓
检查前方是否有植物阻挡
  ↓
如果无植物，向基地移动
  ↓
如果有植物，切换为 ATTACKING_PLANT
  ↓
如果到达基地，造成基地伤害并移除
```

### 12.4 敌人攻击植物流程

```text
敌人处于 ATTACKING_PLANT
  ↓
检查目标植物是否仍然存活
  ↓
如果存活，按攻击间隔造成伤害
  ↓
如果植物死亡，切回 MOVING
```

### 12.5 敌人死亡流程

```text
Enemy HP <= 0
  ↓
标记 DEAD
  ↓
统计击杀来源
  ↓
判定是否掉落阳光
  ↓
播放死亡反馈
  ↓
从 enemies 列表移除或延迟移除
```

### 12.6 敌人突破基地流程

```text
Enemy 到达基地线
  ↓
baseHp -= enemy.baseDamage
  ↓
记录突破统计
  ↓
移除 Enemy
  ↓
如果 baseHp <= 0，进入 DEFEAT
```

---

## 13. 波次核心循环

### 13.1 WaveSystem 职责

WaveSystem 负责：

- 当前波次编号；
- 波次准备时间；
- 刷怪时间表；
- 判断本波是否刷怪完成；
- 判断场上敌人是否清空；
- 转入下一波或 Boss 准备。

### 13.2 普通波次流程

```text
进入 WAVE_PREP
  ↓
准备倒计时
  ↓
进入 WAVE_ACTIVE
  ↓
按时间表生成敌人
  ↓
刷怪计划全部完成
  ↓
等待场上普通敌人清空
  ↓
进入 WAVE_CLEAR
  ↓
如果还有下一波，进入下一轮 WAVE_PREP
  ↓
如果所有普通波次完成，进入 BOSS_PREP
```

### 13.3 波次清空判定

一个普通波次清空需要同时满足：

1. 本波刷怪计划已经全部执行；
2. 场上普通敌人数量为 0；
3. 当前 MatchState 仍是 `WAVE_ACTIVE`；
4. 基地 HP > 0。

### 13.4 进化解锁时机

V0.1 推荐：Wave 3 清理完成后解锁进化。

也就是说：

```text
Wave 3 WAVE_CLEAR 开始
  ↓
evolutionUnlocked = true
  ↓
UI 显示进化可用
```

这样玩家在 Wave 4、Wave 5 和 Boss 战前可以选择是否进化。

---

## 14. Boss 核心循环

### 14.1 Boss 生成流程

```text
Wave 5 清空
  ↓
进入 BOSS_PREP
  ↓
Boss 前准备倒计时
  ↓
生成 Boss
  ↓
进入 BOSS_ACTIVE
```

### 14.2 Boss 通用状态

```ts
type BossState = {
  id: string;
  hp: number;
  maxHp: number;
  phase: 1 | 2;
  x: number;
  laneIndex: number;
  weakPointActive: boolean;
  charging: boolean;
  interruptProgress: number;
  currentSkill?: BossSkillId;
};
```

### 14.3 Boss 阶段 1 循环

阶段 1 主要行为：

```text
Boss 缓慢推进
  ↓
周期性重锤攻击植物
  ↓
周期性召唤小怪
  ↓
周期性暴露弱点
  ↓
HP <= 50% 时进入阶段 2
```

### 14.4 Boss 阶段 2 转换

阶段转换流程：

```text
Boss HP <= phase2Threshold
  ↓
phase = 2
  ↓
播放怒吼 / 阶段转换反馈
  ↓
给予队伍少量阳光奖励
  ↓
Boss 获得冲锋读条技能
  ↓
Boss 速度或压力提升
```

阶段转换只能触发一次。

### 14.5 Boss 冲锋读条流程

```text
Boss 进入 charge windup
  ↓
显示冲锋警告
  ↓
weakPointActive = true
  ↓
interruptProgress = 0
  ↓
玩家需要在读条时间内命中弱点
  ↓
如果 interruptProgress 达标：打断成功
  ↓
如果读条结束仍未达标：Boss 冲锋
```

### 14.6 Boss 打断规则

打断只接受英雄子弹命中弱点。

植物普通攻击不增加打断进度。

控制进化可以提高打断效率，但必须由服务器判定。

### 14.7 Boss 冲锋成功结果

如果未打断：

- Boss 向基地方向突进一段距离；
- 摧毁或重创路径上的第一个植物；
- 对基地造成压力；
- weakPointActive 关闭；
- 进入技能冷却。

### 14.8 Boss 死亡

Boss HP <= 0：

- 停止所有 Boss 行为；
- 清理 Boss 召唤计划；
- 进入 `VICTORY`，除非同 Tick 基地 HP 已归零；
- 生成结算数据。

---

## 15. 英雄进化核心循环

### 15.1 进化流程

```text
进化系统解锁
  ↓
玩家按 F 打开选择
  ↓
玩家选择路线
  ↓
服务器校验阳光、玩家状态、是否已进化
  ↓
成功：扣阳光并应用进化效果
  ↓
失败：返回原因
```

### 15.2 进化合法条件

必须满足：

1. evolutionUnlocked = true；
2. 玩家存活；
3. 玩家尚未进化；
4. 选择路线有效；
5. sharedSun 足够；
6. 当前 MatchState 允许进化。

### 15.3 进化效果应用原则

进化效果必须数据驱动。

推荐结构：

```ts
type EvolutionPath = "firepower" | "control" | "support";

type EvolutionModifier = {
  damageBonus?: number;
  magazineBonus?: number;
  weakPointDamageBonus?: number;
  slowOnHit?: boolean;
  interruptBonus?: number;
  ammoDiscount?: number;
  sunDropBonus?: number;
};
```

### 15.4 进化不能重置弹药

V0.1 规则：进化不自动补满弹药。

原因：

- 避免进化变成免费补弹；
- 保持买弹药的资源压力；
- 让玩家提前规划 Boss 前准备。

---

## 16. 胜负核心规则

### 16.1 失败判定

任意战斗相关状态下，如果：

```text
baseHp <= 0
```

则进入 `DEFEAT`。

战斗相关状态包括：

- `WAVE_PREP`
- `WAVE_ACTIVE`
- `WAVE_CLEAR`
- `BOSS_PREP`
- `BOSS_ACTIVE`

理论上准备期基地不会掉血，但规则保持统一。

### 16.2 胜利判定

Boss 战中，如果：

```text
boss.hp <= 0 && baseHp > 0
```

则进入 `VICTORY`。

### 16.3 胜负同 Tick 冲突

如果同一 Tick：

```text
boss.hp <= 0
baseHp <= 0
```

V0.1 判定：`DEFEAT`。

理由：防守游戏中基地被摧毁代表任务失败。

---

## 17. 结算数据规则

### 17.1 必须统计的数据

服务器至少统计：

```ts
type MatchStats = {
  clearTimeSeconds: number;
  result: "VICTORY" | "DEFEAT";
  finalWave: number;
  baseHpRemaining: number;
  totalSunEarned: number;
  totalSunSpent: number;
  totalPlantsPlaced: number;
  totalEnemiesKilled: number;
  bossDamageTotal: number;
  players: PlayerStats[];
};
```

每名玩家统计：

```ts
type PlayerStats = {
  playerId: string;
  damageDealt: number;
  enemiesKilled: number;
  shotsFired: number;
  shotsHit: number;
  ammoPurchases: number;
  sunSpentByActions: number;
  plantsPlaced: number;
  deaths: number;
  evolutionPath?: EvolutionPath;
};
```

### 17.2 统计用途

统计数据用于：

- 结算界面展示；
- 调参分析；
- 让玩家理解失败原因；
- 后续版本用于成就或局外成长。

V0.1 不根据统计给奖励。

---

## 18. 核心规则不变量

Codex 实现时必须保证以下不变量长期成立。

### 18.1 资源不变量

```text
sharedSun >= 0
```

任何消费都不能让共享阳光变成负数。

### 18.2 格子不变量

```text
每个 plant cell 最多存在一个 alive plant
```

### 18.3 玩家数量不变量

```text
V0.1 每个正式 match 最多 2 名玩家
```

### 18.4 弹药不变量

```text
0 <= ammoInMagazine <= magazineSize
0 <= reserveAmmo <= maxReserveAmmo
```

### 18.5 状态不变量

```text
VICTORY 和 DEFEAT 是终止状态
```

一旦进入终止状态，战斗系统不再继续造成状态变化。

### 18.6 Boss 不变量

```text
Boss 只在 BOSS_ACTIVE 中存在并执行行为
```

Boss 不应在普通波次中产生技能行为。

### 18.7 权威不变量

```text
客户端不能直接修改权威状态
```

客户端只能提交输入和请求。

---

## 19. 必须拒绝的非法情况

服务器必须拒绝以下行为：

1. 死亡玩家射击；
2. 死亡玩家种植物；
3. 死亡玩家买弹药；
4. 阳光不足时消费；
5. 在已占用格子种植物；
6. 在不可种植区域种植物；
7. 超出交互距离种植物；
8. 弹匣为空时射击；
9. 正在换弹时射击；
10. 备弹为空时换弹；
11. 备弹已满时买弹药；
12. 冷却未结束时买弹药；
13. 未解锁时进化；
14. 已进化后再次进化；
15. Boss 未进入读条时提交打断请求，打断应由命中弱点自然产生，不应由客户端直接请求；
16. 非战斗状态中生成战斗实体。

---

## 20. 客户端反馈规则

### 20.1 成功反馈

以下操作成功后应有明确反馈：

| 操作 | 反馈 |
|---|---|
| 种植成功 | 植物出现、种植音、阳光减少 |
| 射击成功 | 枪口火光、枪声、弹药减少 |
| 换弹成功 | 换弹动画、弹药转移 |
| 买弹药成功 | 补弹 UI、阳光减少、冷却开始 |
| 进化成功 | 进化特效、路线标识 |
| Boss 打断成功 | 明显打断音效与 Boss 硬直 |

### 20.2 失败反馈

失败反馈必须简短，不打断战斗节奏。

例子：

- “阳光不足”；
- “备弹不足”；
- “太远了”；
- “该格子已有植物”；
- “补给冷却中”。

### 20.3 危险反馈

以下情况必须明显提示：

- 基地 HP 低；
- 某条路线即将被突破；
- Boss 开始冲锋读条；
- 玩家弹药耗尽；
- Boss 弱点暴露。

---

## 21. V0.1 核心循环验收标准

### 21.1 单局流程验收

完成后必须能跑通：

```text
Lobby
→ Countdown
→ Wave 1
→ Wave 2
→ Wave 3
→ Wave 4
→ Wave 5
→ Boss Prep
→ Boss Active
→ Victory or Defeat
→ Result Screen
```

### 21.2 玩法规则验收

必须满足：

1. 两名玩家共享同一个阳光池；
2. 任意玩家消费阳光都会影响团队；
3. 植物能被种下、攻击、被打死；
4. 敌人能移动、攻击植物、突破基地；
5. 英雄能射击、换弹、买弹药；
6. 弹药耗尽后英雄不能继续输出；
7. Wave 3 后进化可用；
8. Boss 有阶段转换；
9. Boss 冲锋可以通过英雄命中弱点打断；
10. 胜负由服务器权威判定。

### 21.3 工程验收

Codex 完成核心循环实现后必须提供：

- 状态机实现位置；
- 核心 Tick 顺序；
- 关键请求校验逻辑；
- 核心数据结构；
- 至少一轮端到端测试说明；
- 已知问题列表；
- 下一步建议。

---

## 22. Codex 实现提示

Codex 在实现本文档时，应优先拆成以下模块：

| 模块 | 职责 |
|---|---|
| `MatchStateMachine` | 控制单局状态流转 |
| `GameLoop` | 固定 Tick 更新 |
| `EconomySystem` | 阳光获得与消费 |
| `PlantSystem` | 种植、植物运行、死亡 |
| `HeroSystem` | 玩家移动、生命、复活 |
| `WeaponSystem` | 射击、换弹、买弹药 |
| `EnemySystem` | 敌人移动、攻击、死亡、突破 |
| `WaveSystem` | 普通波次推进 |
| `BossSystem` | Boss 阶段、技能、弱点、打断 |
| `StatsSystem` | 结算数据统计 |
| `FeedbackBridge` | 将服务器结果映射到客户端反馈事件 |

### 22.1 推荐实现顺序

```text
1. MatchStateMachine
2. GameLoop
3. EconomySystem
4. PlantSystem
5. EnemySystem
6. WeaponSystem
7. WaveSystem
8. EvolutionSystem
9. BossSystem
10. StatsSystem
```

### 22.2 不要先做复杂表现

实现规则时，先用占位图和简单 UI。玩法闭环通过后，再进入美术和音频打磨。

---

## 23. 当前文件边界

本文档只定义核心循环和规则执行。

不在本文档内展开：

- 具体数值表；
- 每波具体刷怪时间；
- Boss 详细数值；
- 网络消息完整 schema；
- 美术生成提示词；
- 音频素材来源；
- 完整代码目录结构。

这些内容应由后续文档负责。

---

## 24. 结论

`RULES_CORE_LOOP.md` 的核心作用是防止项目在实现时变成“功能堆叠”。

V0.1 的所有系统都必须围绕同一个规则闭环服务：

> **共享阳光创造团队决策，植物建立稳定防线，枪械英雄处理紧急威胁，弹药限制制造行动成本，波次逐步加压，Boss 最终检验合作质量。**

只要 Codex 严格按照本文档实现，项目就能保持清晰、可控、可扩展。

