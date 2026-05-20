# AUDIO_PIPELINE_V0_1.md

# 双人合作枪械英雄塔防 V0.1 音频资源管线规范

## 0. 文档目的

本文档定义 V0.1 的音频方向、免费资源获取规则、许可审查流程、文件命名规范、目录结构、音频处理标准、Phaser 接入方式、AudioManager 设计、事件映射、验收标准和 Codex 执行 Prompt。

本文档的目标是确保项目在没有专业音频设计师的情况下，仍然可以建立一条安全、清晰、可维护的音频管线：

- 音效来源合法；
- 每个资源都有 license 记录；
- 文件命名统一；
- 音量和格式统一；
- Phaser 接入清晰；
- 音频缺失时不阻塞玩法开发；
- 后续可以替换为更高质量资源。

---

## 1. 音频总方向一句话

**轻量卡通战术塔防音频：枪械短促清晰，植物攻击有弹性，阳光反馈明亮，敌人受击偏污染生物质感，Boss 厚重但不恐怖，整体服务玩法可读性和合作节奏。**

---

## 2. 音频设计原则

### 2.1 玩法反馈优先

V0.1 的音频不是为了电影化，而是为了让玩家立刻理解发生了什么。

必须优先支持：

- 是否成功射击；
- 是否没子弹；
- 是否换弹完成；
- 是否种植成功；
- 阳光是否获得；
- 敌人是否被击中；
- Boss 是否开始冲锋；
- Boss 是否被打断；
- 基地是否受损；
- 胜利或失败。

### 2.2 短音效优先

V0.1 多数音效应短、干净、易混音。

建议：

| 音效类型 | 推荐长度 |
|---|---:|
| UI 点击 | 0.05–0.2 秒 |
| 枪声 | 0.08–0.35 秒 |
| 换弹 | 0.4–1.2 秒 |
| 种植 | 0.2–0.6 秒 |
| 阳光获得 | 0.2–0.8 秒 |
| 敌人受击 | 0.08–0.3 秒 |
| 敌人死亡 | 0.3–0.8 秒 |
| Boss 技能提示 | 0.5–2.0 秒 |
| 胜负提示 | 1.5–4.0 秒 |
| BGM loop | 30–90 秒 |

### 2.3 不抢 UI 和语音空间

V0.1 不做角色语音，因此音效不需要给语音留很多空间。但音效仍要避免：

- 过长混响；
- 低频太重；
- 枪声太刺耳；
- 多个重复音效叠加爆音；
- 背景音乐盖过 Boss 提示。

### 2.4 许可安全优先

任何音频资源如果无法确认授权，禁止使用。

规则：

> 没有明确 license 的资源，视为不可用。

---

## 3. 音频风格关键词

### 3.1 正向关键词

```text
cartoon tactical tower defense
short readable game SFX
co-op action feedback
light sci-fi garden tech
mutated organic impacts
clean UI blips
playful apocalypse
boss warning stingers
arcade readability
```

### 3.2 中文理解

| 关键词 | 含义 |
|---|---|
| 卡通战术 | 不是写实军事枪声，而是轻量游戏化枪声 |
| 花园科技 | 阳光、植物、生态装置有明亮能量感 |
| 污染生物 | 敌人音效可以有黏液、真菌、低沉嘶吼感 |
| 合作反馈 | 队友消耗阳光、Boss 打断等要明显 |
| Boss 警告 | 冲锋读条、弱点暴露必须有声音提示 |
| 短促清晰 | 音效用于判断，不是铺满空间 |

### 3.3 禁止方向

禁止使用或追求：

- 真实血腥惨叫；
- 过度恐怖音效；
- 直接来自知名游戏、电影、动漫的音效；
- 来源不明的枪声包；
- 版权音乐；
- 未确认授权的 YouTube / Bilibili / TikTok 音频；
- 带明显品牌、角色、台词的音效。

---

## 4. 许可与来源规则

## 4.1 允许的授权类型

V0.1 优先使用以下类型：

| License 类型 | 是否推荐 | 说明 |
|---|---:|---|
| CC0 / Public Domain | 强烈推荐 | 最适合原型和后续发布 |
| Royalty-free with commercial use allowed | 推荐 | 必须保存 license 文本 |
| CC BY | 可用 | 必须记录作者和署名要求 |
| 自制 / 合成 | 推荐 | 用工具合成 UI、提示音很安全 |
| 付费已授权资源 | 可用 | 必须保存购买凭证和 license |

## 4.2 谨慎使用的授权类型

| License 类型 | 风险 |
|---|---|
| CC BY-SA | 可能要求同许可证分享衍生品，需谨慎 |
| CC BY-NC | 不允许商业用途，不建议用于可发布版本 |
| 网站写“free”但无 license | 不可直接使用 |
| 用户上传但未标注授权 | 不可直接使用 |
| 只允许个人使用 | 不适合项目发布 |

## 4.3 禁止使用

禁止使用：

- 明确禁止商业用途的资源；
- 未标注 license 的资源；
- 需要单独授权但没有授权证明的资源；
- 从其他游戏文件中提取的音效；
- 从影视、动漫、短视频、直播剪辑中截取的音频；
- AI 生成但平台条款不明确的音频；
- 无法追踪来源的音频包。

---

## 5. 候选免费音频来源策略

### 5.1 重要原则

候选来源不等于安全来源。

Codex 搜索音频时，可以参考常见免费音效网站或游戏资源社区，但必须对每一个下载的具体文件单独核验：

- 资源页面；
- 作者；
- license；
- 是否允许商业使用；
- 是否需要署名；
- 下载时间；
- 原始链接；
- 是否允许修改和再分发。

### 5.2 可搜索的候选来源类型

| 来源类型 | 用途 | 注意事项 |
|---|---|---|
| 免费游戏音效包 | UI、枪声、怪物、胜负提示 | 必须检查每个包 license |
| CC0 音效库 | 通用 SFX | 优先选择 |
| 游戏开发者资源社区 | BGM、UI、环境声 | 注意作者署名要求 |
| 免费音乐库 | BGM loop | 必须确认可用于游戏 |
| 自制合成工具 | UI blip、警告音 | 最安全，质量可控 |

### 5.3 候选站点名记录方式

如果 Codex 使用某个网站或资源包，不能只写“网上下载”。必须记录：

```text
Source Site:
Asset Page URL:
Author:
License:
Commercial Use Allowed:
Attribution Required:
Downloaded At:
Original Filename:
Processed Filename:
Notes:
```

### 5.4 推荐搜索关键词

Codex 搜索时可使用：

```text
CC0 game gunshot sound effect
CC0 reload sound effect
free game UI click CC0
free cartoon impact sound CC0
free monster growl game sound CC0
free boss roar sound effect game license
free tower defense game sound effects CC0
free sci-fi warning beep sound CC0
free victory fanfare game CC0
free defeat sting game CC0
free ambient loop game CC0
```

中文搜索也可以，但必须更严格核验授权。

---

## 6. 音频资产目录结构

推荐目录：

```text
assets/
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
```

### 6.1 raw

保存原始下载文件，不直接在游戏中使用。

### 6.2 processed

保存处理后的游戏内使用文件。

### 6.3 temp

临时裁剪、转换、实验文件，可定期清理。

### 6.4 docs

保存：

- 音频状态表；
- license 记录；
- 署名文件；
- 处理日志。

---

## 7. 文件命名规范

### 7.1 命名原则

使用小写 snake_case。

格式：

```text
sfx_<category>_<event>_<variant>.<ext>
ui_<event>_<variant>.<ext>
music_<context>_<variant>.<ext>
amb_<context>_<variant>.<ext>
```

### 7.2 示例

```text
sfx_weapon_pistol_shot_01.ogg
sfx_weapon_pistol_dry_fire_01.ogg
sfx_weapon_reload_start_01.ogg
sfx_weapon_reload_complete_01.ogg
sfx_plant_place_01.ogg
sfx_plant_peashot_01.ogg
sfx_sun_gain_01.ogg
sfx_enemy_hit_organic_01.ogg
sfx_enemy_death_pop_01.ogg
sfx_boss_roar_01.ogg
sfx_boss_charge_warning_01.ogg
sfx_boss_interrupted_01.ogg
ui_click_01.ogg
ui_error_01.ogg
music_battle_loop_01.ogg
music_boss_loop_01.ogg
stinger_victory_01.ogg
stinger_defeat_01.ogg
```

### 7.3 变体编号

同一事件可以有多个变体：

```text
sfx_enemy_hit_organic_01.ogg
sfx_enemy_hit_organic_02.ogg
sfx_enemy_hit_organic_03.ogg
```

AudioManager 可随机选择，避免重复疲劳。

---

## 8. 推荐音频格式

### 8.1 游戏内格式

V0.1 推荐：

| 类型 | 格式 |
|---|---|
| SFX | `.ogg`，必要时同时导出 `.mp3` fallback |
| UI | `.ogg` |
| Music/BGM | `.ogg` |
| Raw source | 保留原格式，如 `.wav` / `.mp3` / `.ogg` |

### 8.2 采样率和声道

| 类型 | 推荐 |
|---|---|
| SFX sample rate | 44.1 kHz |
| Music sample rate | 44.1 kHz |
| SFX channels | mono 或 stereo，优先 mono |
| Music channels | stereo |
| Bitrate | OGG quality 4–6 或等效设置 |

### 8.3 文件大小目标

| 类型 | 目标大小 |
|---|---:|
| 单个短 SFX | < 150 KB |
| UI 音效 | < 80 KB |
| Boss 技能音 | < 300 KB |
| BGM loop | < 3–6 MB |

V0.1 Web 游戏应控制加载体积。

---

## 9. 音量与混音规范

### 9.1 音量分类

AudioManager 必须支持至少四个音量组：

```ts
export type AudioBus = "master" | "sfx" | "music" | "ui";
```

### 9.2 默认音量

| Bus | 默认音量 |
|---|---:|
| master | 1.0 |
| sfx | 0.85 |
| music | 0.45 |
| ui | 0.7 |

### 9.3 单事件音量建议

| 音频事件 | 音量建议 |
|---|---:|
| pistol shot | 0.45–0.6 |
| dry fire | 0.35 |
| reload | 0.45 |
| plant place | 0.5 |
| sun gain | 0.45 |
| enemy hit | 0.35 |
| enemy death | 0.45 |
| boss roar | 0.75 |
| boss charge warning | 0.8 |
| boss interrupted | 0.75 |
| UI click | 0.4 |
| UI error | 0.45 |
| victory | 0.8 |
| defeat | 0.75 |
| battle music | 0.35–0.45 |

### 9.4 重复播放限制

避免音效重叠爆炸。

AudioManager 应支持 cooldown / throttle：

| 事件 | 最小重复间隔 |
|---|---:|
| enemy hit | 40 ms |
| plant shot | 50 ms |
| pistol shot | 由射速控制 |
| sun gain | 80 ms |
| UI error | 150 ms |
| base damaged | 300 ms |
| boss warning | 不叠加 |

---

## 10. V0.1 音频事件总表

### 10.1 P0 必须音频

| Audio ID | 事件 | 用途 | 优先级 |
|---|---|---|---|
| `sfx_weapon_pistol_shot_01` | 英雄开枪 | 射击反馈 | P0 |
| `sfx_weapon_pistol_dry_fire_01` | 空枪 | 告诉玩家没子弹 | P0 |
| `sfx_weapon_reload_01` | 换弹 | 换弹反馈 | P0 |
| `sfx_plant_place_01` | 种植成功 | 建造反馈 | P0 |
| `sfx_ui_error_01` | 操作失败 | 拒绝反馈 | P0 |
| `sfx_sun_gain_01` | 阳光获得 | 经济反馈 | P0 |
| `sfx_plant_shoot_01` | 植物攻击 | 防线反馈 | P0 |
| `sfx_enemy_hit_01` | 敌人受击 | 命中反馈 | P0 |
| `sfx_enemy_death_01` | 敌人死亡 | 击杀反馈 | P0 |
| `sfx_base_damaged_01` | 基地受损 | 危险反馈 | P0 |
| `sfx_wave_start_01` | 波次开始 | 节奏提示 | P0 |
| `sfx_boss_spawn_01` | Boss 登场 | 高潮提示 | P0 |
| `sfx_boss_charge_warning_01` | Boss 冲锋警告 | 打断机制提示 | P0 |
| `sfx_boss_interrupted_01` | Boss 被打断 | 成功反馈 | P0 |
| `stinger_victory_01` | 胜利 | 结算反馈 | P0 |
| `stinger_defeat_01` | 失败 | 结算反馈 | P0 |

### 10.2 P1 建议音频

| Audio ID | 事件 | 用途 |
|---|---|---|
| `sfx_weapon_reload_start_01` | 开始换弹 | 更细反馈 |
| `sfx_weapon_reload_complete_01` | 换弹完成 | 更细反馈 |
| `sfx_ammo_purchase_01` | 买弹药成功 | 资源消费反馈 |
| `sfx_evolution_firepower_01` | 火力进化 | 进化反馈 |
| `sfx_evolution_control_01` | 控制进化 | 进化反馈 |
| `sfx_evolution_support_01` | 支援进化 | 进化反馈 |
| `sfx_boss_weakpoint_expose_01` | Boss 弱点暴露 | 打弱点提示 |
| `sfx_boss_hammer_slam_01` | Boss 重锤 | 技能反馈 |
| `sfx_boss_phase2_01` | Boss 二阶段 | 阶段变化 |
| `sfx_hero_hit_01` | 英雄受击 | 生存反馈 |
| `sfx_hero_death_01` | 英雄死亡 | 压力反馈 |
| `sfx_hero_respawn_01` | 英雄复活 | 回归反馈 |
| `ui_click_01` | UI 点击 | 菜单反馈 |
| `ui_hover_01` | UI hover | 可选反馈 |

### 10.3 P2 打磨音频

| Audio ID | 事件 | 用途 |
|---|---|---|
| `music_battle_loop_01` | 普通战斗 BGM | 氛围 |
| `music_boss_loop_01` | Boss BGM | 高潮 |
| `amb_greenhouse_low_01` | 战场环境 | 氛围 |
| `sfx_enemy_runner_call_01` | 快速敌人出现 | 敌人识别 |
| `sfx_enemy_brute_step_01` | 装甲敌人脚步 | 压迫感 |
| `sfx_boss_roar_variant_02` | Boss roar 变体 | 降低重复 |
| `sfx_sun_suppression_01` | 阳光压制 | Boss 技能 |

---

## 11. 音频资产状态表

Codex 必须维护：

```text
assets/audio/docs/audio_asset_status_v0_1.md
```

### 11.1 表格模板

| Audio ID | Category | Priority | Status | Source | License | Attribution Required | Raw Path | Processed Path | Notes |
|---|---|---|---|---|---|---|---|---|---|
| sfx_weapon_pistol_shot_01 | weapon | P0 | missing | TBD | TBD | TBD | - | - | - |

### 11.2 Status 枚举

```text
missing
candidate_found
license_verified
downloaded
processed
integrated
approved
rejected
needs_replacement
```

### 11.3 Source 枚举

```text
cc0_library
free_audio_pack
open_game_asset_site
self_synthesized
manual_recording
placeholder_silence
```

### 11.4 License 字段要求

License 不允许写模糊内容。

错误：

```text
free
online
probably ok
unknown
```

正确：

```text
CC0
CC BY 4.0
Royalty-free, commercial use allowed, attribution not required
Custom license saved in assets/audio/docs/licenses/<file>.txt
```

---

## 12. License 记录文档

Codex 必须维护：

```text
assets/audio/docs/audio_licenses_v0_1.md
```

### 12.1 每个资源的 license 记录模板

```md
## Audio ID: sfx_weapon_pistol_shot_01

- Processed filename: sfx_weapon_pistol_shot_01.ogg
- Raw filename: original_download_name.wav
- Source page:
- Source site:
- Author:
- License:
- Commercial use allowed: yes/no/unknown
- Modification allowed: yes/no/unknown
- Attribution required: yes/no
- Download date:
- Notes:
- Local raw path:
- Local processed path:
```

### 12.2 Attribution 文档

如果使用需要署名的资源，Codex 必须同步维护：

```text
assets/audio/docs/attribution_v0_1.md
```

模板：

```md
# Audio Attribution

This project uses the following third-party audio resources:

- [Audio Title] by [Author], licensed under [License]. Source: [Source Page]. Modified for game use.
```

如果所有资源均为 CC0 或自制，也应写：

```text
No attribution-required audio assets are currently used.
```

---

## 13. 音频处理流程

### 13.1 总流程

```text
1. 确定需要的 Audio ID
2. 搜索候选资源
3. 核验 license
4. 下载 raw 文件
5. 保存 source 与 license 信息
6. 裁剪静音和无关片段
7. 规范化响度和峰值
8. 转换为 .ogg
9. 放入 processed 目录
10. 更新 audio_asset_status
11. 在 AudioManager 注册
12. 游戏内测试播放
13. 标记 integrated / approved
```

### 13.2 处理要求

每个音频处理时应尽量做到：

- 去除开头和结尾多余静音；
- 避免爆音；
- 保留快速起音；
- 降低过长尾音；
- 短 SFX 不要过分混响；
- 统一响度范围；
- 转换后试听。

### 13.3 建议音频处理工具

Codex 可优先使用命令行工具，如：

```text
ffmpeg
sox
```

也可以只创建处理脚本，让用户本地执行。

### 13.4 ffmpeg 示例

转换为 ogg：

```bash
ffmpeg -i input.wav -vn -c:a libvorbis -q:a 5 output.ogg
```

裁剪前 0.1 秒到 1.2 秒：

```bash
ffmpeg -i input.wav -ss 0.1 -to 1.2 -c:a libvorbis -q:a 5 output.ogg
```

简单响度规范化示例：

```bash
ffmpeg -i input.wav -af loudnorm -c:a libvorbis -q:a 5 output.ogg
```

注意：最终参数应根据试听调整，不能机械套用。

---

## 14. 占位音频策略

### 14.1 为什么需要占位音频

免费音频查找和许可核验可能耗时。

玩法开发不能被音频阻塞。

因此每个 P0 Audio ID 都可以先使用占位音频。

### 14.2 允许的占位方式

占位音频可以是：

- 静音文件；
- 简单 beep；
- Web Audio API 合成短音；
- Phaser 动态音效；
- 自制简单合成音。

### 14.3 占位音频命名

```text
placeholder_sfx_weapon_pistol_shot.ogg
placeholder_ui_error.ogg
placeholder_boss_warning.ogg
```

### 14.4 占位音频状态

在状态表中标记为：

```text
placeholder_silence
self_synthesized
needs_replacement
```

---

## 15. AudioManager 设计

### 15.1 设计目标

AudioManager 应该简单、数据驱动、可替换。

职责：

- preload 音频资源；
- 根据事件播放音效；
- 支持音量组；
- 支持随机变体；
- 支持事件节流；
- 支持 BGM 播放和切换；
- 支持 mute；
- 支持缺失音频安全 fallback。

### 15.2 推荐文件

```text
client/src/audio/AudioManager.ts
client/src/audio/audioRegistry.ts
client/src/audio/audioEvents.ts
client/src/audio/audioBuses.ts
```

### 15.3 AudioEvent 枚举

```ts
export type AudioEventId =
  | "weapon.pistolShot"
  | "weapon.dryFire"
  | "weapon.reload"
  | "plant.place"
  | "plant.shoot"
  | "sun.gain"
  | "enemy.hit"
  | "enemy.death"
  | "base.damaged"
  | "wave.start"
  | "boss.spawn"
  | "boss.weakPointExpose"
  | "boss.chargeWarning"
  | "boss.interrupted"
  | "match.victory"
  | "match.defeat"
  | "ui.click"
  | "ui.error";
```

### 15.4 Audio Registry 示例

```ts
export const AudioRegistryV01 = {
  "weapon.pistolShot": {
    bus: "sfx",
    variants: ["sfx_weapon_pistol_shot_01"],
    volume: 0.55,
    minIntervalMs: 80,
  },
  "weapon.dryFire": {
    bus: "sfx",
    variants: ["sfx_weapon_pistol_dry_fire_01"],
    volume: 0.35,
    minIntervalMs: 120,
  },
  "weapon.reload": {
    bus: "sfx",
    variants: ["sfx_weapon_reload_01"],
    volume: 0.45,
    minIntervalMs: 300,
  },
  "plant.place": {
    bus: "sfx",
    variants: ["sfx_plant_place_01"],
    volume: 0.5,
    minIntervalMs: 80,
  },
  "sun.gain": {
    bus: "sfx",
    variants: ["sfx_sun_gain_01"],
    volume: 0.45,
    minIntervalMs: 80,
  },
  "boss.chargeWarning": {
    bus: "sfx",
    variants: ["sfx_boss_charge_warning_01"],
    volume: 0.8,
    minIntervalMs: 1000,
  },
} as const;
```

### 15.5 缺失资源 fallback

如果某个 audio key 未加载：

- 不应导致游戏崩溃；
- AudioManager 记录 warning；
- 开发模式可在 debug overlay 显示 missing audio；
- 生产或演示模式静默跳过。

---

## 16. Phaser 接入规范

### 16.1 Preload 示例

```ts
this.load.audio("sfx_weapon_pistol_shot_01", [
  "assets/audio/processed/sfx/sfx_weapon_pistol_shot_01.ogg",
]);

this.load.audio("sfx_boss_charge_warning_01", [
  "assets/audio/processed/sfx/sfx_boss_charge_warning_01.ogg",
]);
```

### 16.2 播放示例

```ts
audioManager.play("weapon.pistolShot");
audioManager.play("boss.chargeWarning");
audioManager.play("ui.error");
```

### 16.3 BGM 切换

推荐逻辑：

| Match State | Music |
|---|---|
| LOBBY | 无或轻量菜单 loop |
| WAVE_PREP | battle loop 低音量 |
| WAVE_ACTIVE | battle loop |
| BOSS_PREP | battle loop 或渐弱 |
| BOSS_ACTIVE | boss loop |
| VICTORY | victory stinger，停止 loop |
| DEFEAT | defeat stinger，停止 loop |

### 16.4 浏览器自动播放限制

Web 游戏中，浏览器可能阻止自动播放音频。

规则：

- 首次用户点击 Start/Ready 后初始化 AudioContext；
- 菜单中显示 “Click to enable audio” 或自动在第一次交互后解锁；
- AudioManager 必须处理 audio locked 状态。

---

## 17. 网络事件到音频事件映射

音频播放应主要由服务器 feedback event 或本地 UI 操作触发。

### 17.1 服务器 FeedbackEvent 映射

| FeedbackEvent | AudioEvent |
|---|---|
| `hero.shoot` | `weapon.pistolShot` |
| `hero.dryFire` | `weapon.dryFire` |
| `hero.reloadStart` or `hero.reloadComplete` | `weapon.reload` |
| `plant.placed` | `plant.place` |
| `sun.gained` | `sun.gain` |
| `enemy.hit` | `enemy.hit` |
| `enemy.killed` | `enemy.death` |
| `base.damaged` | `base.damaged` |
| `wave.started` | `wave.start` |
| `boss.spawned` | `boss.spawn` |
| `boss.weakPointExposed` | `boss.weakPointExpose` |
| `boss.chargeStarted` | `boss.chargeWarning` |
| `boss.interrupted` | `boss.interrupted` |
| `match.victory` | `match.victory` |
| `match.defeat` | `match.defeat` |

### 17.2 本地 UI 映射

| UI 操作 | AudioEvent |
|---|---|
| 按钮点击 | `ui.click` |
| 操作被拒绝 | `ui.error` |
| hover | 可选 `ui.hover` |
| 打开进化面板 | 可选 `ui.click` 或 `ui.open` |

### 17.3 本地预测音频

允许本地预测播放：

- UI click；
- 枪口点击时的轻量本地反馈；
- 按键无效提示。

但关键战斗音效建议以服务器 feedback 为准，避免误播放过多。

---

## 18. 音频优先级与并发控制

### 18.1 音频优先级

| 优先级 | 事件 |
|---|---|
| Critical | Boss charge warning, base damaged, victory, defeat |
| High | shoot, reload, dry fire, plant place, boss interrupted |
| Medium | enemy hit, enemy death, sun gain, plant shoot |
| Low | UI hover, ambient details |

### 18.2 并发限制

推荐限制：

| 类型 | 最大同时播放 |
|---|---:|
| pistol shot | 4 |
| plant shoot | 6 |
| enemy hit | 8 |
| enemy death | 4 |
| sun gain | 3 |
| boss warning | 1 |
| UI error | 1 |

### 18.3 同类音效随机音高

为降低重复感，可以轻微随机 pitch：

| 类型 | pitch 范围 |
|---|---:|
| enemy hit | 0.95–1.05 |
| plant shoot | 0.97–1.03 |
| sun gain | 0.98–1.06 |
| pistol shot | 0.98–1.02 |

Boss 警告不建议随机太多，以保持识别度。

---

## 19. V0.1 音频获取批次计划

### 19.1 Batch A：P0 SFX 占位和接入

目标：先让所有关键事件有声音反馈。

包含：

- pistol shot；
- dry fire；
- reload；
- plant place；
- UI error；
- sun gain；
- enemy hit；
- enemy death；
- base damaged；
- wave start；
- boss spawn；
- boss charge warning；
- boss interrupted；
- victory；
- defeat。

验收：所有 P0 AudioEvent 都能触发，不崩溃。

### 19.2 Batch B：免费资源替换 P0

目标：用 verified free resources 替换占位。

任务：

- 搜索候选资源；
- 核验 license；
- 下载 raw；
- 处理并转 ogg；
- 接入；
- 更新 license 文档。

验收：P0 资源全部 `integrated` 或 `approved`。

### 19.3 Batch C：P1 Boss 与进化音频

包含：

- boss weakpoint expose；
- hammer slam；
- boss phase2；
- hero hit/death/respawn；
- evolution firepower/control/support；
- ammo purchase。

验收：Boss 战机制音频表达清楚。

### 19.4 Batch D：BGM 与氛围

包含：

- battle loop；
- boss loop；
- victory/defeat 更好版本；
- ambient greenhouse loop。

验收：BGM 不盖过关键 SFX。

---

## 20. Codex 音频执行 Prompt 模板

### 20.1 建立音频管线 Prompt

```md
Task: Establish the V0.1 audio pipeline.

Read:
- docs/AUDIO_PIPELINE_V0_1.md
- docs/NETWORK_SYNC_SPEC.md
- docs/RULES_CORE_LOOP.md

Goal:
Create the audio folder structure, audio asset status table, license tracking docs, AudioManager skeleton, audio event registry, and placeholder fallback so gameplay development is not blocked by missing audio.

Requirements:
1. Create assets/audio directory structure.
2. Create audio_asset_status_v0_1.md.
3. Create audio_licenses_v0_1.md.
4. Create attribution_v0_1.md.
5. Implement AudioManager with buses: master, sfx, music, ui.
6. Implement audioRegistry.ts with all P0 AudioEvent IDs.
7. Add missing-resource safe fallback.
8. Wire at least UI error and one test sound or placeholder.
9. Do not download unclear-license audio.

Deliverables:
- Folder structure
- Docs
- AudioManager skeleton
- Registry
- Completion report
```

### 20.2 免费音频搜索 Prompt

```md
Task: Source free/permissive audio assets for V0.1 Batch [A/B/C/D].

Read:
- docs/AUDIO_PIPELINE_V0_1.md
- assets/audio/docs/audio_asset_status_v0_1.md

Goal:
Find candidate audio resources for the requested batch, verify licenses, download only allowed files, process them into game-ready format, and document everything.

Hard rules:
1. Do not use any asset without explicit license information.
2. Prefer CC0 or clearly commercial-use-allowed resources.
3. If attribution is required, update attribution_v0_1.md.
4. Save raw files separately from processed files.
5. Convert processed files to .ogg.
6. Update audio_asset_status_v0_1.md and audio_licenses_v0_1.md.
7. If no safe resource is found, keep placeholder and mark needs_replacement.

Deliverables:
- Candidate list
- License verification notes
- Raw files
- Processed .ogg files
- Updated status docs
- Integration notes
```

### 20.3 音频接入 Prompt

```md
Task: Integrate processed audio assets into the V0.1 client.

Read:
- docs/AUDIO_PIPELINE_V0_1.md
- docs/NETWORK_SYNC_SPEC.md
- assets/audio/docs/audio_asset_status_v0_1.md

Goal:
Wire processed audio files into Phaser through AudioManager and map gameplay/network feedback events to AudioEvent IDs.

Requirements:
1. Preload all integrated processed audio files.
2. Register them in audioRegistry.ts.
3. Map server FeedbackEvent to AudioEvent.
4. Add volume bus control.
5. Add minInterval throttling.
6. Add missing asset warnings in dev mode.
7. Ensure browser audio unlock happens after user interaction.
8. Add a simple audio debug panel or console command if useful.

Validation:
- Trigger shoot/reload/plant/sun/enemy/boss/victory/defeat events.
- Confirm no crash when a file is missing.
- Confirm volume is not excessive.
- Confirm repeated enemy hit sounds do not spam uncontrollably.
```

---

## 21. 音频验收标准

### 21.1 单资源验收

每个进入 `integrated` 的音频资源必须满足：

- license 已记录；
- raw 文件已保存；
- processed 文件存在；
- 文件命名符合规范；
- 音量不爆；
- 无明显长静音；
- 无明显水印、语音标识、品牌声；
- 可在 Phaser 中播放；
- 状态表已更新。

### 21.2 P0 音频验收

P0 完成标准：

1. 开枪有声音；
2. 空枪有声音；
3. 换弹有声音；
4. 种植成功有声音；
5. 操作失败有声音；
6. 阳光获得有声音；
7. 敌人受击和死亡有声音；
8. 基地受损有声音；
9. 波次开始有声音；
10. Boss 登场有声音；
11. Boss 冲锋有明显警告音；
12. Boss 打断成功有明显反馈；
13. 胜利和失败有结算音。

### 21.3 整体混音验收

游戏内试听时必须检查：

- 枪声不刺耳；
- Boss 警告不会被音乐盖住；
- 阳光音效不会频繁烦人；
- 敌人 hit 音效不会大量叠加爆音；
- BGM 音量低于关键 SFX；
- UI 错误提示清楚但不烦；
- 胜利/失败音效不会过长阻塞结算。

---

## 22. 常见问题与修正方向

### 22.1 枪声太写实或太吵

修正：

- 降低音量；
- 剪短尾音；
- 加轻微卡通化处理；
- 换成更 arcade 的短枪声；
- 避免强低频和尖锐高频。

### 22.2 敌人受击音太重复

修正：

- 增加 2–3 个变体；
- 随机 pitch；
- 设置 minInterval；
- 降低音量。

### 22.3 阳光音太烦

修正：

- 降低音量；
- 合并短时间内多次播放；
- 改成更柔和的 sparkle；
- 设置 80–150 ms 最小间隔。

### 22.4 Boss 警告不明显

修正：

- 提高音量；
- 使用更明显的 rising warning tone；
- 降低 BGM ducking；
- 在 Boss 技能期间短暂压低音乐。

### 22.5 BGM 盖过玩法反馈

修正：

- 降低 music bus；
- Boss warning 播放时 duck music；
- 选择更少高频和鼓点的 loop；
- 不在 V0.1 强行加入复杂 BGM。

---

## 23. BGM 与音乐策略

### 23.1 V0.1 是否必须有 BGM

BGM 不是 V0.1 必须项。

如果找不到安全、合适、低干扰的音乐，可以先不接 BGM，只做 SFX。

### 23.2 BGM 要求

如果加入：

- 必须 loop 平滑；
- 不盖住 Boss 警告；
- 不含人声歌词；
- 不使用版权音乐；
- license 记录完整；
- 普通战斗和 Boss 战最好分开。

### 23.3 音乐切换

推荐简单切换：

```text
普通波次：music_battle_loop_01
Boss 战：music_boss_loop_01
胜利/失败：停止 loop，播放 stinger
```

V0.1 不要求复杂动态音乐系统。

---

## 24. 版本边界

### 24.1 V0.1 必须完成

- P0 音频事件全部有 placeholder 或真实资源；
- AudioManager 可用；
- 音频状态表存在；
- license 文档存在；
- 关键事件已经映射；
- 缺失音频不会导致游戏崩溃。

### 24.2 V0.1 不强求

- 所有音效都是最终品质；
- 完整动态音乐；
- 复杂 3D spatial audio；
- 角色语音；
- 多语言语音；
- 专业混音母带；
- 每个敌人都有独立叫声；
- 大量音效变体。

---

## 25. 给 Codex 的硬性规则

Codex 执行音频任务时必须遵守：

1. 不使用无 license 资源；
2. 不使用从其他游戏提取的音频；
3. 不使用影视、动漫、短视频截取音频；
4. 每个下载资源必须保存 source 和 license；
5. raw 与 processed 分开保存；
6. 每个音频必须更新状态表；
7. attribution-required 资源必须更新署名文档；
8. 音频缺失时用 placeholder，不阻塞玩法；
9. 音频文件命名必须统一；
10. 接入后必须在游戏内测试触发。

---

## 26. 最小 Definition of Done

`AUDIO_PIPELINE_V0_1.md` 对应最小完成标准：

1. `assets/audio/` 目录结构存在；
2. `audio_asset_status_v0_1.md` 存在；
3. `audio_licenses_v0_1.md` 存在；
4. `attribution_v0_1.md` 存在；
5. `AudioManager` 存在；
6. `AudioRegistryV01` 存在；
7. P0 AudioEvent 全部注册；
8. 缺失音频不会崩溃；
9. 至少 shoot、plant、sun、boss charge、victory/defeat 可以触发；
10. 所有真实音频都有 license 记录。

---

## 27. 当前版本最终判断

V0.1 的音频目标不是一次性做出完整声音设计，而是建立一条安全、可维护的音频生产线：

> 先用 placeholder 保证关键玩法反馈存在，再逐步用经过 license 核验的免费音频替换，最后通过 AudioManager 统一控制音量、事件映射、节流和缺失资源 fallback。

这条管线能让 Codex 在不冒版权风险的情况下，把游戏从“能玩”推进到“有反馈、有节奏、有 Boss 压迫感”的可演示状态。

