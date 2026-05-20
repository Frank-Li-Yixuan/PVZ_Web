# V0_2_BACKLOG.md

# 双人合作枪械英雄塔防 V0.2+ 功能 Backlog

## 0. 文档目的

本文档用于收纳所有**超出 V0.1 范围**的功能想法、系统扩展、内容扩展、商业化方向、技术优化和长期版本规划。

它的核心作用不是催促 Codex 提前实现新功能，而是防止 V0.1 开发期间发生范围膨胀。

V0.1 当前唯一目标：

> 做出一个稳定可玩的双人 Web 联机垂直切片：共享阳光、三种植物、三种敌人、枪械英雄、五波进攻、一次进化、一个两阶段 Boss、胜负结算。

所有不属于这个目标的想法，都必须先进入本文档，而不是直接实现。

---

## 1. Backlog 使用规则

### 1.1 Codex 硬性规则

Codex 在 V0.1 阶段遇到新想法时，只允许：

1. 记录到 `V0_2_BACKLOG.md`；
2. 标注为什么不是 V0.1；
3. 标注依赖；
4. 标注风险；
5. 标注建议优先级。

Codex 不允许直接实现本文档中的任何功能，除非用户明确说：

> 现在进入 V0.2，开始实现某个 Backlog 项。

### 1.2 Backlog 项格式

每个 Backlog 项使用以下格式：

```md
## [ID] Feature Name

- Category:
- Priority:
- Target Version:
- Description:
- Why not V0.1:
- Dependencies:
- Design Risk:
- Technical Risk:
- MVP Cut:
- Acceptance Idea:
- Notes:
```

### 1.3 Priority 定义

| 优先级 | 含义 |
|---|---|
| P0 | V0.2 最优先，直接增强核心可玩性 |
| P1 | 很重要，但可在 P0 后做 |
| P2 | 有价值的扩展内容 |
| P3 | 长期想法，暂不急 |
| Research | 需要先调研或验证，不确定是否做 |

### 1.4 Target Version 定义

| 版本 | 含义 |
|---|---|
| V0.2 | V0.1 成功后第一轮扩展 |
| V0.3 | 内容量和可重复游玩扩展 |
| V0.4 | 系统深度和局外成长 |
| V1.0 | 可公开 Demo / Steam / itch.io 包装 |
| Later | 长期方向 |

---

## 2. V0.2 版本目标建议

V0.2 不应该马上做“大而全”。

V0.2 的合理目标是：

> 在 V0.1 已经稳定可玩的基础上，增强重复游玩价值、合作分工和 Build 差异，但不破坏已有架构。

### 2.1 V0.2 推荐核心目标

| 目标 | 说明 |
|---|---|
| 增加 1–2 种新植物 | 让防线策略更丰富 |
| 增加 1 种新武器 | 让英雄操作体验变化 |
| 扩展进化池 | 让每局 Build 不完全相同 |
| 增加 1 个新敌人 | 打破固定防线套路 |
| 改进 Boss 表现 | 强化高潮体验 |
| 美术和音频替换更多 placeholder | 提升可演示品质 |
| 改善 UI 与新手引导 | 降低试玩门槛 |

### 2.2 V0.2 不建议做

V0.2 仍不建议立刻做：

- 正式账号系统；
- 排位匹配；
- 商城；
- 多人 4P；
- 大型剧情；
- 完整 Roguelite 局外养成；
- Steam 正式发布；
- 移动端适配；
- P2P 重构。

这些更适合 V0.3+ 或 V1.0。

---

# 3. V0.2 P0：直接增强核心可玩性

## V02-P0-001 新植物：减速植物 / Frostvine

- Category: Plant / Defense Control
- Priority: P0
- Target Version: V0.2
- Description: 增加一种减速植物，对本路线敌人造成低伤害并施加减速。用于处理快速敌人和 Boss 召唤的小怪。
- Why not V0.1: V0.1 只验证三种基础植物：经济、输出、防御。减速植物会增加数值复杂度。
- Dependencies:
  - PlantSystem 已稳定；
  - Enemy slow 状态已通过控制进化实现；
  - ProjectileSystem 支持 slow modifier。
- Design Risk: 如果减速太强，快速敌人失去意义。
- Technical Risk: 需要统一 slow stacking 规则。
- MVP Cut: 只做单体减速弹，不做范围冰冻。
- Acceptance Idea:
  - Frostvine 能攻击本路线；
  - 命中后敌人速度降低；
  - 减速持续时间结束后恢复；
  - 不与控制进化无限叠加。
- Notes: 建议成本 125 阳光，伤害低于 Peashotter。

---

## V02-P0-002 新植物：地雷植物 / Burrow Mine

- Category: Plant / Burst Defense
- Priority: P0
- Target Version: V0.2
- Description: 一次性爆炸植物，种下后短暂武装，敌人踩到后爆炸，对小范围敌人造成高伤害。
- Why not V0.1: V0.1 已有输出和防御植物，地雷会增加范围伤害与触发检测。
- Dependencies:
  - PlantSystem；
  - Enemy collision；
  - Area damage utility。
- Design Risk: 爆发太强会让防线不需要持续植物。
- Technical Risk: 需要范围伤害和一次性植物死亡逻辑。
- MVP Cut: 只检测同 lane、固定半径，不做复杂范围。
- Acceptance Idea:
  - 种下后 2 秒武装；
  - 第一个敌人进入触发范围后爆炸；
  - 对同路线附近敌人造成伤害；
  - 爆炸后释放格子。
- Notes: 适合制造“救急但要提前布置”的策略。

---

## V02-P0-003 新武器：霰弹枪 / Shotgun

- Category: Hero Weapon
- Priority: P0
- Target Version: V0.2
- Description: 增加近距离高爆发武器，一次发射多颗弹丸，适合救场和清理近距离小怪，但弹药更贵、射速慢、射程短。
- Why not V0.1: V0.1 只用手枪验证枪械英雄循环。
- Dependencies:
  - WeaponSystem 稳定；
  - 多 projectile 发射支持；
  - Weapon config 可扩展。
- Design Risk: 如果过强，会替代植物清怪。
- Technical Risk: 多弹丸命中和性能处理。
- MVP Cut: 不做武器切换掉落，只允许开局选择手枪或霰弹枪。
- Acceptance Idea:
  - 霰弹枪一次消耗 1 发；
  - 发射 5 个 pellet；
  - 近距离强，远距离散；
  - 总备弹低于手枪。
- Notes: 非常适合让两个玩家产生分工：一人手枪打 Boss 弱点，一人霰弹枪救场。

---

## V02-P0-004 扩展英雄进化池：局内三选一升级变为多池随机

- Category: Roguelite / Build
- Priority: P0
- Target Version: V0.2
- Description: 把 V0.1 固定火力/控制/支援三选一，扩展为每次从小型升级池中随机出现 3 个选项。每名玩家可以选择 2 次升级。
- Why not V0.1: V0.1 先验证一次性进化是否成立。
- Dependencies:
  - EvolutionSystem；
  - UI 支持选择卡片；
  - Modifier stacking 规则。
- Design Risk: 随机升级可能导致强度失控。
- Technical Risk: modifier 叠加、保存和同步。
- MVP Cut: 只做 9 个升级选项，每局每人选 2 次。
- Acceptance Idea:
  - Wave 3 和 Boss Prep 各出现一次升级机会；
  - 每次随机 3 个选项；
  - 两名玩家可以形成不同 Build；
  - 所有效果服务器权威。
- Notes: 这是提高重玩价值的关键 P0。

---

## V02-P0-005 新敌人：跳跃污染体 / Leaper

- Category: Enemy / Anti-Wall
- Priority: P0
- Target Version: V0.2
- Description: 一种能跳过第一个防御植物的敌人，专门针对只堆木壳墙的防线。
- Why not V0.1: V0.1 只做三种基础敌人，避免复杂规则。
- Dependencies:
  - EnemySystem；
  - lane/grid collision；
  - special enemy state。
- Design Risk: 如果太频繁，会让防御植物挫败感太强。
- Technical Risk: 跳跃路径和落点规则。
- MVP Cut: 每只 Leaper 只跳一次，只跳过第一个植物。
- Acceptance Idea:
  - 遇到第一个植物时触发 jump；
  - 跳到后方一段距离；
  - 跳跃期间不可攻击；
  - 落地后继续移动。
- Notes: 可以强迫玩家使用英雄救场或后排防御。

---

## V02-P0-006 Boss 体验增强：更多可读反馈与二阶段视觉变化

- Category: Boss / Presentation
- Priority: P0
- Target Version: V0.2
- Description: 保持 Boss 机制不大改，但增强弱点、读条、冲锋路径、二阶段外观、命中反馈和音效。
- Why not V0.1: V0.1 先保证 Boss 机制跑通。
- Dependencies:
  - BossSystem 稳定；
  - Art Batch D；
  - AudioManager。
- Design Risk: 表现过强可能遮挡战场。
- Technical Risk: 多特效叠加性能。
- MVP Cut: 只做弱点特效、冲锋路径提示、二阶段 sprite 替换。
- Acceptance Idea:
  - 玩家能明确看懂 Boss 要冲锋；
  - 打断成功有强反馈；
  - Phase 2 视觉更危险。
- Notes: 直接提升试玩观感。

---

# 4. V0.2 P1：合作分工增强

## V02-P1-001 双英雄轻职业差异

- Category: Hero / Co-op Role
- Priority: P1
- Target Version: V0.2 or V0.3
- Description: 两名玩家不再完全相同，而是可选择轻职业。例如 Ranger、Engineer、Medic-Gardener。
- Why not V0.1: V0.1 需要先验证基础双人合作。
- Dependencies:
  - HeroSystem；
  - EvolutionSystem；
  - UI 角色选择。
- Design Risk: 职业差异过大导致强制分工或不平衡。
- Technical Risk: 多角色状态和技能同步。
- MVP Cut: 只做被动差异，不做主动技能。
- Acceptance Idea:
  - Ranger 枪械更强；
  - Engineer 种植折扣；
  - Support 补弹或护盾更强。
- Notes: 这会显著提升双人合作身份感。

---

## V02-P1-002 团队技能：共享阳光大招

- Category: Team Skill / Economy Sink
- Priority: P1
- Target Version: V0.2
- Description: 增加团队级技能，消耗大量阳光触发一次强力效果，例如全场减速、基地护盾、空投弹药。
- Why not V0.1: V0.1 阳光用途已经足够多，先不加大招。
- Dependencies:
  - EconomySystem；
  - UI；
  - Cooldown system。
- Design Risk: 大招可能破坏 Boss 或 Wave 压力。
- Technical Risk: 全局效果同步。
- MVP Cut: 只做一个技能：Emergency Supply，消耗 150 阳光，给两名玩家各 +12 备弹。
- Acceptance Idea:
  - 阳光足够时可释放；
  - 双方同步看到效果；
  - 有冷却；
  - 不可连续滥用。
- Notes: 可以进一步强化“共享阳光=团队讨论”。

---

## V02-P1-003 双人交互：救援倒地

- Category: Co-op / Revive
- Priority: P1
- Target Version: V0.3
- Description: 英雄死亡后不再自动 5 秒复活，而是进入倒地状态，队友靠近可救援。
- Why not V0.1: V0.1 自动复活更简单，避免合作惩罚过高。
- Dependencies:
  - HeroSystem；
  - Input interaction；
  - UI revive progress。
- Design Risk: 队友忙于守线时救援可能变得挫败。
- Technical Risk: 倒地状态与敌人攻击、Boss 技能交互复杂。
- MVP Cut: 倒地 8 秒后自动复活；队友救援可缩短到 2 秒。
- Acceptance Idea:
  - 倒地玩家不能行动；
  - 队友靠近按 E 救援；
  - 救援成功恢复 50 HP；
  - 仍保留自动复活作为兜底。
- Notes: 适合在核心战斗稳定后加入。

---

## V02-P1-004 资源消费提示：队友消费可见化

- Category: UX / Co-op Awareness
- Priority: P1
- Target Version: V0.2
- Description: 当队友花费共享阳光时，在 UI 上显示“Player B bought ammo -50 Sun”或图标提示。
- Why not V0.1: V0.1 只需要基础共享阳光。
- Dependencies:
  - SunChangeEvent；
  - UI Toast；
  - Player slot/name。
- Design Risk: 提示太频繁会烦。
- Technical Risk: 低。
- MVP Cut: 只显示买弹药、进化、大额种植。
- Acceptance Idea:
  - 队友消费时有短提示；
  - 不遮挡战场；
  - 可在设置中关闭。
- Notes: 对合作沟通很有帮助。

---

# 5. V0.2 P1：更多内容扩展

## V02-P1-005 新植物：治疗孢子 / Healspore

- Category: Plant / Support
- Priority: P1
- Target Version: V0.3
- Description: 周期性修复附近植物，适合保护经济区或 Boss 前线。
- Why not V0.1: V0.1 不做植物修复系统。
- Dependencies:
  - Plant HP system；
  - area effect；
  - target selection。
- Design Risk: 如果治疗太强，防线不会崩。
- Technical Risk: 范围治疗同步。
- MVP Cut: 只治疗同 lane 相邻格植物。
- Acceptance Idea:
  - 每 5 秒治疗相邻植物 25 HP；
  - 不超过 maxHp；
  - Boss 重锤仍然有威胁。
- Notes: 可作为防御型 Build 的核心。

---

## V02-P1-006 新植物：电网藤 / Shockvine

- Category: Plant / Chain Damage
- Priority: P1
- Target Version: V0.3
- Description: 发射电击，能在同一路线多个敌人之间跳跃，适合处理小怪群。
- Why not V0.1: 链式伤害会增加 target logic。
- Dependencies:
  - ProjectileSystem；
  - multi-target damage。
- Design Risk: 可能过强清群。
- Technical Risk: 连锁目标选择。
- MVP Cut: 最多跳 2 个目标。
- Acceptance Idea:
  - 首目标受满伤害；
  - 第二目标受 60%；
  - 第三目标受 30%；
  - 不攻击跨 lane。
- Notes: 适合后期波次密度提高后加入。

---

## V02-P1-007 新武器：冲锋枪 / SMG

- Category: Hero Weapon
- Priority: P1
- Target Version: V0.3
- Description: 高射速低伤害武器，适合持续压制和打小怪，但耗弹快。
- Why not V0.1: V0.1 手枪已经足够验证弹药循环。
- Dependencies:
  - WeaponSystem multi-weapon；
  - ammo economy tuning。
- Design Risk: 可能让买弹药变成必选。
- Technical Risk: 高频射击 snapshot 和音频节流。
- MVP Cut: 限制射速 8 发/秒，不做全自动复杂 recoil。
- Acceptance Idea:
  - 按住左键连续射击；
  - 伤害低；
  - 快速耗弹；
  - Boss 弱点打断效率高但资源压力大。
- Notes: 与支援进化有天然配合。

---

## V02-P1-008 新武器：狙击枪 / Rail Rifle

- Category: Hero Weapon
- Priority: P1
- Target Version: V0.3
- Description: 低射速高伤害，可穿透一条线上的敌人，适合打 Boss 弱点和装甲敌人。
- Why not V0.1: 穿透和瞄准收益需要更精细调参。
- Dependencies:
  - WeaponSystem multi-weapon；
  - projectile piercing；
  - Boss weakpoint tuning。
- Design Risk: 可能让 Boss 过简单。
- Technical Risk: 穿透命中顺序。
- MVP Cut: 最多穿透 2 个敌人，不穿透 Boss。
- Acceptance Idea:
  - 单发伤害高；
  - 换弹慢；
  - 射速慢；
  - 打弱点伤害高。
- Notes: 适合精准型玩家。

---

# 6. V0.3：Roguelite 与重复游玩

## V03-P0-001 Roguelite 升级池系统

- Category: Roguelite / Replayability
- Priority: P0
- Target Version: V0.3
- Description: 建立完整局内升级池，让玩家每隔几波或击败小 Boss 后选择升级。
- Why not V0.1: V0.1 只验证一次进化。
- Dependencies:
  - EvolutionSystem V0.2；
  - Modifier stacking；
  - UI card system。
- Design Risk: 升级池过多会难以平衡。
- Technical Risk: Buff/debuff 架构。
- MVP Cut: 20 个升级，分 Common/Rare/Epic。
- Acceptance Idea:
  - 每局至少 3 次升级选择；
  - 玩家 Build 有明显差异；
  - 不出现无限叠加强度失控。
- Notes: 这是长期留存的核心。

---

## V03-P0-002 关卡词条系统

- Category: Roguelite / Level Modifier
- Priority: P0
- Target Version: V0.3
- Description: 每关随机 1–2 个词条，例如“阳光产出降低但敌人掉落增加”、“快速敌人更多”、“Boss 弱点时间缩短”。
- Why not V0.1: 会影响初始数值验证。
- Dependencies:
  - WaveSystem；
  - CombatNumbers modifiers；
  - UI display。
- Design Risk: 词条组合可能不公平。
- Technical Risk: 全局数值 modifier。
- MVP Cut: 只做 6 个安全词条，每局 1 个。
- Acceptance Idea:
  - 开局显示词条；
  - 词条真实影响数值；
  - 结算显示词条。
- Notes: 可以显著提高重复游玩。

---

## V03-P1-003 多地图：污染温室 / 废弃庭院 / 屋顶水培区

- Category: Maps / Content
- Priority: P1
- Target Version: V0.3
- Description: 增加不同地图布局和视觉主题。
- Why not V0.1: V0.1 只做单地图验证核心循环。
- Dependencies:
  - MapConfig abstraction；
  - Art pipeline；
  - Wave tuning per map。
- Design Risk: 地图变化可能破坏平衡。
- Technical Risk: 多地图坐标配置。
- MVP Cut: 地图仍是 5 lane × 7 column，只换视觉和少量障碍。
- Acceptance Idea:
  - 玩家可选地图；
  - 每张地图可完整通关；
  - 地图配置数据驱动。
- Notes: V0.3 后可以考虑地图机制差异。

---

## V03-P1-004 多 Boss 池

- Category: Boss / Content
- Priority: P1
- Target Version: V0.3
- Description: 增加多个 Boss，让每局结尾不完全相同。
- Why not V0.1: 一个 Boss 已经足够验证机制。
- Dependencies:
  - BossSystem abstraction；
  - Art/audio pipeline；
  - Boss selection config。
- Design Risk: 每个 Boss 都需要清晰机制，否则只是换皮。
- Technical Risk: Boss 行为系统扩展。
- MVP Cut: 增加第二个 Boss：Spore Queen，偏召唤和区域污染。
- Acceptance Idea:
  - 随机或关卡指定 Boss；
  - 不同 Boss 有不同机制；
  - UI 正确显示 Boss 信息。
- Notes: Boss 是游戏高潮，内容价值高。

---

# 7. V0.4：局外成长与长期目标

## V04-P0-001 局外解锁系统

- Category: Meta Progression
- Priority: P0
- Target Version: V0.4
- Description: 玩家通过通关或挑战获得研究点，解锁新植物、新武器、新升级池选项。
- Why not V0.1: 会干扰核心循环验证。
- Dependencies:
  - Content pool；
  - persistence；
  - progression UI。
- Design Risk: 解锁强度影响平衡，新玩家体验可能差。
- Technical Risk: 需要存档或账号。
- MVP Cut: 本地存档 localStorage，只有解锁不加数值永久强化。
- Acceptance Idea:
  - 通关获得研究点；
  - 解锁新植物或武器；
  - 不破坏合作公平性。
- Notes: 建议先做“横向解锁”，避免数值碾压。

---

## V04-P1-002 挑战任务系统

- Category: Meta / Challenges
- Priority: P1
- Target Version: V0.4
- Description: 增加每日/每局挑战，例如“不购买弹药通关”、“基地 HP 不低于 5”、“只种 8 个植物”。
- Why not V0.1: V0.1 结算统计刚建立，先不加任务。
- Dependencies:
  - StatsSystem；
  - Result screen；
  - Persistence。
- Design Risk: 任务可能诱导队友不合作。
- Technical Risk: 条件追踪。
- MVP Cut: 只做 6 个静态成就式挑战。
- Acceptance Idea:
  - 结算时显示是否完成；
  - 完成后给研究点；
  - 不强制玩家选择。
- Notes: 可提高重复游玩，但要避免破坏合作。

---

## V04-P1-003 局外基地研究树

- Category: Meta Progression / Tech Tree
- Priority: P1
- Target Version: V0.4 or Later
- Description: 玩家在局外升级温室研究树，解锁新的战术选择。
- Why not V0.1: 系统复杂，容易变成数值膨胀。
- Dependencies:
  - Persistence；
  - Unlock system；
  - Balance design。
- Design Risk: 永久数值强化会让旧关卡失衡。
- Technical Risk: 存档、版本迁移。
- MVP Cut: 只解锁内容，不直接加攻击/血量。
- Acceptance Idea:
  - 解锁新升级选项；
  - 解锁新植物；
  - 不让老玩家碾压新玩家。
- Notes: 适合商业 Demo 后再做。

---

# 8. 联机与社交长期方向

## NET-P1-001 好友房间与房间码优化

- Category: Multiplayer UX
- Priority: P1
- Target Version: V0.3
- Description: 改善创建/加入房间体验，使用短房间码、复制按钮、邀请链接。
- Why not V0.1: V0.1 只需本地双开验证。
- Dependencies:
  - RoomManager；
  - UI；
  - deploy URL。
- Design Risk: 低。
- Technical Risk: 低。
- MVP Cut: 6 位房间码 + copy button。
- Acceptance Idea:
  - 创建房间生成短码；
  - 另一玩家输入短码加入；
  - 复制邀请链接可用。
- Notes: 对外部试玩非常有帮助。

---

## NET-P2-002 简易匹配队列

- Category: Multiplayer / Matchmaking
- Priority: P2
- Target Version: V0.4 or V1.0
- Description: 单人进入匹配队列，自动匹配另一个玩家。
- Why not V0.1: 需要稳定在线服务和并发测试。
- Dependencies:
  - Deployed server；
  - RoomManager scaling；
  - Matchmaking queue。
- Design Risk: 玩家等待时间影响体验。
- Technical Risk: 部署、断线、并发。
- MVP Cut: 本地或小规模 queue，不做 MMR。
- Acceptance Idea:
  - 两名玩家点 Quick Match 后进入同房间；
  - 超时可取消。
- Notes: 公测前再考虑。

---

## NET-P2-003 断线重连增强

- Category: Multiplayer Reliability
- Priority: P2
- Target Version: V0.3
- Description: 当前 V0.1 基础重连升级为更稳定的断线恢复、重连 UI、短暂停控制。
- Why not V0.1: V0.1 简单重连即可。
- Dependencies:
  - reconnectToken；
  - snapshot recovery；
  - room grace timer。
- Design Risk: 暂停机制可能被滥用。
- Technical Risk: 中等。
- MVP Cut: 断线 30 秒内可恢复，队友看到倒计时。
- Acceptance Idea:
  - 断网刷新后可回到原 slot；
  - 状态恢复正确；
  - 超时后安全结束。
- Notes: 远程试玩前值得做。

---

# 9. UI/UX 与新手引导

## UX-P0-001 新手引导关卡

- Category: Tutorial
- Priority: P0
- Target Version: V0.2 or V0.3
- Description: 增加一个短教学流程，引导玩家移动、种植、射击、换弹、买弹药、打断 Boss。
- Why not V0.1: V0.1 先完成完整关卡。
- Dependencies:
  - UI；
  - tutorial prompts；
  - state triggers。
- Design Risk: 教学太长影响节奏。
- Technical Risk: 中低。
- MVP Cut: 用战斗中提示，不单独做关卡。
- Acceptance Idea:
  - 第一次进入显示操作提示；
  - 第一次弹匣空提示 R；
  - Boss 第一次读条提示射击弱点。
- Notes: 对试玩转化非常关键。

---

## UX-P1-002 失败原因分析

- Category: Result UX
- Priority: P1
- Target Version: V0.2
- Description: 失败后显示主要原因，例如“弹药购买太少”、“经济植物太少”、“中路被装甲敌人突破”。
- Why not V0.1: V0.1 只需要基础结算。
- Dependencies:
  - StatsSystem；
  - lane breakthrough stats；
  - result UI。
- Design Risk: 分析不准确会误导玩家。
- Technical Risk: 低中。
- MVP Cut: 基于 3–5 个简单规则生成建议。
- Acceptance Idea:
  - 失败后显示 1–2 条建议；
  - 建议基于真实统计。
- Notes: 很适合提升“再来一局”的意愿。

---

## UX-P1-003 Ping 与网络状态 UI

- Category: Network UX
- Priority: P1
- Target Version: V0.2
- Description: 显示延迟、断线、重连状态。
- Why not V0.1: Debug overlay 已够开发使用。
- Dependencies:
  - ping system；
  - UI。
- Design Risk: 低。
- Technical Risk: 低。
- MVP Cut: 只显示 ping icon 和 reconnecting banner。
- Acceptance Idea:
  - 高延迟时显示黄色图标；
  - 断线时显示重连提示。
- Notes: 外部试玩时非常有用。

---

# 10. 美术与音频后续方向

## ART-P0-001 完整 P0 资源替换

- Category: Art Production
- Priority: P0
- Target Version: V0.2
- Description: 将所有 P0 placeholder 替换为 image-gen / game-studio 生成的原创资源。
- Why not V0.1: V0.1 可用 placeholder 验证玩法。
- Dependencies:
  - ART_DIRECTION_V0_1；
  - asset registry；
  - image-gen workflow。
- Design Risk: 风格不统一。
- Technical Risk: 低。
- MVP Cut: 先替换英雄、植物、敌人、Boss。
- Acceptance Idea:
  - 游戏内 P0 单位不再是几何块；
  - 小尺寸可读；
  - asset_status 全部 updated。
- Notes: 对演示观感提升最大。

---

## ART-P1-002 简单动画帧

- Category: Animation
- Priority: P1
- Target Version: V0.3
- Description: 增加英雄跑步、植物攻击、敌人移动、Boss 蓄力等少量动画。
- Why not V0.1: 静态 sprite + tween 足够验证玩法。
- Dependencies:
  - art pipeline；
  - Phaser animation registry。
- Design Risk: 动画不一致反而降低质量。
- Technical Risk: 中低。
- MVP Cut: 每个核心单位 2–4 帧。
- Acceptance Idea:
  - 英雄移动不再完全静态；
  - 植物攻击有明显动作；
  - Boss 读条有蓄力动画。
- Notes: 先保证动画不影响碰撞。

---

## AUDIO-P0-001 P0 音频真实资源替换

- Category: Audio Production
- Priority: P0
- Target Version: V0.2
- Description: 用 CC0 / permissive license 音效替换所有 P0 placeholder。
- Why not V0.1: V0.1 可以先用 placeholder 音频。
- Dependencies:
  - AudioManager；
  - audio license docs。
- Design Risk: 音效风格不统一。
- Technical Risk: license 管理。
- MVP Cut: 先替换枪声、换弹、Boss 警告、胜负。
- Acceptance Idea:
  - 所有真实资源 license 完整；
  - 游戏内关键反馈更清楚；
  - 没有音量爆炸。
- Notes: 必须坚持 license 审查。

---

## AUDIO-P1-002 Boss 音频增强

- Category: Audio / Boss
- Priority: P1
- Target Version: V0.2
- Description: 为 Boss 增加登场、弱点、重锤、冲锋、打断、二阶段专属音效。
- Why not V0.1: V0.1 只需 P0 提示音。
- Dependencies:
  - Boss feedback events；
  - AudioManager。
- Design Risk: Boss 音效过吵。
- Technical Risk: 低。
- MVP Cut: 只做 charge warning 和 interrupted 强化。
- Acceptance Idea:
  - 玩家闭着眼也能注意 Boss 冲锋；
  - 打断成功反馈强。
- Notes: Boss 战体验关键。

---

# 11. 技术债与架构优化

## TECH-P0-001 系统测试覆盖增强

- Category: Testing
- Priority: P0
- Target Version: V0.2
- Description: 增强 Economy/Plant/Weapon/Wave/Boss 系统单元测试。
- Why not V0.1: V0.1 先跑通，但核心逻辑已有基础测试。
- Dependencies:
  - Systems stabilized。
- Design Risk: 无。
- Technical Risk: 测试重构成本。
- MVP Cut: 每个核心系统至少 5 个测试。
- Acceptance Idea:
  - 关键规则都有单元测试；
  - 修改数值不会破坏逻辑。
- Notes: Agent 开发流非常需要测试护栏。

---

## TECH-P1-002 Snapshot Delta 优化

- Category: Networking Optimization
- Priority: P1
- Target Version: V0.4 or Later
- Description: 将全量 snapshot 优化为 delta snapshot，降低带宽。
- Why not V0.1: V0.1 实体数量可控，全量 snapshot 更简单可靠。
- Dependencies:
  - Snapshot stable；
  - entity versioning。
- Design Risk: 无。
- Technical Risk: 高，可能引入同步 bug。
- MVP Cut: 只压缩 bullets/enemies。
- Acceptance Idea:
  - 带宽下降；
  - 不引入 desync。
- Notes: 不应过早优化。

---

## TECH-P1-003 Object Pooling

- Category: Performance
- Priority: P1
- Target Version: V0.3
- Description: 对子弹、特效、敌人 sprite 使用对象池，减少 GC。
- Why not V0.1: 当前实体量不大。
- Dependencies:
  - Rendering stable；
  - ProjectileSystem stable。
- Design Risk: 无。
- Technical Risk: 中。
- MVP Cut: 先只对 projectiles 和 hit FX 做 pool。
- Acceptance Idea:
  - 大量子弹时 FPS 更稳定；
  - 无对象状态残留 bug。
- Notes: 出现性能问题后再做。

---

## TECH-P2-004 Server Deployment Setup

- Category: Deployment
- Priority: P2
- Target Version: V0.3 or V1.0
- Description: 增加部署配置，让朋友能公网试玩。
- Why not V0.1: 本地 Demo 先行。
- Dependencies:
  - Stable server；
  - env config；
  - CORS settings。
- Design Risk: 无。
- Technical Risk: 部署环境和网络问题。
- MVP Cut: 一个简单 VPS / Render / Railway 部署说明。
- Acceptance Idea:
  - 外网两人可加入同一房间；
  - README 有部署说明。
- Notes: 对后续测试很重要。

---

# 12. 商业化与发布长期方向

## BIZ-P2-001 itch.io Demo 页面

- Category: Distribution
- Priority: P2
- Target Version: V1.0
- Description: 将游戏打包成 itch.io 可试玩 Demo。
- Why not V0.1: 需要稳定可玩、美术音频更完整。
- Dependencies:
  - Build pipeline；
  - public server；
  - asset license clean。
- Design Risk: 低。
- Technical Risk: 中。
- MVP Cut: 单页面说明 + Web build + 房间码。
- Acceptance Idea:
  - 玩家打开链接即可创建/加入房间；
  - 页面说明清楚。
- Notes: 适合收集真实反馈。

---

## BIZ-P2-002 Steam Demo 可行性研究

- Category: Business / Publishing
- Priority: Research
- Target Version: Later
- Description: 研究是否适合做 Steam Demo，包括联机架构、包装、美术、合规、商店页。
- Why not V0.1: 过早。
- Dependencies:
  - V0.3+ quality；
  - unique identity；
  - stable online play。
- Design Risk: 市场定位不清。
- Technical Risk: 打包、服务器、联机稳定性。
- MVP Cut: 只做 research 文档。
- Acceptance Idea:
  - 完成 market fit 分析；
  - 确定是否值得 Steam 化。
- Notes: 不要在原型期被发布流程拖慢。

---

## BIZ-P3-003 自媒体 Devlog 内容管线

- Category: Marketing / Content
- Priority: P3
- Target Version: V0.2+
- Description: 用开发过程制作独立游戏 Devlog，展示 AI Agent 开发、联机 Demo、Boss 设计、美术生成过程。
- Why not V0.1: 不影响开发主线，但可并行轻量记录。
- Dependencies:
  - playable milestones；
  - screenshots；
  - short clips。
- Design Risk: 过早营销导致压力过大。
- Technical Risk: 低。
- MVP Cut: 每完成 2–3 个 Phase 记录一段短视频素材。
- Acceptance Idea:
  - 有清晰前后对比；
  - 展示玩法而不是只展示代码。
- Notes: 对用户的 Agent 开发路线很匹配。

---

# 13. Research 项

## R-001 市场定位研究：合作塔防 + 英雄射击

- Category: Research / Market
- Priority: Research
- Target Version: Before V0.3
- Description: 调研合作塔防、动作塔防、Web 联机小游戏、Boss Rush 合作游戏的市场接受度。
- Why not V0.1: V0.1 先做原型验证。
- Dependencies:
  - V0.1 gameplay footage；
  - playable prototype。
- Design Risk: 调研结论可能要求方向调整。
- Technical Risk: 无。
- MVP Cut: 只做竞品与定位分析。
- Acceptance Idea:
  - 找出 10–20 个相关游戏；
  - 分析差异化；
  - 输出定位建议。
- Notes: V0.1 可玩后再调研更准确。

---

## R-002 是否从 Web 迁移到 Unity / Godot

- Category: Research / Tech Stack
- Priority: Research
- Target Version: Later
- Description: 如果项目证明有潜力，研究是否继续 Web 技术栈，还是迁移到 Unity/Godot。
- Why not V0.1: 当前 Codex 更适合 Web 快速原型。
- Dependencies:
  - V0.1/V0.2 feedback；
  - performance needs；
  - target platform。
- Design Risk: 迁移可能浪费已有工作。
- Technical Risk: 高。
- MVP Cut: 只做对比文档，不迁移。
- Acceptance Idea:
  - 比较 Web/Unity/Godot 优劣；
  - 给出继续路线。
- Notes: 不要在 V0.1 之前纠结引擎。

---

## R-003 AI 生成资源流水线质量评估

- Category: Research / Asset Pipeline
- Priority: Research
- Target Version: V0.2
- Description: 评估 image-gen/game-studio 生成 sprite、UI、动画帧的可用性和一致性。
- Why not V0.1: V0.1 允许 placeholder。
- Dependencies:
  - ART_DIRECTION；
  - asset_status；
  - Batch A/B 输出。
- Design Risk: 风格不统一。
- Technical Risk: 去背、尺寸、动画一致性。
- MVP Cut: 只评估 P0 资源。
- Acceptance Idea:
  - 每个资源给 approved/rejected；
  - 记录 prompt 改进方向。
- Notes: 对全 Agent 开发流很重要。

---

# 14. 不建议做或暂时冻结的想法

## HOLD-001 4 人合作模式

- Category: Multiplayer Scale
- Reason to Hold: 当前设计围绕 2 人共享阳光和平衡。4 人会要求地图、敌人、资源、UI、网络同步全部重调。
- Revisit: V1.0 以后。

---

## HOLD-002 P2P 联机

- Category: Networking
- Reason to Hold: 当前游戏有共享资源、命中、Boss 打断，必须服务器权威。P2P 会显著增加同步和作弊风险。
- Revisit: 不建议，除非项目完全转向好友本地娱乐且不考虑公平性。

---

## HOLD-003 复杂剧情战役

- Category: Narrative
- Reason to Hold: 玩法尚未稳定，剧情战役会消耗大量内容成本。
- Revisit: V0.4+。

---

## HOLD-004 商城和皮肤

- Category: Monetization
- Reason to Hold: 过早商业化会污染设计优先级。先做可玩和可传播。
- Revisit: V1.0 以后。

---

## HOLD-005 移动端适配

- Category: Platform
- Reason to Hold: 当前操作是 WASD + 鼠标瞄准，移动端需要完全不同 UI/输入设计。
- Revisit: Web Demo 稳定后再评估。

---

# 15. V0.2 推荐执行顺序

如果 V0.1 验收通过，推荐 V0.2 按以下顺序推进：

```text
1. P0 资源清理：替换核心 placeholder
2. UI/UX：新手提示和队友消费提示
3. 新植物 Frostvine
4. 新武器 Shotgun
5. 扩展进化池小版本
6. 新敌人 Leaper
7. Boss 表现增强
8. P0 音频真实资源替换
9. 第一轮外部试玩
10. Playtest Report V0.2
```

不建议 V0.2 一上来就做局外成长或多地图。

---

# 16. V0.2 最小 Definition of Done 建议

V0.2 如果启动，建议最小完成标准为：

1. V0.1 所有功能仍然稳定；
2. 新增至少 1 个植物；
3. 新增至少 1 个武器；
4. 新增至少 1 个敌人；
5. 进化系统从固定三选一升级为小型随机池；
6. Boss 表现明显增强；
7. P0 美术资源不再主要依赖 placeholder；
8. P0 音频资源经过 license 核验并接入；
9. UI 能更清楚引导新玩家；
10. 至少完成 3 次外部试玩记录。

---

# 17. 给 Codex 的 Backlog 处理 Prompt

当 Codex 想加入新功能时，使用：

```md
Task: Add a proposed feature to V0_2_BACKLOG.md without implementing it.

Feature idea:
[describe idea]

Rules:
1. Do not change gameplay code.
2. Do not create implementation files.
3. Add the idea to the correct backlog category.
4. Include:
   - Category
   - Priority
   - Target Version
   - Description
   - Why not V0.1
   - Dependencies
   - Design Risk
   - Technical Risk
   - MVP Cut
   - Acceptance Idea
   - Notes
5. If the idea is unsafe, too broad, or not aligned with the project, mark it as HOLD or Research.
```

---

# 18. 当前版本最终结论

`V0_2_BACKLOG.md` 是项目的范围安全阀。

它允许我们保留所有有潜力的想法，但不让它们干扰 V0.1 的核心目标。

V0.1 成功之前，最重要的是：

> 不扩范围，不做大而全，不追求内容量，先把双人合作枪械英雄塔防的核心闭环做稳。

V0.1 成功之后，V0.2 才开始围绕新植物、新武器、小型 Roguelite 升级池、Boss 表现增强和资源替换来扩大可玩性。

