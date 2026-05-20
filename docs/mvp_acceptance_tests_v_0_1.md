# MVP_ACCEPTANCE_TESTS_V0_1.md

# 双人合作枪械英雄塔防 V0.1 MVP 验收测试规范

## 0. 文档目的

本文档定义 V0.1 MVP 的阶段验收测试、最终 Demo 验收测试、手工测试脚本、自动化测试建议、资源检查清单、联机同步检查清单和失败阻断标准。

本文档用于回答：

- Codex 完成某个 Phase 后，如何判断是否真的完成；
- 哪些问题必须修复后才能进入下一 Phase；
- 最终 V0.1 Demo 怎样才算可交付；
- 用户作为项目负责人应重点看什么；
- 哪些测试适合自动化，哪些必须手工双开浏览器验证。

本文档配合以下文档使用：

| 文档 | 用途 |
|---|---|
| `GAME_DESIGN_V0_1.md` | 判断玩法目标是否达成 |
| `RULES_CORE_LOOP.md` | 判断规则循环是否正确 |
| `COMBAT_NUMBERS_V0_1.md` | 判断数值与波次是否符合设计 |
| `NETWORK_SYNC_SPEC.md` | 判断联机同步是否正确 |
| `ART_DIRECTION_V0_1.md` | 判断美术资源是否合规可读 |
| `AUDIO_PIPELINE_V0_1.md` | 判断音频资源是否合规可用 |
| `CODEX_IMPLEMENTATION_PLAN.md` | 判断阶段推进是否正确 |
| `PROJECT_FILE_STRUCTURE_V0_1.md` | 判断文件结构是否合规 |

---

## 1. 验收总原则

### 1.1 先稳定，再进入下一阶段

任何 Phase 如果出现以下问题，不允许进入下一 Phase：

- client 无法启动；
- server 无法启动；
- typecheck 失败；
- 当前阶段核心功能不可用；
- 服务器权威边界被破坏；
- 关键请求没有失败分支；
- shared config/type 明显混乱；
- 房间或 GameLoop 存在阻断性崩溃；
- 状态无法恢复或必须刷新才继续；
- Codex 未提供 Gate Report。

### 1.2 测试分四类

| 测试类型 | 目的 |
|---|---|
| Build Tests | 确认项目能启动、编译、打包 |
| Unit Tests | 确认纯逻辑正确，如阳光、弹药、波次 |
| Integration Tests | 确认 server/client/shared 协作正确 |
| Manual Playtests | 确认双人联机实际可玩、可理解、有反馈 |

### 1.3 V0.1 不追求完美自动化

V0.1 可以不做完整端到端浏览器自动化，但必须有：

- 基础 typecheck；
- 基础 build；
- 核心逻辑单元测试；
- 双开浏览器手工测试；
- 最终 Playtest Report。

---

## 2. 全局验收命令

### 2.1 每个 Phase 后建议执行

```bash
npm run typecheck
npm run test
```

### 2.2 关键阶段后建议执行

```bash
npm run build
npm run dev:server
npm run dev:client
```

### 2.3 资源阶段后建议执行

```bash
npm run validate:assets
npm run validate:audio
```

如果这些脚本尚未实现，Codex 必须在 Gate Report 中说明：

- 哪个脚本还不存在；
- 为什么暂时不存在；
- 后续哪个 Phase 会补上；
- 当前替代检查方式是什么。

---

## 3. Gate Report 必填模板

每个 Phase 完成后，Codex 必须输出：

```md
# Phase X Gate Report

## Scope Completed
-

## Tests Run
-

## Manual Verification
-

## Files Changed
-

## Passed Acceptance Criteria
-

## Failed / Skipped Criteria
-

## Known Issues
-

## Risk Level
Low / Medium / High

## Can Proceed to Next Phase?
Yes / No

## Required Fixes Before Next Phase
-

## Next Phase Recommendation
-
```

如果 `Can Proceed to Next Phase = No`，用户不应让 Codex 进入下一 Phase。

---

## 4. 阻断级问题定义

### 4.1 P0 Blocker

P0 Blocker 必须立即修复。

| 问题 | 示例 |
|---|---|
| 项目无法启动 | client/server 报错退出 |
| typecheck 失败 | TS 编译错误 |
| 核心状态崩溃 | room 进入 undefined state |
| 权威边界破坏 | 客户端直接扣阳光 |
| 关键请求无校验 | 没阳光也能种植物 |
| 双人同步不可用 | 另一名玩家完全看不到状态 |
| GameLoop 重复启动 | 一个房间多个 Tick loop |
| 胜负无法结束 | Boss 死亡后不进入 victory |
| 使用不明 license 资源 | 音频/美术来源不可追踪 |

### 4.2 P1 Major

P1 Major 应在当前阶段或下一阶段早期修复。

| 问题 | 示例 |
|---|---|
| UI 缺少提示 | 操作失败不知道原因 |
| 轻微同步抖动 | 远端玩家位置小幅跳动 |
| 数值偏难或偏简单 | 但系统能跑完 |
| placeholder 不清楚 | 还能测试，但辨识度差 |
| 音效缺失 | 不影响玩法运行 |

### 4.3 P2 Minor

P2 Minor 可记录到 polish。

| 问题 | 示例 |
|---|---|
| 动画不够顺 | 视觉打磨问题 |
| 音量略大 | 可后续混音 |
| UI 不够漂亮 | 不影响理解 |
| 文案需优化 | 不影响功能 |

---

## 5. Phase 0 验收：项目脚手架

### 5.1 目标

确认项目结构可运行，后续开发有基础。

### 5.2 必测项

| ID | 测试 | 期望结果 | 阻断级别 |
|---|---|---|---|
| P0-001 | `npm install` | 安装成功 | P0 |
| P0-002 | `npm run dev:client` | 客户端启动 | P0 |
| P0-003 | `npm run dev:server` | 服务端启动 | P0 |
| P0-004 | `npm run typecheck` | 通过或脚本存在且无错误 | P0 |
| P0-005 | `npm run test` | 测试框架可运行 | P1 |
| P0-006 | 目录结构 | 存在 client/server/shared/docs/assets | P0 |
| P0-007 | README | 有基本启动说明 | P1 |

### 5.3 手工检查

- 打开浏览器能看到基础页面；
- server 控制台显示监听端口；
- 没有明显报错刷屏。

---

## 6. Phase 1 验收：Shared 类型与配置

### 6.1 目标

确认 client 和 server 共享同一套类型和数值。

### 6.2 必测项

| ID | 测试 | 期望结果 | 阻断级别 |
|---|---|---|---|
| P1-001 | shared typecheck | 无 TS 错误 | P0 |
| P1-002 | client import shared | client 能导入 shared 类型 | P0 |
| P1-003 | server import shared | server 能导入 shared 类型 | P0 |
| P1-004 | CombatNumbersV01 存在 | 包含英雄、植物、敌人、Boss 数值 | P0 |
| P1-005 | WavesV01 存在 | 包含 Wave 1–5 | P0 |
| P1-006 | C2S/S2C 常量存在 | 网络事件集中定义 | P0 |
| P1-007 | ActionRejectReason 存在 | 包含主要拒绝原因 | P0 |
| P1-008 | GameStateSnapshot 存在 | 包含 players/plants/enemies/boss/economy | P0 |

### 6.3 配置完整性测试建议

自动化测试应检查：

- `sharedSun` 初始值 >= 0；
- 植物成本 > 0；
- 敌人 HP > 0；
- Boss HP > phase2 threshold；
- WavesV01 时间递增或至少合法；
- laneIndex 在 0–4；
- enemyType 合法。

---

## 7. Phase 2 验收：房间与 Ready

### 7.1 目标

确认两名玩家能进入同一房间，并同步 ready 状态。

### 7.2 必测项

| ID | 测试 | 步骤 | 期望结果 | 阻断级别 |
|---|---|---|---|---|
| P2-001 | 创建房间 | Client A 点击 Create | 返回 matchId、slot 0 | P0 |
| P2-002 | 加入房间 | Client B 输入 matchId | 返回 slot 1 | P0 |
| P2-003 | 玩家列表同步 | 两端查看 lobby | 显示两名玩家 | P0 |
| P2-004 | 第三人加入 | Client C 加入 | 拒绝 ROOM_FULL | P0 |
| P2-005 | Ready 同步 | A/B 分别 ready | 两端 ready 状态一致 | P0 |
| P2-006 | 双 ready 开始 | A/B 都 ready | 进入 countdown 或准备开始 match | P0 |
| P2-007 | leave room | 一人离开 | 房间状态更新 | P1 |

### 7.3 手工测试脚本

```text
1. 启动 server。
2. 启动 client。
3. 打开两个浏览器窗口。
4. A 创建房间。
5. 复制 matchId。
6. B 加入房间。
7. 检查两个窗口的玩家列表。
8. A ready。
9. B ready。
10. 检查是否进入下一状态。
```

---

## 8. Phase 3 验收：状态机与 GameLoop

### 8.1 目标

确认服务器状态机和 Tick 循环稳定运行。

### 8.2 必测项

| ID | 测试 | 期望结果 | 阻断级别 |
|---|---|---|---|
| P3-001 | 双 ready 后进入 COUNTDOWN | matchState = COUNTDOWN | P0 |
| P3-002 | COUNTDOWN 自动结束 | 进入 WAVE_PREP | P0 |
| P3-003 | snapshot 广播 | 客户端持续收到 serverSeq 递增 | P0 |
| P3-004 | phaseChanged 事件 | 状态切换时收到事件 | P0 |
| P3-005 | 单房间单 GameLoop | 不重复启动多个 loop | P0 |
| P3-006 | Debug overlay | 显示 matchState/serverSeq | P1 |

### 8.3 自动化建议

- MatchStateMachine 合法转移测试；
- 禁止非法转移测试；
- GameLoop start/stop 测试。

---

## 9. Phase 4 验收：地图与玩家移动

### 9.1 目标

确认战斗地图可见，双玩家移动同步。

### 9.2 必测项

| ID | 测试 | 期望结果 | 阻断级别 |
|---|---|---|---|
| P4-001 | 地图显示 | 5 路 × 7 格可见 | P0 |
| P4-002 | 基地显示 | 左侧基地可见 | P1 |
| P4-003 | 玩家 A 移动 | B 能看到 A 移动 | P0 |
| P4-004 | 玩家 B 移动 | A 能看到 B 移动 | P0 |
| P4-005 | 边界限制 | 玩家不能走出地图 | P0 |
| P4-006 | aim 同步 | 服务器记录瞄准方向/点 | P1 |
| P4-007 | 远端插值 | 移动不严重抖动 | P1 |

### 9.3 手工测试脚本

```text
1. 双人进入战斗。
2. A 使用 WASD 绕地图移动。
3. B 观察 A 是否移动。
4. B 移动，A 观察。
5. 尝试走出地图边界。
6. 移动鼠标，检查 aim debug 是否变化。
```

---

## 10. Phase 5 验收：共享阳光与种植

### 10.1 目标

确认共享阳光和三种植物种植规则正确。

### 10.2 必测项

| ID | 测试 | 步骤 | 期望结果 | 阻断级别 |
|---|---|---|---|---|
| P5-001 | 初始阳光 | 进入战斗 | sharedSun = 150 | P0 |
| P5-002 | A 种日光芽 | A 选 1 并 E 种植 | sharedSun 扣 50，两端同步 | P0 |
| P5-003 | B 看到 A 的植物 | B 观察地图 | 同位置出现植物 | P0 |
| P5-004 | 同格双种 | A/B 同格种植 | 一个成功，一个 CELL_OCCUPIED | P0 |
| P5-005 | 阳光不足 | 消耗到不足后种植 | NOT_ENOUGH_SUN | P0 |
| P5-006 | 距离太远 | 离格子很远种植 | OUT_OF_RANGE | P0 |
| P5-007 | 日光芽产出 | 等待产出周期 | sharedSun 增加 | P0 |
| P5-008 | sharedSun 不为负 | 连续消费 | 永不低于 0 | P0 |
| P5-009 | 三种植物可种 | 分别种三种 | 都能显示 | P0 |

### 10.3 自动化建议

- EconomySystem spendSun 不允许负数；
- PlantSystem validatePlantRequest；
- 同格占用测试；
- sunbloom 产出计时测试。

---

## 11. Phase 6 验收：敌人与植物防线

### 11.1 目标

确认基础塔防循环成立。

### 11.2 必测项

| ID | 测试 | 期望结果 | 阻断级别 |
|---|---|---|---|
| P6-001 | 生成普通敌人 | 敌人出现在指定 lane | P0 |
| P6-002 | 敌人移动 | 从右向左移动 | P0 |
| P6-003 | 敌人遇植物停止 | 进入 ATTACKING_PLANT | P0 |
| P6-004 | 敌人攻击植物 | 植物 HP 降低 | P0 |
| P6-005 | 植物死亡 | 格子释放 | P0 |
| P6-006 | 豆荚炮攻击 | 同 lane 发射 projectile | P0 |
| P6-007 | projectile 命中 | 敌人 HP 降低 | P0 |
| P6-008 | 敌人死亡 | 从场上移除 | P0 |
| P6-009 | 敌人掉阳光 | 概率增加 sharedSun | P1 |
| P6-010 | 敌人突破基地 | baseHp 降低 | P0 |
| P6-011 | baseHp 归零 | 进入 DEFEAT | P0 |
| P6-012 | 三种敌人差异 | runner 快，brute 肉 | P1 |

### 11.3 手工测试脚本

```text
1. 使用 debug command 在中路生成 shambler。
2. 观察它移动。
3. 在它前方种 barkwall。
4. 观察它停止并攻击。
5. 种 peashotter。
6. 观察 peashotter 攻击并造成伤害。
7. 生成 runner 和 brute，比较速度和血量表现。
8. 不种植物，让敌人突破基地。
```

---

## 12. Phase 7 验收：英雄枪械与弹药

### 12.1 目标

确认枪械英雄可用但受弹药限制。

### 12.2 必测项

| ID | 测试 | 步骤 | 期望结果 | 阻断级别 |
|---|---|---|---|---|
| P7-001 | 射击消耗弹匣 | 左键射击 | ammoInMagazine -1 | P0 |
| P7-002 | 子弹生成 | 射击后 | bullet 出现在 snapshot | P0 |
| P7-003 | 子弹命中敌人 | 朝敌人射击 | 敌人 HP 降低 | P0 |
| P7-004 | 客户端不报命中 | 检查代码 | 命中由 server 判定 | P0 |
| P7-005 | 弹匣空不能射击 | 打空弹匣 | AMMO_EMPTY 或 dryFire | P0 |
| P7-006 | R 换弹 | 弹匣不满且有备弹 | reloading → 补弹 | P0 |
| P7-007 | 换弹中不能射击 | reload 中左键 | RELOADING | P0 |
| P7-008 | 备弹为空不能换弹 | reserveAmmo = 0 | RESERVE_AMMO_EMPTY | P0 |
| P7-009 | Q 买弹药 | sharedSun 足够 | 扣阳光，reserveAmmo 增加 | P0 |
| P7-010 | 买弹药冷却 | 连续按 Q | AMMO_PURCHASE_COOLDOWN | P0 |
| P7-011 | 备弹上限 | reserveAmmo 满 | RESERVE_AMMO_FULL | P0 |

### 12.3 自动化建议

- WeaponSystem fire rate 测试；
- reload transfer 测试；
- ammo cap 测试；
- buyAmmo cost/cooldown 测试；
- bullet collision server-side 测试。

---

## 13. Phase 8 验收：正式波次

### 13.1 目标

确认 Wave 1–5 按配置推进。

### 13.2 必测项

| ID | 测试 | 期望结果 | 阻断级别 |
|---|---|---|---|
| P8-001 | Wave 1 开始 | WAVE_PREP 后进入 WAVE_ACTIVE | P0 |
| P8-002 | Wave 1 刷怪 | 数量与 WavesV01 一致 | P0 |
| P8-003 | Wave 清理 | 刷完且敌人清空后进入 WAVE_CLEAR | P0 |
| P8-004 | Wave 1→2 | 自动进入下一波 | P0 |
| P8-005 | Wave 3 解锁进化 | Wave 3 clear 后 evolutionUnlocked | P0 |
| P8-006 | Wave 5 后 | 进入 BOSS_PREP | P0 |
| P8-007 | 不叠波 | V0.1 不在敌人未清空时进下一波 | P1 |
| P8-008 | UI 显示 wave | 玩家知道当前波次 | P1 |

### 13.3 配置测试建议

自动测试 `WavesV01`：

- wave count = 5；
- 每个 event 的 lane 合法；
- enemyType 合法；
- time >= 0；
- wave 5 后无普通 wave。

---

## 14. Phase 9 验收：英雄进化

### 14.1 目标

确认每名玩家可以在 Wave 3 后进化一次，且效果真实生效。

### 14.2 必测项

| ID | 测试 | 期望结果 | 阻断级别 |
|---|---|---|---|
| P9-001 | Wave 3 前进化 | EVOLUTION_NOT_UNLOCKED | P0 |
| P9-002 | Wave 3 后 UI | 显示可进化 | P1 |
| P9-003 | 阳光不足进化 | NOT_ENOUGH_SUN | P0 |
| P9-004 | 火力进化 | 伤害/弹匣上限改变 | P0 |
| P9-005 | 控制进化 | 子弹可减速敌人 | P0 |
| P9-006 | 支援进化 | 买弹药成本/冷却降低 | P0 |
| P9-007 | 重复进化 | ALREADY_EVOLVED | P0 |
| P9-008 | 死亡时进化 | PLAYER_DEAD | P1 |
| P9-009 | 进化不补弹 | ammo 不自动满 | P0 |

### 14.3 手工测试脚本

```text
1. 进入 Wave 1，尝试进化，确认失败。
2. 快速通过或正常打到 Wave 3 clear。
3. 积攒足够阳光。
4. 玩家 A 选择 firepower。
5. 检查伤害或弹匣变化。
6. 玩家 B 选择 support。
7. 检查买弹药价格是否降低。
8. 玩家 A 再次尝试进化，确认失败。
```

---

## 15. Phase 10 验收：Boss 战

### 15.1 目标

确认两阶段 Boss、弱点、打断和胜利条件成立。

### 15.2 必测项

| ID | 测试 | 期望结果 | 阻断级别 |
|---|---|---|---|
| P10-001 | Boss 生成 | BOSS_PREP 后进入 BOSS_ACTIVE 并出现 Boss | P0 |
| P10-002 | Boss HP 显示 | 两端同步 Boss HP | P0 |
| P10-003 | 植物伤害 Boss | Boss HP 降低 | P0 |
| P10-004 | 英雄伤害 Boss | Boss HP 降低 | P0 |
| P10-005 | Phase 2 触发 | 50% HP 后 phase = 2 | P0 |
| P10-006 | 弱点暴露 | weakPointActive 同步 | P0 |
| P10-007 | 英雄命中弱点 | interruptProgress 增加 | P0 |
| P10-008 | 植物命中 Boss | 不增加 interruptProgress | P0 |
| P10-009 | 控制进化加成 | 打断效率提高 | P1 |
| P10-010 | 火力弱点倍率 | 弱点伤害提高 | P1 |
| P10-011 | 打断成功 | Boss charge 取消，播放反馈 | P0 |
| P10-012 | 打断失败 | Boss 冲锋并伤害植物/英雄 | P0 |
| P10-013 | Boss 死亡 | 进入 VICTORY | P0 |
| P10-014 | 同 Tick 胜负冲突 | DEFEAT 优先 | P1 |
| P10-015 | Boss 不由客户端打断 | 无 boss.interrupt request | P0 |

### 15.3 Boss 手工测试脚本

```text
1. 正常打到 Boss，或用 dev command startBoss。
2. 观察 Boss HP bar。
3. 用植物攻击 Boss。
4. 用英雄射击 Boss。
5. 降低 Boss 到 50% 以下。
6. 观察 Phase 2 转换。
7. 等待 charge windup。
8. 命中弱点 6 interrupt points。
9. 确认 Boss 被打断。
10. 再次等待 charge，不打断。
11. 确认 Boss 冲锋并造成惩罚。
12. 击杀 Boss，确认 Victory。
```

---

## 16. Phase 11 验收：UI、反馈、结算

### 16.1 目标

确认玩家能理解战局，胜负后能看到统计。

### 16.2 UI 必测项

| ID | UI | 期望结果 | 阻断级别 |
|---|---|---|---|
| P11-001 | sharedSun | 实时显示 | P0 |
| P11-002 | baseHp | 实时显示 | P0 |
| P11-003 | wave | 显示当前 wave | P0 |
| P11-004 | player HP | 显示自己/队友 HP | P1 |
| P11-005 | ammo | 显示弹匣/备弹 | P0 |
| P11-006 | reload | 显示换弹状态 | P1 |
| P11-007 | ammo cooldown | 显示补弹冷却 | P1 |
| P11-008 | selected plant | 显示当前选中植物 | P0 |
| P11-009 | evolution panel | 可选路线 | P0 |
| P11-010 | boss HP | Boss 战显示 | P0 |
| P11-011 | interrupt bar | charge 时显示 | P0 |
| P11-012 | rejected toast | 操作失败显示原因 | P0 |
| P11-013 | result screen | 胜负后显示 | P0 |

### 16.3 结算统计必测项

| ID | 统计 | 期望结果 | 阻断级别 |
|---|---|---|---|
| P11-S001 | result | VICTORY/DEFEAT 正确 | P0 |
| P11-S002 | clearTime | 有时长 | P1 |
| P11-S003 | baseHpRemaining | 正确 | P0 |
| P11-S004 | totalSunEarned/Spent | 大致可信 | P1 |
| P11-S005 | plantsPlaced | 计数正确 | P1 |
| P11-S006 | enemiesKilled | 计数正确 | P1 |
| P11-S007 | shotsFired | 射击次数记录 | P1 |
| P11-S008 | ammoPurchases | 购买次数记录 | P1 |
| P11-S009 | evolutionPath | 显示选择路线 | P1 |

---

## 17. Phase 12 验收：音频管线

### 17.1 目标

确认关键音频事件可触发，且资源 license 管理安全。

### 17.2 必测项

| ID | 测试 | 期望结果 | 阻断级别 |
|---|---|---|---|
| P12-001 | AudioManager 初始化 | 用户交互后可播放 | P0 |
| P12-002 | 缺失音频 fallback | 不崩溃 | P0 |
| P12-003 | shoot 音效 | 射击触发 | P1 |
| P12-004 | dry fire 音效 | 空枪触发 | P1 |
| P12-005 | plant 音效 | 种植成功触发 | P1 |
| P12-006 | sun 音效 | 阳光获得触发 | P1 |
| P12-007 | boss warning 音效 | 冲锋读条触发 | P1 |
| P12-008 | victory/defeat 音效 | 结算触发 | P1 |
| P12-009 | audio status 文档 | 存在且更新 | P0 |
| P12-010 | license 文档 | 真实音频均记录 | P0 |
| P12-011 | attribution 文档 | 需要署名资源有记录 | P0 |
| P12-012 | 不明来源音频 | 不存在 | P0 |

### 17.3 音频 license 检查

每个真实音频必须记录：

- Source page；
- Author；
- License；
- Commercial use allowed；
- Attribution required；
- Raw path；
- Processed path。

如果没有，不能标记为 integrated/approved。

---

## 18. Phase 13 验收：美术管线

### 18.1 目标

确认所有 P0 gameplay object 都有可见资源或 placeholder，且资源管理规范。

### 18.2 必测项

| ID | 测试 | 期望结果 | 阻断级别 |
|---|---|---|---|
| P13-001 | art registry | 所有 P0 asset key 集中管理 | P0 |
| P13-002 | missing art fallback | 缺图不崩溃 | P0 |
| P13-003 | 两名英雄可区分 | 颜色/轮廓不同 | P1 |
| P13-004 | 三种植物可区分 | 经济/输出/防御清楚 | P1 |
| P13-005 | 三种敌人可区分 | 普通/快速/装甲清楚 | P1 |
| P13-006 | Boss 可识别 | 明显比普通敌人大 | P1 |
| P13-007 | weakpoint 可见 | Boss 弱点醒目 | P0 |
| P13-008 | plant cell 可见 | 不遮挡植物 | P1 |
| P13-009 | asset_status 文档 | 存在且更新 | P0 |
| P13-010 | image prompts 保存 | source_prompts 存在 | P1 |
| P13-011 | 无侵权明显素材 | 不像 PVZ 或其他游戏 | P0 |

### 18.3 美术可读性手工检查

在实际游戏画面中检查：

```text
1. 缩放到正常游戏视角。
2. 截图查看是否一眼能分辨单位。
3. 快速敌人是否看起来更快。
4. 装甲敌人是否看起来更肉。
5. Boss 弱点是否明显。
6. 五条路线是否清楚。
7. UI 是否遮挡战斗。
```

---

## 19. Phase 14 验收：端到端试玩与平衡

### 19.1 目标

确认完整 V0.1 闭环可玩，并记录可调参数。

### 19.2 必须完成的端到端流程

```text
Create Room
→ Join Room
→ Both Ready
→ Countdown
→ Wave 1
→ Wave 2
→ Wave 3
→ Evolution Unlock
→ Wave 4
→ Wave 5
→ Boss Prep
→ Boss Active
→ Victory or Defeat
→ Result Screen
```

### 19.3 必须记录的指标

| 指标 | 目标范围 |
|---|---:|
| 总时长 | 300–480 秒 |
| Boss 战时长 | 90–150 秒 |
| 总阳光获得 | 1400–1900 |
| 总阳光消耗 | 1200–1800 |
| 种植数量 | 10–18 |
| 弹药购买次数 | 3–6 |
| 玩家死亡次数 | 0–4 |
| Boss 冲锋打断成功率 | 40%–80% |
| 基地剩余 HP | 1–7，胜利时 |

### 19.4 Playtest Report 必须包含

`docs/PLAYTEST_REPORT_V0_1.md` 必须包含：

```md
# PLAYTEST_REPORT_V0_1.md

## Test Environment

## Build / Commit

## Testers

## Run Summary

## Metrics

## What Worked

## Problems Found

## Balance Observations

## Bugs

## Tuning Changes Made

## Remaining Known Issues

## Recommendation
Can proceed to Phase 15: Yes/No
```

### 19.5 调参限制

Phase 14 只能做小范围调参。

禁止：

- 新增植物；
- 新增武器；
- 新增 Boss；
- 重写网络架构；
- 加账号系统；
- 加局外成长。

---

## 20. Phase 15 验收：Demo 交付

### 20.1 目标

确认项目可以交给别人跑起来。

### 20.2 必测项

| ID | 测试 | 期望结果 | 阻断级别 |
|---|---|---|---|
| P15-001 | README 安装步骤 | 新用户能跟着安装 | P0 |
| P15-002 | README 启动 server | 指令正确 | P0 |
| P15-003 | README 启动 client | 指令正确 | P0 |
| P15-004 | 双开测试说明 | 清楚可执行 | P0 |
| P15-005 | Controls | 操作键位完整 | P1 |
| P15-006 | Scope | 明确 V0.1 范围 | P1 |
| P15-007 | Known Issues | 已知问题诚实列出 | P1 |
| P15-008 | License notes | 美术/音频说明存在 | P0 |
| P15-009 | build | `npm run build` 通过 | P0 |
| P15-010 | typecheck | `npm run typecheck` 通过 | P0 |
| P15-011 | test | `npm run test` 通过或说明限制 | P1 |

---

## 21. 最终 MVP 验收清单

### 21.1 玩法闭环

| ID | 项目 | 必须通过 |
|---|---|---:|
| MVP-GAME-001 | 双人进入同一房间 | 是 |
| MVP-GAME-002 | 双方 ready 后进入战斗 | 是 |
| MVP-GAME-003 | 五路地图可见 | 是 |
| MVP-GAME-004 | 双人移动同步 | 是 |
| MVP-GAME-005 | 共享阳光同步 | 是 |
| MVP-GAME-006 | 三种植物可种 | 是 |
| MVP-GAME-007 | 三种敌人可进攻 | 是 |
| MVP-GAME-008 | 植物能攻击敌人 | 是 |
| MVP-GAME-009 | 英雄能射击/换弹/买弹药 | 是 |
| MVP-GAME-010 | Wave 1–5 完整推进 | 是 |
| MVP-GAME-011 | Wave 3 后进化 | 是 |
| MVP-GAME-012 | Boss 两阶段 | 是 |
| MVP-GAME-013 | Boss 冲锋可打断 | 是 |
| MVP-GAME-014 | 胜利/失败结算 | 是 |

### 21.2 联机权威

| ID | 项目 | 必须通过 |
|---|---|---:|
| MVP-NET-001 | 客户端不直接扣阳光 | 是 |
| MVP-NET-002 | 客户端不判定命中 | 是 |
| MVP-NET-003 | 客户端不判定 Boss 打断 | 是 |
| MVP-NET-004 | 客户端不判定胜负 | 是 |
| MVP-NET-005 | 种植由服务器校验 | 是 |
| MVP-NET-006 | 射击弹药由服务器校验 | 是 |
| MVP-NET-007 | GameStateSnapshot 可完整渲染 | 是 |
| MVP-NET-008 | action rejected 有原因 | 是 |

### 21.3 工程质量

| ID | 项目 | 必须通过 |
|---|---|---:|
| MVP-ENG-001 | typecheck 通过 | 是 |
| MVP-ENG-002 | build 通过 | 是 |
| MVP-ENG-003 | client/server 可启动 | 是 |
| MVP-ENG-004 | shared config 被使用 | 是 |
| MVP-ENG-005 | 玩法数值未大量硬编码 | 是 |
| MVP-ENG-006 | 目录结构符合规范 | 是 |
| MVP-ENG-007 | Gate Reports 存在 | 是 |
| MVP-ENG-008 | README 可用 | 是 |

### 21.4 资源安全

| ID | 项目 | 必须通过 |
|---|---|---:|
| MVP-ASSET-001 | P0 美术可见或 placeholder | 是 |
| MVP-ASSET-002 | 无明显侵权美术 | 是 |
| MVP-ASSET-003 | asset status 存在 | 是 |
| MVP-AUDIO-001 | P0 音频有 placeholder 或真实资源 | 是 |
| MVP-AUDIO-002 | 真实音频 license 记录完整 | 是 |
| MVP-AUDIO-003 | attribution 文档存在 | 是 |
| MVP-AUDIO-004 | 无不明来源音频 | 是 |

---

## 22. 最终手工测试脚本

### 22.1 准备

```text
1. 拉取最新代码。
2. npm install。
3. npm run typecheck。
4. npm run build。
5. npm run dev:server。
6. npm run dev:client。
7. 打开两个浏览器窗口。
```

### 22.2 房间测试

```text
1. Window A 创建房间。
2. Window B 加入房间。
3. 检查双方玩家列表。
4. A ready。
5. B ready。
6. 进入 countdown。
```

### 22.3 战斗测试

```text
1. A/B 分别移动。
2. A 种日光芽。
3. B 种豆荚炮。
4. 检查 sharedSun 同步。
5. 等待 Wave 1。
6. 用植物和英雄处理敌人。
7. 打空弹匣，测试换弹。
8. 买弹药，检查阳光扣除。
9. 打到 Wave 3 后测试进化。
10. 打完 Wave 5。
11. 进入 Boss。
12. 测试弱点和打断。
13. 打出 Victory 或故意失败。
14. 检查 Result Screen。
```

### 22.4 记录结果

测试结束后记录：

- 是否完整跑通；
- 是否有崩溃；
- 是否有明显不同步；
- 哪些 UI 看不懂；
- Boss 是否能理解；
- 是否愿意再打一局；
- 需要优先修复的问题。

---

## 23. Codex 验收执行 Prompt

可以直接给 Codex 使用：

```md
Task: Run MVP acceptance verification for the current phase.

Read:
- docs/MVP_ACCEPTANCE_TESTS_V0_1.md
- docs/CODEX_IMPLEMENTATION_PLAN.md
- docs/NETWORK_SYNC_SPEC.md
- docs/RULES_CORE_LOOP.md

Goal:
Verify whether the current implementation passes the acceptance criteria for the current phase.

Do not add new features.
Only fix P0 blockers if they are small and clearly within the current phase scope.

Output:
1. Current phase.
2. Tests run.
3. Acceptance checklist results.
4. P0 blockers.
5. P1 major issues.
6. P2 minor issues.
7. Commands run and results.
8. Whether the project can proceed to the next phase.
9. If not, exact required fixes.
```

---

## 24. 用户审查打分建议

用户每阶段可以按 100 分简单打分：

| 类别 | 分值 |
|---|---:|
| 核心功能完成 | 40 |
| 联机/服务器权威正确 | 20 |
| 稳定性和 typecheck | 15 |
| UI/反馈可理解 | 10 |
| 文档和 Gate Report | 10 |
| 资源/license 安全 | 5 |

如果低于 80 分，不建议进入下一阶段。

如果有 P0 Blocker，即使总分高，也不能进入下一阶段。

---

## 25. 当前版本最终结论

`MVP_ACCEPTANCE_TESTS_V0_1.md` 是 V0.1 的质量闸门。

它的核心原则是：

> 不靠 Codex 自称完成，不靠肉眼感觉完成，而是用阶段测试、阻断问题、Gate Report 和最终端到端试玩来判断是否真的可玩、可控、可交付。

只要每个阶段按本文档验收，项目就能避免“看起来做了很多，最后跑不通”的常见 Agent 开发风险。

