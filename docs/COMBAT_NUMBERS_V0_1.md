# COMBAT_NUMBERS_V0_1.md

# 双人合作枪械英雄塔防 V0.1 战斗数值与调参基准

## 0. 文档目的

本文档定义 V0.1 可玩垂直切片的第一版战斗数值。

它负责回答：

- 英雄、植物、敌人、Boss 的具体血量、伤害、速度是多少；
- 阳光经济如何产出与消耗；
- 每一波具体刷什么、什么时候刷；
- Boss 技能时间轴如何安排；
- Codex 应如何把这些数值写成配置；
- 完成后如何判断过难、过简单、英雄过强或植物过弱。

本文档的数值不是最终商业平衡，而是 **V0.1 初始可测参数**。实现后必须通过试玩和日志继续调参。

---

## 1. 数值设计原则

### 1.1 V0.1 调参目标

V0.1 的目标不是绝对平衡，而是验证核心循环：

> 共享阳光创造团队决策，植物建立稳定防线，枪械英雄处理紧急威胁，弹药限制制造行动成本，Boss 最终检验合作质量。

### 1.2 战斗体验目标

| 目标 | 解释 |
|---|---|
| 单局 5–8 分钟 | 足够展示完整流程，不拖沓 |
| 前 2 波偏轻松 | 给玩家建立经济和理解规则的时间 |
| 第 3 波开始需要英雄救场 | 快速敌人逼玩家移动和开枪 |
| 第 4 波开始检查防线强度 | 装甲敌人逼玩家种输出和防御植物 |
| 第 5 波消耗资源 | Boss 前制造弹药和阳光压力 |
| Boss 战 90–150 秒 | 足够有高潮，但不能磨血过久 |
| 英雄不能单独解决全部敌人 | 子弹和换弹限制必须有效 |
| 植物不能完全自动通关 | Boss 弱点和快速敌人需要英雄参与 |

### 1.3 初版平衡判断

理想情况下：

- 两名新玩家第一次玩可能失败或险胜；
- 两名理解规则的玩家应该能稳定通关；
- 如果完全不种经济植物，Boss 前资源明显紧张；
- 如果完全不买弹药，Boss 二阶段打断困难；
- 如果完全不种防御植物，装甲敌人和 Boss 会快速压线；
- 如果只靠英雄射击，弹药会明显不够。

---

## 2. 单位与通用约定

### 2.1 时间单位

| 项目 | 约定 |
|---|---|
| 时间单位 | 秒 |
| 服务器 Tick | 20 ticks/s |
| 状态广播 | 10–20 snapshots/s |
| 冷却、间隔 | 全部以秒记录 |

### 2.2 空间单位

| 项目 | 建议值 |
|---|---:|
| 地图单位 | pixel / Phaser world unit |
| 单个种植格宽度 | 96 px |
| 单个路线高度 | 72 px |
| 玩家碰撞半径 | 16 px |
| 普通敌人碰撞半径 | 18 px |
| Boss 碰撞半径 | 64 px |

### 2.3 路线与格子索引

| 项目 | 取值 |
|---|---|
| laneIndex | 0–4 |
| columnIndex | 0–6 |
| 路线数量 | 5 |
| 每路种植格 | 7 |
| 总种植格 | 35 |

推荐坐标方向：

```text
敌人出生侧：右侧
基地侧：左侧
敌人移动方向：从右向左
columnIndex 越小，越靠近基地
columnIndex 越大，越靠近敌人出生侧
```

---

## 3. Match 与阶段时间数值

### 3.1 单局时间目标

| 阶段 | 目标时长 |
|---|---:|
| Lobby | 不计入战斗时长 |
| Countdown | 3 秒 |
| Wave 1 | 35–45 秒 |
| Wave 2 | 40–50 秒 |
| Wave 3 | 50–60 秒 |
| Wave 4 | 55–70 秒 |
| Wave 5 | 65–85 秒 |
| Boss Prep | 20 秒 |
| Boss Fight | 90–150 秒 |
| 总战斗时长 | 5–8 分钟 |

### 3.2 阶段时间参数

| 参数 | 值 |
|---|---:|
| `countdownSeconds` | 3 |
| `wave1PrepSeconds` | 15 |
| `normalWavePrepSeconds` | 10 |
| `waveClearSeconds` | 5 |
| `bossPrepSeconds` | 20 |
| `resultDelaySeconds` | 3 |

### 3.3 基地数值

| 参数 | 值 |
|---|---:|
| `baseMaxHp` | 10 |
| 普通敌人突破伤害 | 1 |
| 快速敌人突破伤害 | 1 |
| 装甲敌人突破伤害 | 2 |
| Boss 到达基地伤害 | 5 |

设计说明：

- 基地 HP 10 可以容忍少量失误；
- 装甲敌人突破应明显更痛；
- Boss 到达基地不直接秒杀，避免最后阶段过于挫败，但 5 点伤害足够危险。

---

## 4. 共享阳光经济数值

### 4.1 初始阳光

| 参数 | 值 |
|---|---:|
| `initialSharedSun` | 150 |
| `maxSharedSun` | 无上限，V0.1 不设 cap |

设计说明：

150 阳光允许开局立刻做出选择：

- 3 个经济植物；
- 或 1 个经济植物 + 1 个输出植物；
- 或 1 个输出植物 + 1 个防御植物；
- 或保留资源应急。

### 4.2 阳光获得来源

| 来源 | 数值 |
|---|---:|
| 经济植物每次产出 | 25 阳光 |
| 经济植物首次产出延迟 | 6 秒 |
| 经济植物后续产出间隔 | 30 秒 |
| 普通敌人死亡掉落概率 | 20% |
| 快速敌人死亡掉落概率 | 20% |
| 装甲敌人死亡掉落概率 | 40% |
| 敌人掉落阳光量 | 25 阳光 |
| Boss 进入二阶段奖励 | 75 阳光 |

### 4.3 阳光消费项目

| 消费项目 | 消耗 |
|---|---:|
| 日光芽 / `sunbloom` | 50 |
| 豆荚炮 / `peashotter` | 100 |
| 木壳墙 / `barkwall` | 75 |
| 购买弹药 | 50 |
| 英雄进化 | 200 |

### 4.4 预期经济曲线

以下为一局普通通关的期望值，不要求完全精确，只用于调参判断。

| 阶段 | 预期共享阳光状态 |
|---|---|
| 开局 | 150 |
| Wave 1 结束 | 若种 2–3 个经济植物，通常回到 100–180 |
| Wave 2 结束 | 防线初步成型，阳光 100–250 |
| Wave 3 结束 | 可考虑第一名玩家进化，阳光可能降到 0–100 |
| Wave 4 结束 | 需要补输出或防御，阳光 50–200 |
| Wave 5 结束 | Boss 前应有 100–250，但取决于买弹药次数 |
| Boss 阶段 2 | 奖励 75，帮助补弹或补防御 |

### 4.5 经济压力校验

实现后用以下现象判断经济是否合理：

| 现象 | 说明 | 调整方向 |
|---|---|---|
| 玩家总是阳光溢出 | 资源压力不足 | 提高植物/弹药/进化成本，或降低产出 |
| 玩家几乎不能种植物 | 资源压力过高 | 提高初始阳光或经济植物产出 |
| 买弹药没有痛感 | 英雄火力太便宜 | 提高弹药价格或延长购买冷却 |
| 玩家从不进化 | 进化太贵或太弱 | 降低进化价格或增强进化效果 |
| 玩家只种经济植物也能活 | 前期敌人压力不足 | 提高 Wave 1–2 压力 |

---

## 5. 玩家英雄数值

### 5.1 英雄基础属性

| 参数 | 值 |
|---|---:|
| `heroMaxHp` | 100 |
| `heroMoveSpeed` | 170 px/s |
| `heroCollisionRadius` | 16 px |
| `heroInteractRange` | 90 px |
| `heroInvulnerableSecondsAfterHit` | 0.6 秒 |
| `heroRespawnSeconds` | 5 秒 |
| 复活后 HP | 100 |
| 复活后无敌 | 1.5 秒 |

### 5.2 英雄受伤规则数值

V0.1 敌人不主动追击英雄，但接触敌人或 Boss 技能会伤害英雄。

| 来源 | 伤害 | 冷却 |
|---|---:|---:|
| 普通敌人接触 | 8 | 1 秒 |
| 快速敌人接触 | 10 | 0.8 秒 |
| 装甲敌人接触 | 14 | 1 秒 |
| Boss 普通碰撞 | 20 | 1 秒 |
| Boss 重锤范围 | 30 | 每次技能 |
| Boss 冲锋命中 | 50 | 每次技能 |

设计说明：

- 英雄可以承受错误，但不能无视站位；
- Boss 冲锋命中英雄很痛，但不一定秒杀；
- 英雄死亡不直接失败，只制造短期压力。

---

## 6. 手枪与弹药数值

### 6.1 初始手枪

| 参数 | 值 |
|---|---:|
| `weaponId` | `pistol_v0` |
| 单发基础伤害 | 25 |
| 射速 | 3 发/秒 |
| 两次射击最小间隔 | 0.333 秒 |
| 弹匣容量 | 8 |
| 初始备弹 | 24 |
| 最大备弹 | 32 |
| 换弹时间 | 1.2 秒 |
| 子弹速度 | 520 px/s |
| 子弹生命周期 | 1.4 秒 |
| 子弹碰撞半径 | 5 px |
| 子弹穿透 | 0，命中后消失 |

### 6.2 初始弹药状态

| 项目 | 值 |
|---|---:|
| 开局弹匣 | 8 / 8 |
| 开局备弹 | 24 / 32 |
| 开局总可用子弹 | 32 |

两名玩家合计开局总子弹：64 发。

如果全部命中普通敌人，理论总伤害：

```text
64 × 25 = 1600 damage
```

这说明 Boss HP 不能太低，否则英雄可以无脑射死 Boss。Phase 14 首轮试玩后 Boss HP 调整为 6000，并通过弱点、打断、召唤小怪让弹药管理产生压力。

### 6.3 弹药购买

| 参数 | 值 |
|---|---:|
| `ammoPackSunCost` | 50 |
| `ammoPackReserveGain` | 16 |
| `ammoPurchaseCooldownSeconds` | 10 |
| 是否可超过最大备弹 | 否 |
| 备弹满时是否可购买 | 否 |

设计说明：

- 50 阳光 = 一个经济植物成本；
- 买弹药会直接影响防线建设；
- 16 发子弹 = 两个弹匣，足够救急但不是无限续航。

### 6.4 射击体验校验

| 现象 | 说明 | 调整方向 |
|---|---|---|
| 英雄几乎不用植物就能清场 | 枪太强 | 降低伤害、备弹或提高敌人 HP |
| 英雄经常完全没事做 | 枪太弱或敌人太慢 | 提高英雄伤害或增加快速敌人 |
| 玩家总是没子弹且无法补 | 弹药经济过紧 | 降低弹药价格或提高备弹上限 |
| 换弹毫无压力 | 换弹太快 | 提高 reload 到 1.4–1.6 秒 |
| 换弹过于痛苦 | 换弹太慢 | 降低 reload 到 1.0 秒 |

---

## 7. 植物数值

### 7.1 植物总表

| 植物 ID | 中文名 | 成本 | HP | 攻击 | 间隔 | 特殊功能 |
|---|---|---:|---:|---:|---:|---|
| `sunbloom` | 日光芽 | 50 | 80 | 0 | - | 产出阳光 |
| `peashotter` | 豆荚炮 | 100 | 110 | 20 | 1.2 秒 | 本路持续输出 |
| `barkwall` | 木壳墙 | 75 | 450 | 0 | - | 阻挡敌人 |

### 7.2 日光芽 / `sunbloom`

| 参数 | 值 |
|---|---:|
| 成本 | 50 |
| HP | 80 |
| 首次产出延迟 | 6 秒 |
| 后续产出间隔 | 30 秒 |
| 每次产出 | 25 阳光 |
| 是否自动收集 | 是 |

设计说明：

- 一个日光芽理论上 36 秒回本；
- 过早被敌人打掉会造成明显经济损失；
- 自动收集降低实现成本和操作负担。

### 7.3 豆荚炮 / `peashotter`

| 参数 | 值 |
|---|---:|
| 成本 | 100 |
| HP | 110 |
| 单发伤害 | 20 |
| 攻击间隔 | 1.2 秒 |
| 理论 DPS | 16.67 |
| 豌豆弹速度 | 360 px/s |
| 豌豆弹生命周期 | 2.2 秒 |
| 攻击路线 | 仅本路线 |
| 攻击目标 | 本路最靠近基地的敌人 |

设计说明：

- 单个豆荚炮击杀普通敌人需要约 5 发；
- 如果从第一发立即攻击，击杀普通敌人约需 4.8–6 秒；
- 两个豆荚炮同路可以较稳定处理普通敌人；
- 对装甲敌人需要时间，因此需要木壳墙或英雄补伤害。

### 7.4 木壳墙 / `barkwall`

| 参数 | 值 |
|---|---:|
| 成本 | 75 |
| HP | 450 |
| 攻击 | 无 |
| 是否阻挡普通敌人 | 是 |
| 是否阻挡 Boss | Boss 可以攻击或冲锋破坏 |

设计说明：

- 木壳墙应能挡住多个普通敌人一段时间；
- 它不能造成伤害，因此必须配合输出植物；
- Boss 二阶段冲锋应能重创或摧毁木壳墙，制造压力。

### 7.5 植物被攻击承受能力参考

| 攻击来源 | 对日光芽威胁 | 对豆荚炮威胁 | 对木壳墙威胁 |
|---|---|---|---|
| 普通敌人 | 4 秒左右打死 | 6 秒左右打死 | 22 秒左右打死 |
| 快速敌人 | 约 4.3 秒打死 | 约 5.9 秒打死 | 24 秒左右打死 |
| 装甲敌人 | 约 3.2 秒打死 | 约 4.4 秒打死 | 18 秒左右打死 |
| Boss 重锤 | 可能秒杀 | 可能秒杀 | 重创但不秒杀 |

---

## 8. 敌人数值

### 8.1 敌人总表

| 敌人 ID | 中文名 | HP | 移速 | 攻击伤害 | 攻击间隔 | 基地伤害 | 掉落概率 |
|---|---|---:|---:|---:|---:|---:|---:|
| `shambler` | 污染游荡者 | 100 | 34 px/s | 20 | 1.0 秒 | 1 | 20% |
| `runner` | 疾行污染体 | 70 | 66 px/s | 15 | 0.8 秒 | 1 | 20% |
| `brute` | 铁壳污染体 | 260 | 24 px/s | 25 | 1.0 秒 | 2 | 40% |

### 8.2 普通敌人 / `shambler`

| 参数 | 值 |
|---|---:|
| HP | 100 |
| 移动速度 | 34 px/s |
| 攻击植物伤害 | 20 |
| 攻击间隔 | 1.0 秒 |
| 接触英雄伤害 | 8 |
| 接触英雄伤害冷却 | 1.0 秒 |
| 基地伤害 | 1 |
| 阳光掉落概率 | 20% |
| 阳光掉落量 | 25 |

设计目标：基础压力单位。

### 8.3 快速敌人 / `runner`

| 参数 | 值 |
|---|---:|
| HP | 70 |
| 移动速度 | 66 px/s |
| 攻击植物伤害 | 15 |
| 攻击间隔 | 0.8 秒 |
| 接触英雄伤害 | 10 |
| 接触英雄伤害冷却 | 0.8 秒 |
| 基地伤害 | 1 |
| 阳光掉落概率 | 20% |
| 阳光掉落量 | 25 |

设计目标：逼英雄救场，打乱静态防线。

### 8.4 装甲敌人 / `brute`

| 参数 | 值 |
|---|---:|
| HP | 260 |
| 移动速度 | 24 px/s |
| 攻击植物伤害 | 25 |
| 攻击间隔 | 1.0 秒 |
| 接触英雄伤害 | 14 |
| 接触英雄伤害冷却 | 1.0 秒 |
| 基地伤害 | 2 |
| 阳光掉落概率 | 40% |
| 阳光掉落量 | 25 |

设计目标：检查输出植物数量和木壳墙使用。

### 8.5 敌人 TTK 参考

TTK = Time To Kill，击杀所需时间。以下为近似参考。

| 目标 | 1 个豆荚炮 | 2 个豆荚炮 | 1 名英雄连续射击 | 2 名英雄连续射击 |
|---|---:|---:|---:|---:|
| 普通敌人 100 HP | 约 5–6 秒 | 约 2.4–3 秒 | 约 1.3 秒，4 发 | 约 0.7 秒 |
| 快速敌人 70 HP | 约 3.6–4.8 秒 | 约 2.4 秒 | 约 1 秒，3 发 | 约 0.4–0.7 秒 |
| 装甲敌人 260 HP | 约 15–16 秒 | 约 7–8 秒 | 约 3.6 秒，11 发 | 约 1.8 秒 |

设计判断：

- 普通敌人主要由植物处理；
- 快速敌人适合英雄补枪；
- 装甲敌人可以被英雄打掉，但弹药消耗明显，不能长期这样处理。

---

## 9. 英雄进化数值

### 9.1 进化通用规则

| 参数 | 值 |
|---|---:|
| 解锁时机 | Wave 3 清理完成 |
| 进化消耗 | 200 阳光 |
| 每名玩家进化次数 | 1 次 |
| 进化是否补满弹药 | 否 |
| 进化是否恢复 HP | 否 |

### 9.2 火力进化 / `firepower`

| 效果 | 数值 |
|---|---:|
| 手枪伤害 | 25 → 35 |
| 弹匣容量 | 8 → 10 |
| 最大备弹 | 32 → 36 |
| Boss 弱点伤害倍率 | 2.0x → 2.5x |
| 射速 | 不变 |
| 换弹时间 | 不变 |

设计目标：提升 Boss 输出与精英处理能力。

注意：进化不自动补弹。弹匣容量变大后，当前弹匣不自动补满，只提高上限。

### 9.3 控制进化 / `control`

| 效果 | 数值 |
|---|---:|
| 普通命中减速 | 20% |
| 减速持续时间 | 1.5 秒 |
| 命中快速敌人减速 | 35% |
| 快速敌人减速持续时间 | 1.5 秒 |
| Boss 弱点命中打断值 | 默认 +1 |
| 控制路线额外打断值 | 每次 Boss 读条最多额外 +2 |
| 子弹伤害 | 不变 |

打断计算示例：

```text
普通英雄命中 Boss 弱点：interruptProgress += 1
控制英雄命中 Boss 弱点：interruptProgress += 2，直到本次读条额外加成累计达到 +2
之后控制英雄每发仍然只 +1
```

设计目标：让控制玩家在 Boss 打断中有明显价值，但不能单人无限打断。

### 9.4 支援进化 / `support`

| 效果 | 数值 |
|---|---:|
| 弹药购买价格 | 50 → 40 阳光 |
| 弹药购买冷却 | 10 秒 → 8 秒 |
| 击杀阳光掉落概率加成 | +10% |
| 附近植物护盾值 | 40 |
| 护盾触发距离 | 80 px |
| 护盾持续时间 | 3 秒 |
| 护盾冷却 | 12 秒 |

护盾规则：

- 支援英雄靠近一个植物并停留 2 秒后，给该植物 40 点临时护盾；
- 同一时间每名支援英雄只能维护一个护盾目标；
- 护盾优先承受伤害；
- 护盾不能叠加刷新成无限高；
- V0.1 如果实现成本过高，可先只实现弹药折扣和掉落概率加成，护盾作为 Phase Polish。

---

## 10. 普通波次刷怪脚本

## 10.1 波次总览

| 波次 | 目标 | 敌人总数 | 推荐时长 |
|---|---|---:|---:|
| Wave 1 | 基础教学 | 6 | 35–45 秒 |
| Wave 2 | 普通压力 | 9 | 40–50 秒 |
| Wave 3 | 引入快速敌人 | 12 | 50–60 秒 |
| Wave 4 | 引入装甲敌人 | 14 | 55–70 秒 |
| Wave 5 | 混合压力 | 21 | 65–85 秒 |

### 10.2 刷怪时间字段说明

所有 `time` 均为当前波次 `WAVE_ACTIVE` 开始后的秒数。

```ts
type SpawnEvent = {
  time: number;
  lane: 0 | 1 | 2 | 3 | 4;
  enemyType: "shambler" | "runner" | "brute";
  count?: number;
  interval?: number;
};
```

如果 `count` > 1，则同一路按 `interval` 连续生成。

---

## 10.3 Wave 1：基础教学

目标：让玩家理解种植、射击和基地压力。

| 时间 | 路线 | 敌人 |
|---:|---:|---|
| 0 | 2 | 1 × 普通 |
| 6 | 1 | 1 × 普通 |
| 12 | 3 | 1 × 普通 |
| 18 | 0 | 1 × 普通 |
| 24 | 4 | 1 × 普通 |
| 30 | 2 | 1 × 普通 |

总数：6 普通。

Wave 1 不应失败，除非玩家完全不操作。

---

## 10.4 Wave 2：普通压力增加

目标：让玩家开始需要每路分配输出。

| 时间 | 路线 | 敌人 |
|---:|---:|---|
| 0 | 1 | 1 × 普通 |
| 3 | 3 | 1 × 普通 |
| 8 | 2 | 1 × 普通 |
| 12 | 0 | 1 × 普通 |
| 16 | 4 | 1 × 普通 |
| 21 | 1 | 1 × 普通 |
| 24 | 3 | 1 × 普通 |
| 29 | 2 | 1 × 普通 |
| 34 | 0 | 1 × 普通 |

总数：9 普通。

---

## 10.5 Wave 3：快速敌人登场

目标：让英雄救场成为必要行为，并在清理后解锁进化。

| 时间 | 路线 | 敌人 |
|---:|---:|---|
| 0 | 2 | 1 × 普通 |
| 4 | 1 | 1 × 普通 |
| 8 | 3 | 1 × 快速 |
| 12 | 0 | 1 × 普通 |
| 16 | 4 | 1 × 快速 |
| 20 | 2 | 1 × 普通 |
| 24 | 1 | 1 × 快速 |
| 28 | 3 | 1 × 普通 |
| 32 | 0 | 1 × 普通 |
| 36 | 4 | 1 × 普通 |
| 40 | 2 | 1 × 快速 |
| 44 | 1 | 1 × 普通 |

总数：8 普通 + 4 快速。

Wave 3 清理完成后：

```text
evolutionUnlocked = true
```

---

## 10.6 Wave 4：装甲敌人登场

目标：检查木壳墙和输出植物是否足够。

| 时间 | 路线 | 敌人 |
|---:|---:|---|
| 0 | 2 | 1 × 装甲 |
| 5 | 1 | 1 × 普通 |
| 8 | 3 | 1 × 普通 |
| 12 | 0 | 1 × 快速 |
| 16 | 4 | 1 × 普通 |
| 20 | 2 | 1 × 普通 |
| 24 | 1 | 1 × 装甲 |
| 29 | 3 | 1 × 快速 |
| 34 | 0 | 1 × 普通 |
| 39 | 4 | 1 × 装甲 |
| 44 | 2 | 1 × 普通 |
| 48 | 1 | 1 × 普通 |
| 52 | 3 | 1 × 普通 |
| 56 | 0 | 1 × 快速 |

总数：8 普通 + 3 快速 + 3 装甲。

---

## 10.7 Wave 5：Boss 前混合压力

目标：消耗弹药、阳光和植物 HP，为 Boss 战制造压力。

| 时间 | 路线 | 敌人 |
|---:|---:|---|
| 0 | 0 | 1 × 普通 |
| 2 | 4 | 1 × 普通 |
| 5 | 2 | 1 × 装甲 |
| 8 | 1 | 1 × 快速 |
| 11 | 3 | 1 × 快速 |
| 15 | 0 | 1 × 普通 |
| 18 | 4 | 1 × 普通 |
| 22 | 1 | 1 × 装甲 |
| 26 | 3 | 1 × 普通 |
| 30 | 2 | 1 × 快速 |
| 34 | 0 | 1 × 快速 |
| 38 | 4 | 1 × 装甲 |
| 42 | 1 | 1 × 普通 |
| 45 | 3 | 1 × 普通 |
| 49 | 2 | 1 × 普通 |
| 53 | 0 | 1 × 装甲 |
| 57 | 4 | 1 × 快速 |
| 61 | 1 | 1 × 普通 |
| 64 | 3 | 1 × 普通 |
| 68 | 2 | 1 × 普通 |
| 72 | 2 | 1 × 装甲 |

总数：10 普通 + 5 快速 + 6 装甲。

注意：如果初版太难，可以把 Wave 5 的装甲数量从 6 降到 4。

---

## 11. Boss 数值

### 11.1 Boss 基础设定

| 参数 | 值 |
|---|---:|
| Boss ID | `ironmaw_siege_beast` |
| 中文暂名 | 铁颚攻城兽 |
| 最大 HP | 6000 |
| 阶段 2 阈值 | 3000 HP，50% |
| 阶段 1 移速 | 8 px/s |
| 阶段 2 移速 | 11 px/s |
| Boss 主路线 | lane 2 |
| Boss 可被植物攻击路线 | lane 1、2、3 |
| Boss 碰撞半径 | 64 px |
| Boss 到达基地伤害 | 5 |

设计说明：

- Boss 可被中间三路植物攻击，避免只有中路植物有价值；
- 边路仍然重要，因为 Boss 会召唤小怪；
- 6000 HP 让英雄不能只靠开局弹药秒杀 Boss。

### 11.2 Boss 伤害接收规则

| 来源 | 效果 |
|---|---|
| 豆荚炮命中 Boss | 造成普通伤害 20 |
| 英雄普通命中 Boss | 造成手枪基础伤害 |
| 英雄命中弱点 | 默认 2.0x 伤害 |
| 火力进化命中弱点 | 2.5x 伤害 |
| 植物命中弱点 | 不触发弱点倍率 |
| 控制进化命中弱点 | 伤害不变，但打断收益提高 |

### 11.3 Boss 阶段 1 技能

Boss 阶段 1 从 6000 HP 到 3001 HP。

#### 技能 A：重锤攻击 / `hammer_slam`

| 参数 | 值 |
|---|---:|
| 首次释放时间 | Boss 入场后 8 秒 |
| 冷却 | 10 秒 |
| 目标 | Boss 前方最近植物 |
| 对日光芽伤害 | 150 |
| 对豆荚炮伤害 | 150 |
| 对木壳墙伤害 | 120 |
| 对英雄范围伤害 | 30 |
| 范围提示时间 | 0.8 秒 |

设计说明：

- 重锤会秒杀非防御植物，逼玩家用木壳墙承伤；
- 给 0.8 秒提示，让英雄有机会躲避。

#### 技能 B：召唤污染体 / `summon_minions`

| 参数 | 值 |
|---|---:|
| 首次释放时间 | Boss 入场后 12 秒 |
| 冷却 | 14 秒 |
| 召唤数量 | 2 |
| 召唤类型 | 普通敌人 |
| 召唤路线 | 随机 2 条不同路线，优先非 Boss 主路线 |

#### 技能 C：弱点暴露 / `weakpoint_expose`

| 参数 | 值 |
|---|---:|
| 首次暴露时间 | Boss 入场后 6 秒 |
| 冷却 | 12 秒 |
| 持续时间 | 3 秒 |
| 英雄命中伤害倍率 | 2.0x |
| 火力进化命中倍率 | 2.5x |
| 是否影响打断 | 阶段 1 不需要打断，只提供伤害收益 |

### 11.4 Boss 阶段转换

当 Boss HP <= 3000：

| 效果 | 数值 |
|---|---:|
| 阶段转换停顿 | 2 秒 |
| 队伍阳光奖励 | 75 |
| Boss 移速提升 | 8 → 11 px/s |
| 解锁冲锋读条 | 是 |
| 召唤敌人升级 | 普通 + 快速 |
| 弱点暴露频率 | 更频繁 |

阶段转换只触发一次。

### 11.5 Boss 阶段 2 技能

Boss 阶段 2 从 3000 HP 到 0 HP。

#### 技能 D：冲锋读条 / `charge_windup`

| 参数 | 值 |
|---|---:|
| 首次释放时间 | 阶段 2 开始后 2 秒 |
| 冷却 | 16 秒 |
| 读条时间 | 3 秒 |
| 打断需求 | 6 interrupt points |
| 普通英雄弱点命中 | +1 point |
| 控制英雄弱点命中 | +2 point，受额外上限约束 |
| 失败冲锋距离 | 120 px |
| 对第一个植物伤害 | 350 |
| 对英雄命中伤害 | 50 |
| 冲锋后硬直 | 1.5 秒 |

控制进化额外上限：

```text
每次冲锋读条中，控制进化最多额外贡献 +2 point。
```

也就是说，控制英雄前两次弱点命中相当于每次 +2，之后每次 +1。

#### 技能 E：快速召唤 / `summon_runners`

| 参数 | 值 |
|---|---:|
| 首次释放时间 | 阶段 2 开始后 10 秒 |
| 冷却 | 12 秒 |
| 召唤数量 | 2 |
| 召唤组合 | 1 普通 + 1 快速，或 2 快速 |
| 召唤路线 | 随机 2 条不同路线 |

#### 技能 F：阳光压制 / `sun_suppression`

| 参数 | 值 |
|---|---:|
| 首次释放时间 | 阶段 2 开始后 14 秒 |
| 冷却 | 22 秒 |
| 压制持续时间 | 5 秒 |
| 效果 | 所有经济植物暂停产出 |
| UI 提示 | 必须明显显示 |

设计说明：

- 阳光压制不直接扣阳光；
- 它制造 Boss 阶段资源紧张；
- 实现复杂时可先只做 UI + 暂停产出。

### 11.6 Boss 战难度调节

| 问题 | 调整方向 |
|---|---|
| Boss 太容易被射死 | 提高 HP，或减少弱点持续时间 |
| Boss 太肉太拖 | 降低 HP |
| 打断太容易 | 打断需求从 6 提到 7 或降低读条时间 |
| 打断太难 | 打断需求从 6 降到 5 或延长读条到 3.5 秒 |
| 防线瞬间崩 | 降低 Boss 重锤伤害或召唤频率 |
| Boss 没压迫感 | 提高阶段 2 移速或缩短冲锋冷却 |

---

## 12. 投射物数值

### 12.1 英雄子弹

| 参数 | 值 |
|---|---:|
| 类型 | `hero_bullet` |
| 速度 | 520 px/s |
| 半径 | 5 px |
| 生命周期 | 1.4 秒 |
| 伤害 | 来自武器配置 |
| 穿透 | 0 |
| 命中后销毁 | 是 |
| 可命中目标 | 敌人、Boss、Boss 弱点 |

### 12.2 豌豆弹

| 参数 | 值 |
|---|---:|
| 类型 | `pea_projectile` |
| 速度 | 360 px/s |
| 半径 | 6 px |
| 生命周期 | 2.2 秒 |
| 伤害 | 20 |
| 穿透 | 0 |
| 命中后销毁 | 是 |
| 可命中目标 | 同路线敌人、Boss 本体 |

### 12.3 投射物碰撞优先级

同一 Tick 多个目标重叠时：

1. 优先命中距离投射物最近的有效目标；
2. 英雄子弹在 Boss 弱点激活时优先检测弱点；
3. 豌豆弹不检测弱点，只检测 Boss 本体；
4. 已死亡目标不再被命中。

---

## 13. 关卡整体敌人数量与预期收益

### 13.1 普通波次敌人总数

| 类型 | Wave 1 | Wave 2 | Wave 3 | Wave 4 | Wave 5 | 合计 |
|---|---:|---:|---:|---:|---:|---:|
| 普通 | 6 | 9 | 8 | 8 | 10 | 41 |
| 快速 | 0 | 0 | 4 | 3 | 5 | 12 |
| 装甲 | 0 | 0 | 0 | 3 | 6 | 9 |
| 总数 | 6 | 9 | 12 | 14 | 21 | 62 |

### 13.2 普通波次阳光掉落期望

| 类型 | 数量 | 掉落概率 | 单次掉落 | 期望阳光 |
|---|---:|---:|---:|---:|
| 普通 | 41 | 20% | 25 | 205 |
| 快速 | 12 | 20% | 25 | 60 |
| 装甲 | 9 | 40% | 25 | 90 |
| 合计 | 62 | - | - | 355 |

Boss 小怪还会额外提供少量阳光期望，但不应作为主要经济来源。

### 13.3 防线建设参考支出

一个合理通关配置可能包含：

| 项目 | 数量 | 单价 | 合计 |
|---|---:|---:|---:|
| 日光芽 | 4 | 50 | 200 |
| 豆荚炮 | 6 | 100 | 600 |
| 木壳墙 | 4 | 75 | 300 |
| 两名英雄进化 | 2 | 200 | 400 |
| 弹药购买 | 4 | 50 | 200 |
| 合计 | - | - | 1700 |

经济来源大致包括：

| 来源 | 估计 |
|---|---:|
| 初始阳光 | 150 |
| 敌人掉落期望 | 355 |
| 经济植物产出 | 900–1200，取决于种植时机与存活 |
| Boss 阶段奖励 | 75 |
| 总计 | 1480–1780 |

结论：如果玩家能较早种经济植物并保护它们，就能完成主要建设；如果经济植物频繁被打掉，Boss 前会明显缺资源。

---

## 14. 难度档位参数

V0.1 可以先只实现 Normal，但建议保留难度倍率。

### 14.1 难度倍率

| 难度 | 敌人 HP | 敌人速度 | 敌人伤害 | 掉落阳光 | Boss HP |
|---|---:|---:|---:|---:|---:|
| Easy | 0.85x | 0.9x | 0.85x | 1.15x | 0.85x |
| Normal | 1.0x | 1.0x | 1.0x | 1.0x | 1.0x |
| Hard | 1.2x | 1.08x | 1.15x | 0.9x | 1.2x |

V0.1 默认：Normal。

### 14.2 为什么不先做复杂难度系统

难度系统只作为配置预留，不需要 UI 暴露。

原因：

- 先验证 Normal；
- 避免增加测试矩阵；
- 后续可快速开 Easy/Hard。

---

## 15. 推荐配置结构

Codex 实现时，所有数值必须数据驱动，不要散落在代码中。

推荐文件：

```text
shared/config/combatNumbers.ts
```

### 15.1 TypeScript 配置草案

```ts
export const CombatNumbersV01 = {
  match: {
    countdownSeconds: 3,
    wave1PrepSeconds: 15,
    normalWavePrepSeconds: 10,
    waveClearSeconds: 5,
    bossPrepSeconds: 20,
    resultDelaySeconds: 3,
  },

  base: {
    maxHp: 10,
  },

  economy: {
    initialSharedSun: 150,
    sunDropAmount: 25,
    bossPhase2SunReward: 75,
  },

  hero: {
    maxHp: 100,
    moveSpeed: 170,
    collisionRadius: 16,
    interactRange: 90,
    invulnerableAfterHitSeconds: 0.6,
    respawnSeconds: 5,
    respawnInvulnerableSeconds: 1.5,
  },

  weapon: {
    pistol: {
      damage: 25,
      fireRatePerSecond: 3,
      magazineSize: 8,
      initialReserveAmmo: 24,
      maxReserveAmmo: 32,
      reloadSeconds: 1.2,
      bulletSpeed: 520,
      bulletLifetimeSeconds: 1.4,
      bulletRadius: 5,
    },
    ammoPack: {
      sunCost: 50,
      reserveGain: 16,
      cooldownSeconds: 10,
    },
  },

  plants: {
    sunbloom: {
      sunCost: 50,
      maxHp: 80,
      firstProduceDelaySeconds: 6,
      produceIntervalSeconds: 30,
      produceAmount: 25,
    },
    peashotter: {
      sunCost: 100,
      maxHp: 110,
      damage: 20,
      attackIntervalSeconds: 1.2,
      projectileSpeed: 360,
      projectileLifetimeSeconds: 2.2,
      projectileRadius: 6,
    },
    barkwall: {
      sunCost: 75,
      maxHp: 450,
    },
  },

  enemies: {
    shambler: {
      maxHp: 100,
      moveSpeed: 34,
      plantDamage: 20,
      plantAttackIntervalSeconds: 1.0,
      heroContactDamage: 8,
      heroContactCooldownSeconds: 1.0,
      baseDamage: 1,
      sunDropChance: 0.2,
    },
    runner: {
      maxHp: 70,
      moveSpeed: 66,
      plantDamage: 15,
      plantAttackIntervalSeconds: 0.8,
      heroContactDamage: 10,
      heroContactCooldownSeconds: 0.8,
      baseDamage: 1,
      sunDropChance: 0.2,
    },
    brute: {
      maxHp: 260,
      moveSpeed: 24,
      plantDamage: 25,
      plantAttackIntervalSeconds: 1.0,
      heroContactDamage: 14,
      heroContactCooldownSeconds: 1.0,
      baseDamage: 2,
      sunDropChance: 0.4,
    },
  },

  evolution: {
    unlockAfterWaveCleared: 3,
    sunCost: 200,
    firepower: {
      pistolDamage: 35,
      magazineSize: 10,
      maxReserveAmmo: 36,
      weakPointMultiplier: 2.5,
    },
    control: {
      slowPercent: 0.2,
      runnerSlowPercent: 0.35,
      slowDurationSeconds: 1.5,
      bonusInterruptPointsPerChargeMax: 2,
    },
    support: {
      ammoPackSunCost: 40,
      ammoPurchaseCooldownSeconds: 8,
      sunDropChanceBonus: 0.1,
      shieldValue: 40,
      shieldRange: 80,
      shieldDurationSeconds: 3,
      shieldCooldownSeconds: 12,
    },
  },

  boss: {
    ironmaw: {
      maxHp: 6000,
      phase2HpThreshold: 3000,
      phase1MoveSpeed: 8,
      phase2MoveSpeed: 11,
      mainLane: 2,
      plantDamageLanes: [1, 2, 3],
      collisionRadius: 64,
      baseDamage: 5,
      weakPointMultiplier: 2.0,
      hammerSlam: {
        firstCastSeconds: 8,
        cooldownSeconds: 10,
        damageToNonWallPlant: 150,
        damageToWallPlant: 120,
        damageToHero: 30,
        warningSeconds: 0.8,
      },
      summonMinions: {
        firstCastSeconds: 12,
        cooldownSeconds: 14,
        count: 2,
      },
      weakPointExpose: {
        firstCastSeconds: 6,
        cooldownSeconds: 12,
        durationSeconds: 3,
      },
      phaseTransition: {
        stunSeconds: 2,
        teamSunReward: 75,
      },
      charge: {
        firstCastAfterPhase2Seconds: 2,
        cooldownSeconds: 16,
        windupSeconds: 3,
        requiredInterruptPoints: 6,
        failedChargeDistance: 120,
        damageToFirstPlant: 350,
        damageToHero: 50,
        recoverySeconds: 1.5,
      },
      phase2Summon: {
        firstCastAfterPhase2Seconds: 10,
        cooldownSeconds: 12,
        count: 2,
      },
      sunSuppression: {
        firstCastAfterPhase2Seconds: 14,
        cooldownSeconds: 22,
        durationSeconds: 5,
      },
    },
  },
} as const;
```

---

## 16. 波次配置草案

推荐文件：

```text
shared/config/wavesV01.ts
```

```ts
export const WavesV01 = [
  {
    wave: 1,
    events: [
      { time: 0, lane: 2, enemyType: "shambler" },
      { time: 6, lane: 1, enemyType: "shambler" },
      { time: 12, lane: 3, enemyType: "shambler" },
      { time: 18, lane: 0, enemyType: "shambler" },
      { time: 24, lane: 4, enemyType: "shambler" },
      { time: 30, lane: 2, enemyType: "shambler" },
    ],
  },
  {
    wave: 2,
    events: [
      { time: 0, lane: 1, enemyType: "shambler" },
      { time: 3, lane: 3, enemyType: "shambler" },
      { time: 8, lane: 2, enemyType: "shambler" },
      { time: 12, lane: 0, enemyType: "shambler" },
      { time: 16, lane: 4, enemyType: "shambler" },
      { time: 21, lane: 1, enemyType: "shambler" },
      { time: 24, lane: 3, enemyType: "shambler" },
      { time: 29, lane: 2, enemyType: "shambler" },
      { time: 34, lane: 0, enemyType: "shambler" },
    ],
  },
  {
    wave: 3,
    events: [
      { time: 0, lane: 2, enemyType: "shambler" },
      { time: 4, lane: 1, enemyType: "shambler" },
      { time: 8, lane: 3, enemyType: "runner" },
      { time: 12, lane: 0, enemyType: "shambler" },
      { time: 16, lane: 4, enemyType: "runner" },
      { time: 20, lane: 2, enemyType: "shambler" },
      { time: 24, lane: 1, enemyType: "runner" },
      { time: 28, lane: 3, enemyType: "shambler" },
      { time: 32, lane: 0, enemyType: "shambler" },
      { time: 36, lane: 4, enemyType: "shambler" },
      { time: 40, lane: 2, enemyType: "runner" },
      { time: 44, lane: 1, enemyType: "shambler" },
    ],
  },
  {
    wave: 4,
    events: [
      { time: 0, lane: 2, enemyType: "brute" },
      { time: 5, lane: 1, enemyType: "shambler" },
      { time: 8, lane: 3, enemyType: "shambler" },
      { time: 12, lane: 0, enemyType: "runner" },
      { time: 16, lane: 4, enemyType: "shambler" },
      { time: 20, lane: 2, enemyType: "shambler" },
      { time: 24, lane: 1, enemyType: "brute" },
      { time: 29, lane: 3, enemyType: "runner" },
      { time: 34, lane: 0, enemyType: "shambler" },
      { time: 39, lane: 4, enemyType: "brute" },
      { time: 44, lane: 2, enemyType: "shambler" },
      { time: 48, lane: 1, enemyType: "shambler" },
      { time: 52, lane: 3, enemyType: "shambler" },
      { time: 56, lane: 0, enemyType: "runner" },
    ],
  },
  {
    wave: 5,
    events: [
      { time: 0, lane: 0, enemyType: "shambler" },
      { time: 2, lane: 4, enemyType: "shambler" },
      { time: 5, lane: 2, enemyType: "brute" },
      { time: 8, lane: 1, enemyType: "runner" },
      { time: 11, lane: 3, enemyType: "runner" },
      { time: 15, lane: 0, enemyType: "shambler" },
      { time: 18, lane: 4, enemyType: "shambler" },
      { time: 22, lane: 1, enemyType: "brute" },
      { time: 26, lane: 3, enemyType: "shambler" },
      { time: 30, lane: 2, enemyType: "runner" },
      { time: 34, lane: 0, enemyType: "runner" },
      { time: 38, lane: 4, enemyType: "brute" },
      { time: 42, lane: 1, enemyType: "shambler" },
      { time: 45, lane: 3, enemyType: "shambler" },
      { time: 49, lane: 2, enemyType: "shambler" },
      { time: 53, lane: 0, enemyType: "brute" },
      { time: 57, lane: 4, enemyType: "runner" },
      { time: 61, lane: 1, enemyType: "shambler" },
      { time: 64, lane: 3, enemyType: "shambler" },
      { time: 68, lane: 2, enemyType: "shambler" },
      { time: 72, lane: 2, enemyType: "brute" },
    ],
  },
] as const;
```

---

## 17. 平衡验收清单

### 17.1 最小人工测试

Codex 完成实现后，至少进行以下测试：

| 测试 | 期望结果 |
|---|---|
| 两名玩家正常种经济植物 | Wave 2 后资源开始增长 |
| 完全不种输出植物 | Wave 3–4 明显吃力 |
| 完全不买弹药 | Boss 二阶段打断困难 |
| 只买弹药不种植物 | Wave 4–5 防线崩溃 |
| 两名玩家都进化火力 | Boss 输出高，但资源压力明显 |
| 一火力一控制 | Boss 打断最稳定 |
| 一火力一支援 | 弹药经济更舒服，但控场较弱 |
| Boss 冲锋不打断 | 至少重创一个植物，造成明显惩罚 |
| Boss 冲锋成功打断 | 玩家获得明显正反馈 |

### 17.2 自动化或日志指标

建议记录：

| 指标 | 理想区间 |
|---|---:|
| 一局总时长 | 300–480 秒 |
| 玩家总弹药购买次数 | 3–6 次 |
| 总种植数量 | 10–18 个 |
| 总阳光获得 | 1400–1900 |
| 总阳光消耗 | 1200–1800 |
| Boss 战时长 | 90–150 秒 |
| 基地剩余 HP | 1–7 |
| 玩家死亡次数 | 0–4 次 |
| Boss 冲锋打断成功率 | 40%–80% |

### 17.3 调参优先级

如果试玩体验不理想，按以下顺序调参：

1. 敌人数量和刷怪时间；
2. 经济植物产出；
3. 弹药购买价格和冷却；
4. Boss HP；
5. Boss 打断需求；
6. 植物伤害与 HP；
7. 英雄伤害。

不要一开始乱改所有数值。每次只改一个维度，记录结果。

---

## 18. 当前版本最终判断

这套 V0.1 初始数值有意制造以下压力：

- 前期鼓励种经济植物；
- 中期快速敌人逼英雄动起来；
- 装甲敌人逼玩家建立防线；
- 共享阳光让买弹药和种植物产生冲突；
- 进化是大额投资，不能无脑点；
- Boss HP 和打断机制迫使玩家保留弹药并合作射击弱点。

这不是最终平衡，而是第一套可以直接进入 Codex 实现、试玩和日志调参的数值基线。
