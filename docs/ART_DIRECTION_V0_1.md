# ART_DIRECTION_V0_1.md

# 双人合作枪械英雄塔防 V0.1 美术方向与资源生成规范

## 0. 文档目的

本文档定义 V0.1 的美术方向、原创视觉规范、资源清单、image-gen 生成流程、game-studio 类插件协作流程、占位资源策略、导入规范和验收标准。

本文档的目标不是追求最终商业美术品质，而是确保 V0.1 具备：

- 清晰可读的 2.5D 俯视角视觉；
- 原创化角色、植物、敌人与 Boss；
- 能服务玩法判断的美术资源；
- 可被 Codex 按阶段生成、整理、导入、替换；
- 不侵犯已有游戏 IP；
- 后续可扩展到更完整美术管线。

---

## 1. 美术总方向一句话

**明亮但带轻微末日污染感的 2.5D 卡通战术花园防守风格：植物像可部署的生态防御装置，英雄像废土温室守卫，敌人是污染变异体，Boss 是攻城型生态怪物。**

---

## 2. 核心视觉关键词

### 2.1 正向关键词

```text
stylized 2.5D
readable top-down sprites
co-op tactical garden defense
mutated greenhouse battlefield
playful apocalypse
clean silhouette
chunky readable shapes
bright toxic overgrowth
scrap-tech gardeners
cartoon tactical shooter
clear lane-based defense layout
```

### 2.2 中文理解

| 关键词 | 含义 |
|---|---|
| 2.5D 俯视角 | 不是纯平面图标，要有体积感和斜上视角 |
| 卡通化 | 不追求写实恐怖，适合 Web 游戏 |
| 轻末日 | 有污染、变异、危机感，但不血腥 |
| 轮廓清晰 | 小尺寸下也能分辨角色职责 |
| 战术花园 | 植物不是普通花草，而是防御装置 |
| 双人合作 | 两个英雄颜色、轮廓应能区分 |
| 高可读性 | 玩法清楚优先于复杂细节 |

### 2.3 禁止关键词

禁止在 image-gen prompt 中使用或暗示：

```text
Plants vs. Zombies
PVZ
Peashooter from Plants vs Zombies
Sunflower from Plants vs Zombies
Wall-nut from Plants vs Zombies
zombie from Plants vs Zombies
exact style of PopCap
copying existing game character
```

所有资源必须原创命名、原创形象、原创轮廓。

---

## 3. 视觉支柱

### 3.1 玩法可读性第一

V0.1 是玩法验证版本，美术必须服务于可读性。

玩家必须一眼看懂：

- 哪个是自己；
- 哪个是队友；
- 哪些格子能种植物；
- 哪些植物负责经济、输出、防御；
- 哪些敌人是普通、快速、装甲；
- Boss 什么时候露出弱点；
- 哪一路快被突破；
- 子弹和攻击方向。

### 3.2 原创 IP 第二

灵感可以来自经典塔防结构，但视觉不能像已有知名角色。

必须做到：

- 植物轮廓原创；
- 敌人不是经典僵尸脸谱；
- Boss 不是已有游戏怪物；
- 英雄不是现成影视/游戏角色；
- UI 图标不照搬任何已有游戏。

### 3.3 轻量生产第三

V0.1 不做昂贵动画系统。

优先使用：

- 静态 sprite；
- 少量 2–4 帧动画；
- Phaser 中的缩放、闪烁、粒子、tween；
- 简单方向翻转；
- 命中特效和 UI 反馈增强打击感。

---

## 4. 视角与渲染规范

### 4.1 推荐视角

V0.1 使用：

> **top-down 2.5D / slight isometric tilt**

解释：

- 地图是俯视战场；
- 角色和植物有轻微斜上方体积感；
- 不做严格等距网格；
- 种植格仍然按 2D 横向路线排列；
- 视觉上接近“俯视动作塔防”。

### 4.2 摄像机方向

推荐画面方向：

```text
敌人从右侧进入
基地在左侧
玩家在中左区域活动
植物种在 5 路 × 7 列格子上
```

### 4.3 角色朝向

V0.1 可先简化为：

- 英雄根据鼠标方向旋转枪口或翻转 sprite；
- 敌人默认朝左移动；
- 植物默认朝右攻击；
- Boss 默认朝左推进。

不强制做 8 方向动画。

---

## 5. 色彩规范

### 5.1 整体色彩氛围

整体应是：

- 明亮；
- 清爽；
- 有毒性污染色点缀；
- 不压抑；
- 不写实血腥；
- 背景低对比，角色高对比。

### 5.2 推荐色彩分层

| 类别 | 推荐色彩方向 | 目的 |
|---|---|---|
| 地面 | 暖灰绿、泥土色、低饱和草地 | 不抢主体 |
| 植物 | 鲜绿、黄绿、橙黄、木色 | 友方、生命感 |
| 英雄 A | 蓝绿 / 青色点缀 | 与队友区分 |
| 英雄 B | 橙黄 / 红橙点缀 | 与英雄 A 区分 |
| 普通敌人 | 暗紫、病态灰绿 | 敌方识别 |
| 快速敌人 | 紫红、亮粉污染纹 | 速度威胁 |
| 装甲敌人 | 深灰、铁锈橙、金属壳 | 高血量识别 |
| Boss | 深紫、锈铁、毒绿核心 | 高威胁 |
| 阳光 | 金黄、暖黄色 | 资源识别 |
| 弱点 | 高亮红橙或荧光青 | 必须醒目 |

### 5.3 可读性约束

- 背景饱和度必须低于角色；
- 敌人不能和地面同色；
- Boss 弱点必须和 Boss 本体明显区分；
- 经济植物、输出植物、防御植物必须轮廓差异明显；
- 两名英雄必须通过颜色或背包/头盔区分。

---

## 6. V0.1 资源总清单

### 6.1 资源优先级说明

| 优先级 | 含义 |
|---|---|
| P0 | 没有就无法玩或严重影响判断 |
| P1 | 强烈建议第一版有 |
| P2 | 打磨资源，可后续替换 |

### 6.2 P0 必须资源

| 资源 ID | 类型 | 用途 |
|---|---|---|
| `hero_ranger_a` | 英雄 | 玩家 A |
| `hero_ranger_b` | 英雄 | 玩家 B |
| `plant_sunbloom` | 植物 | 经济植物 |
| `plant_peashotter` | 植物 | 输出植物 |
| `plant_barkwall` | 植物 | 防御植物 |
| `enemy_shambler` | 敌人 | 普通敌人 |
| `enemy_runner` | 敌人 | 快速敌人 |
| `enemy_brute` | 敌人 | 装甲敌人 |
| `boss_ironmaw` | Boss | V0.1 Boss |
| `projectile_hero_bullet` | 投射物 | 英雄子弹 |
| `projectile_pea` | 投射物 | 植物子弹 |
| `tile_ground_lane` | 地图 | 路线地面 |
| `tile_plant_cell` | 地图 | 可种植格 |
| `base_greenhouse_core` | 基地 | 防守目标 |
| `ui_icon_sun` | UI | 阳光资源 |
| `ui_icon_ammo` | UI | 弹药 |
| `ui_icon_hp` | UI | 生命 |
| `fx_hit_spark` | 特效 | 命中反馈 |
| `fx_muzzle_flash` | 特效 | 枪口火光 |
| `fx_boss_weakpoint` | 特效 | Boss 弱点提示 |

### 6.3 P1 建议资源

| 资源 ID | 类型 | 用途 |
|---|---|---|
| `fx_sun_gain` | 特效 | 阳光获得 |
| `fx_plant_place` | 特效 | 种植成功 |
| `fx_invalid_action` | 特效 | 操作失败 |
| `fx_enemy_death` | 特效 | 敌人死亡 |
| `fx_boss_charge_warning` | 特效 | Boss 冲锋提示 |
| `ui_wave_banner` | UI | 波次提示 |
| `ui_boss_hp_frame` | UI | Boss 血条框 |
| `ui_evolution_firepower` | UI | 火力进化图标 |
| `ui_evolution_control` | UI | 控制进化图标 |
| `ui_evolution_support` | UI | 支援进化图标 |

### 6.4 P2 打磨资源

| 资源 ID | 类型 | 用途 |
|---|---|---|
| `hero_run_frames_a` | 动画 | 英雄 A 跑步 |
| `hero_run_frames_b` | 动画 | 英雄 B 跑步 |
| `plant_sunbloom_anim` | 动画 | 产阳光动画 |
| `plant_peashotter_attack_anim` | 动画 | 攻击动画 |
| `enemy_walk_frames` | 动画 | 敌人移动 |
| `boss_phase2_variant` | Boss | Boss 二阶段视觉变化 |
| `environment_props` | 环境 | 路边装饰 |

---

## 7. 资源尺寸规范

### 7.1 基础尺寸

| 类型 | 推荐画布尺寸 | 游戏内显示尺寸 | 说明 |
|---|---:|---:|---|
| 英雄 sprite | 128×128 | 48–64 px 高 | 保留透明边距 |
| 植物 sprite | 128×128 | 56–72 px 高 | 占一个格子 |
| 普通敌人 | 128×128 | 56–72 px 高 | 与植物同级 |
| 快速敌人 | 128×128 | 52–64 px 高 | 更瘦、更尖 |
| 装甲敌人 | 160×160 | 72–88 px 高 | 更大、更重 |
| Boss | 512×512 | 180–260 px 高 | 可跨多格视觉 |
| 子弹 | 32×32 | 8–16 px | 高对比 |
| 特效 | 64×64 或 128×128 | 适配场景 | 可用粒子替代 |
| UI 图标 | 64×64 | 24–48 px | 简洁易读 |
| 地块 tile | 96×72 或 128×96 | 1 格大小 | 对应网格 |

### 7.2 文件格式

| 类型 | 格式 |
|---|---|
| sprite / UI / FX | PNG with transparent background |
| tiles | PNG |
| concept art | PNG 或 JPG |
| spritesheet | PNG + JSON atlas，可后续做 |

V0.1 优先使用单张 PNG，减少复杂度。

---

## 8. 命名规范

### 8.1 文件命名

使用小写 snake_case。

```text
hero_ranger_a_idle.png
hero_ranger_b_idle.png
plant_sunbloom_idle.png
plant_peashotter_idle.png
plant_barkwall_idle.png
enemy_shambler_idle.png
enemy_runner_idle.png
enemy_brute_idle.png
boss_ironmaw_phase1.png
boss_ironmaw_phase2.png
projectile_hero_bullet.png
projectile_pea.png
fx_muzzle_flash.png
fx_hit_spark.png
ui_icon_sun.png
```

### 8.2 资源 ID 命名

代码中资源 ID 与文件名尽量一致，但不带扩展名。

```ts
export const ArtAssetKeys = {
  HERO_RANGER_A: "hero_ranger_a_idle",
  HERO_RANGER_B: "hero_ranger_b_idle",
  PLANT_SUNBLOOM: "plant_sunbloom_idle",
  PLANT_PEASHOTTER: "plant_peashotter_idle",
  PLANT_BARKWALL: "plant_barkwall_idle",
  ENEMY_SHAMBLER: "enemy_shambler_idle",
  ENEMY_RUNNER: "enemy_runner_idle",
  ENEMY_BRUTE: "enemy_brute_idle",
  BOSS_IRONMAW_PHASE1: "boss_ironmaw_phase1",
  BOSS_IRONMAW_PHASE2: "boss_ironmaw_phase2",
} as const;
```

---

## 9. 目录结构规范

推荐目录：

```text
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
  docs/
    asset_status_v0_1.md
```

### 9.1 source_prompts

保存所有 image-gen prompt，便于复现和迭代。

### 9.2 concepts

保存概念图，不一定直接进入游戏。

### 9.3 sprites

保存最终用于游戏的透明背景 sprite。

### 9.4 placeholders

保存占位资源，保证玩法开发不被最终美术阻塞。

---

## 10. image-gen 工作流总原则

### 10.1 基本流程

每个资源生成遵循：

```text
1. 定义资源用途
2. 写清视角、风格、轮廓、颜色、背景要求
3. 先生成 concept 或 sprite candidate
4. 检查可读性与原创性
5. 必要时迭代 prompt
6. 导出透明背景 PNG
7. 重命名并放入 assets/art/sprites
8. 更新 asset_status_v0_1.md
9. 在 Phaser 中接入并检查游戏内尺寸
```

### 10.2 Prompt 必须包含的要素

每个 image-gen prompt 必须包含：

- 资源名；
- 游戏类型；
- 2.5D / top-down 视角；
- 原创 IP；
- 透明背景；
- 轮廓清晰；
- 小尺寸可读；
- 不要文字；
- 不要 UI 背景；
- 不要已有 IP 风格。

### 10.3 通用负向约束

在 prompt 或说明中明确：

```text
Do not copy or imitate any existing copyrighted game character.
Do not use Plants vs. Zombies characters or style.
No text, no watermark, no logo, no background scene.
Transparent background, single centered asset.
Readable silhouette at small size.
```

---

## 11. game-studio 类插件工作流

如果 Codex 环境中可用 game-studio 类插件，应按如下流程：

### 11.1 先生成 Art Brief

Codex 应先生成：

```text
Art Brief:
- Project codename
- Camera angle
- Visual style
- Asset category
- Gameplay purpose
- Size target
- Prompt
- Negative constraints
- Export requirement
```

### 11.2 再生成 Asset Batch

按批次生成，不要一次性生成所有资源。

推荐批次：

| 批次 | 内容 |
|---|---|
| Batch A | 英雄、植物、敌人、Boss 主体 |
| Batch B | 地图、基地、格子、投射物 |
| Batch C | UI 图标、进化图标 |
| Batch D | 特效、二阶段 Boss、动画帧 |

### 11.3 最后做 Integration Pass

每批资源生成后，Codex 必须：

- 放到正确目录；
- 更新资源状态表；
- 在 Phaser preload 中注册；
- 替换 placeholder；
- 运行游戏查看尺寸和可读性；
- 输出集成报告。

---

## 12. 占位资源策略

### 12.1 为什么必须有 placeholder

美术生成可能失败、尺寸不统一或需要人工挑选。

玩法开发不能被资源阻塞。

因此每个 P0 资源都必须有 placeholder。

### 12.2 Placeholder 规则

占位资源可以是：

- 彩色几何图形；
- 简单文字标签；
- 低保真 icon；
- Phaser Graphics 绘制。

但必须满足：

- 类型可区分；
- 颜色可区分；
- 碰撞范围清楚；
- 不影响玩法测试。

### 12.3 Placeholder 颜色建议

| 对象 | 颜色 |
|---|---|
| 玩家 A | 青色 |
| 玩家 B | 橙色 |
| 经济植物 | 黄色/绿色 |
| 输出植物 | 绿色/蓝色 |
| 防御植物 | 棕色 |
| 普通敌人 | 紫灰色 |
| 快速敌人 | 红紫色 |
| 装甲敌人 | 深灰/橙色 |
| Boss | 深紫/红色 |
| 阳光 | 金黄色 |

---

## 13. 英雄美术规范

### 13.1 英雄总体设定

两名英雄是“温室防线守卫”，不是军队士兵，也不是传统超级英雄。

视觉要素：

- 轻型护甲；
- 园艺工具与枪械结合；
- 背包或阳光电池；
- 防毒面罩或护目镜；
- 小型手枪；
- 卡通比例。

### 13.2 英雄 A：`hero_ranger_a`

角色定位：玩家 A，偏冷色。

视觉关键词：

- teal / cyan accent；
- compact tactical gardener；
- small pistol；
- greenhouse defender；
- readable helmet or goggles。

#### image-gen prompt

```text
Original stylized 2.5D top-down game sprite of a compact tactical greenhouse ranger hero, cyan and teal accent colors, wearing light scrap-tech garden armor, small pistol in hand, small solar battery backpack, goggles, heroic but cute proportions, clean readable silhouette, centered single character, transparent background, no text, no logo, no watermark, not based on any existing game character, not Plants vs Zombies style, suitable for a Phaser 2D cooperative tower defense action game, readable at small size.
```

### 13.3 英雄 B：`hero_ranger_b`

角色定位：玩家 B，偏暖色。

视觉关键词：

- orange / yellow accent；
- 同一阵营但轮廓稍不同；
- 更明显的肩甲或围巾；
- 小手枪。

#### image-gen prompt

```text
Original stylized 2.5D top-down game sprite of a cooperative greenhouse ranger hero, orange and warm yellow accent colors, light scrap-tech garden armor, small pistol, compact solar backpack, slightly different silhouette from the cyan hero, goggles or visor, playful apocalypse tone, clean readable silhouette, centered single character, transparent background, no text, no logo, no watermark, not based on any existing game character, not Plants vs Zombies style, suitable for a Phaser 2D co-op tower defense shooter, readable at small size.
```

### 13.4 英雄验收标准

英雄 sprite 必须：

- 小尺寸下能看出朝向或枪的位置；
- A/B 颜色明显不同；
- 不能看起来像真实军事游戏角色；
- 不能与敌人颜色混淆；
- 透明背景干净；
- 无文字、无水印。

---

## 14. 植物美术规范

### 14.1 植物总体设定

植物不是普通自然植物，而是“培育出来的生态防御装置”。

三种植物必须通过轮廓区分职责：

| 植物 | 轮廓核心 |
|---|---|
| 日光芽 | 圆形花盘 / 发光核心 |
| 豆荚炮 | 炮口 / 豆荚发射器 |
| 木壳墙 | 宽厚盾墙 / 树皮堡垒 |

---

### 14.2 日光芽：`plant_sunbloom`

定位：经济植物，生产阳光。

视觉要素：

- 发光花盘；
- 小型太阳核心；
- 绿色叶片底座；
- 温暖黄色光；
- 不能像经典向日葵。

#### image-gen prompt

```text
Original stylized 2.5D top-down game sprite of a small solar-producing defensive plant called Sunbloom, glowing round golden energy core surrounded by short green leaves, greenhouse-grown bio-tech flower, cute but not childish, clear circular silhouette, warm yellow light, centered single plant, transparent background, no text, no logo, no watermark, not a sunflower from any existing game, not Plants vs Zombies style, readable at small size, suitable for a cooperative tower defense game.
```

---

### 14.3 豆荚炮：`plant_peashotter`

定位：输出植物，本路持续攻击。

视觉要素：

- 豆荚形炮口；
- 稳定根部支架；
- 朝右的攻击方向；
- 绿色主体，蓝绿能量点缀；
- 不像经典豌豆射手。

#### image-gen prompt

```text
Original stylized 2.5D top-down game sprite of a bio-mechanical pod cannon plant called Peashotter, chunky green seed-pod barrel pointing to the right, leafy tripod roots, small glowing pressure sacs, friendly defensive plant weapon, clear cannon-like silhouette, centered single plant, transparent background, no text, no logo, no watermark, not based on any existing game plant, not Plants vs Zombies style, readable at small size, suitable for lane-based cooperative tower defense.
```

---

### 14.4 木壳墙：`plant_barkwall`

定位：防御植物，阻挡敌人。

视觉要素：

- 宽厚木壳；
- 树皮盾牌；
- 低矮但很宽；
- 棕色、绿色苔藓；
- 表情不是重点，重点是“挡路”。

#### image-gen prompt

```text
Original stylized 2.5D top-down game sprite of a defensive bark wall plant called Barkwall, thick wooden shell shield with mossy green roots, squat and wide silhouette, sturdy living barrier grown from a greenhouse defense system, chunky bark plates, clear blocking role, centered single plant, transparent background, no text, no logo, no watermark, not based on any existing game character, not Plants vs Zombies style, readable at small size, suitable for a lane defense game.
```

### 14.5 植物验收标准

- 三种植物轮廓必须明显不同；
- 经济植物看起来像资源生产；
- 输出植物看起来能发射；
- 防御植物看起来能阻挡；
- 不直接使用太阳花、豌豆头、坚果墙经典视觉结构；
- 小尺寸下仍能区分。

---

## 15. 敌人美术规范

### 15.1 敌人总体设定

敌人不是传统僵尸，而是“污染变异生物”。

共同特征：

- 暗紫 / 灰绿污染色；
- 变异植物、真菌、泥土、废料混合；
- 没有血腥肢解；
- 卡通化威胁；
- 轮廓区分普通、快速、装甲。

---

### 15.2 普通敌人：`enemy_shambler`

定位：基础压力单位。

视觉要素：

- 缓慢游荡；
- 软泥 / 真菌污染体；
- 中等体型；
- 朝左移动。

#### image-gen prompt

```text
Original stylized 2.5D top-down game sprite of a shambling polluted creature for a garden defense game, gray-purple fungal body with small toxic green growths, slow walking silhouette, cartoon menace but not horror, facing left, clean readable shape, centered single enemy, transparent background, no text, no logo, no watermark, not a zombie from any existing game, not Plants vs Zombies style, readable at small size.
```

---

### 15.3 快速敌人：`enemy_runner`

定位：快速突破单位。

视觉要素：

- 更瘦；
- 前倾奔跑；
- 紫红污染纹；
- 尖锐腿部或藤蔓腿；
- 一眼比普通敌人更快。

#### image-gen prompt

```text
Original stylized 2.5D top-down game sprite of a fast polluted runner creature, lean forward-tilted silhouette, purple and magenta toxic streaks, long vine-like legs, agile mutated garden pest, facing left, clear fast-unit shape, centered single enemy, transparent background, no text, no logo, no watermark, not based on any existing game zombie, not Plants vs Zombies style, readable at small size for a cooperative tower defense shooter.
```

---

### 15.4 装甲敌人：`enemy_brute`

定位：高血量压力单位。

视觉要素：

- 大体型；
- 铁锈壳 / 废料壳；
- 慢但重；
- 头顶或背部有铁壳，不使用“铁桶僵尸”经典造型；
- 明显比普通敌人更肉。

#### image-gen prompt

```text
Original stylized 2.5D top-down game sprite of a bulky armored polluted brute creature, heavy rusted scrap shell grown into its back, gray-green fungal body, slow powerful silhouette, large shoulders, facing left, clear tank enemy role, centered single enemy, transparent background, no text, no logo, no watermark, not a bucket zombie, not based on any existing game character, not Plants vs Zombies style, readable at small size.
```

### 15.5 敌人验收标准

- 普通、快速、装甲三者轮廓必须不同；
- 快速敌人必须视觉上更细、更前倾；
- 装甲敌人必须视觉上更宽、更重；
- 敌人与友方植物颜色必须明显不同；
- 不使用经典僵尸脸、路障、铁桶等直接联想元素。

---

## 16. Boss 美术规范

### 16.1 Boss 总体设定

Boss 是“铁颚攻城兽”，污染生态与废金属融合的攻城型怪物。

定位：

- 大型；
- 压迫感；
- 可被植物持续攻击；
- 有明显弱点；
- 二阶段有视觉变化。

### 16.2 Boss 设计要素

| 要素 | 说明 |
|---|---|
| 巨大下颚 | 表现“铁颚” |
| 废铁护甲 | 表现攻城属性 |
| 毒绿核心 | 作为弱点来源 |
| 前倾身体 | 表现向基地推进 |
| 多根污染藤蔓 | 表现变异生态 |
| 红橙/毒绿弱点 | Boss 机制提示 |

### 16.3 Boss Phase 1 Prompt

```text
Original stylized 2.5D top-down boss sprite for a cooperative garden defense game, massive polluted siege beast called Ironmaw, bulky fungal body fused with rusted scrap armor, huge metal jaw, toxic green core partially hidden in its chest, heavy forward-moving silhouette facing left, playful apocalypse style, readable boss shape, centered single boss, transparent background, no text, no logo, no watermark, not based on any existing game monster, not Plants vs Zombies style, suitable for Phaser 2D boss fight.
```

### 16.4 Boss Phase 2 Prompt

```text
Original stylized 2.5D top-down phase two boss sprite of Ironmaw siege beast, enraged polluted garden monster with cracked rusted armor, toxic green core exposed and glowing, sharper silhouette, charging posture facing left, more intense purple and green energy, clear weak point area, centered single boss, transparent background, no text, no logo, no watermark, not based on any existing game monster, not Plants vs Zombies style, readable at game scale.
```

### 16.5 Boss 弱点资源 Prompt

```text
Stylized 2D glowing boss weak point marker for a top-down cooperative tower defense game, toxic green and orange circular crack energy, readable target indicator, transparent background, no text, no logo, no watermark, designed to overlay on a large boss sprite, clear at small size.
```

### 16.6 Boss 验收标准

- Boss 必须比普通敌人大很多；
- 弱点区域必须能明显显示；
- Phase 2 必须比 Phase 1 更危险；
- Boss 不能像普通僵尸放大版；
- Boss 不能遮挡太多路线 UI；
- Boss 在游戏内缩放后仍然清楚。

---

## 17. 地图与环境美术规范

### 17.1 地图总体方向

地图是污染后的温室防线。

元素：

- 横向 5 条路线；
- 植物种植格；
- 左侧基地温室核心；
- 右侧污染入口；
- 地面有泥土、草、金属管线；
- 背景不能太花。

### 17.2 地面 tile Prompt

```text
Stylized 2.5D top-down ground tile for a cooperative garden defense game, muted green-brown greenhouse soil with subtle lane markings, low contrast, slightly polluted but readable, no characters, seamless-ish tile, no text, no logo, no watermark, suitable as background for bright sprites.
```

### 17.3 可种植格 Prompt

```text
Stylized top-down plantable cell overlay for a lane-based garden defense game, subtle square garden plot marker with soft green border and faint soil center, readable but not distracting, transparent background, no text, no logo, no watermark, designed for 96 by 72 pixel grid cell.
```

### 17.4 基地 Prompt

```text
Original stylized 2.5D top-down sprite of a small greenhouse core base for a cooperative tower defense game, glass dome with warm light inside, scrap-tech solar panels, protected garden machinery, friendly defensive target, facing the battlefield, centered single structure, transparent background, no text, no logo, no watermark, readable at medium size.
```

### 17.5 地图验收标准

- 五条路线必须一眼能看懂；
- 可种植格不能遮挡植物；
- 背景不能和敌人/植物混在一起；
- 基地必须明显是防守目标；
- 敌人出生方向要清楚。

---

## 18. 投射物与特效规范

### 18.1 英雄子弹

视觉：小而亮，速度感强。

Prompt:

```text
Small stylized 2D projectile sprite for a top-down game, bright yellow-orange bullet streak with tiny glow, transparent background, no text, no logo, no watermark, readable at 8 to 16 pixels.
```

### 18.2 豌豆弹

视觉：绿色生态弹丸，不像经典豌豆。

Prompt:

```text
Small stylized 2D bio-energy seed projectile, bright green glowing seed pellet with soft trail, transparent background, no text, no logo, no watermark, readable at small size, original design not based on any existing game.
```

### 18.3 枪口火光

Prompt:

```text
Stylized 2D muzzle flash effect sprite, small orange-yellow star burst, transparent background, no text, no logo, no watermark, suitable for top-down cartoon shooter.
```

### 18.4 命中特效

Prompt:

```text
Stylized 2D hit spark effect for a cartoon tower defense shooter, small bright impact burst with yellow and white sparks, transparent background, no text, no logo, no watermark.
```

### 18.5 阳光获得特效

Prompt:

```text
Stylized 2D sunlight gain sparkle effect, warm golden particles and small sun glow, transparent background, no text, no logo, no watermark, suitable for resource pickup feedback.
```

### 18.6 Boss 冲锋警告

Prompt:

```text
Stylized 2D warning marker for a boss charge attack in a top-down tower defense game, red-orange hazard arrow and impact zone glow, transparent background, no text, no logo, no watermark, clear danger indicator.
```

---

## 19. UI 图标规范

### 19.1 UI 总风格

UI 应该：

- 简洁；
- 圆角；
- 半卡通；
- 与游戏世界一致；
- 不做复杂写实 HUD；
- 信息优先。

### 19.2 阳光图标 Prompt

```text
Stylized 2D UI icon of a warm golden sun energy orb for a cooperative garden defense game, simple clean shape, high readability, transparent background, no text, no logo, no watermark, 64x64 icon style.
```

### 19.3 弹药图标 Prompt

```text
Stylized 2D UI icon of a small ammo cartridge with garden-tech design, yellow brass and teal accent, clean readable shape, transparent background, no text, no logo, no watermark, 64x64 icon style.
```

### 19.4 HP 图标 Prompt

```text
Stylized 2D UI icon representing health for a cartoon tactical garden defense game, simple green heart shield shape, clean readable icon, transparent background, no text, no logo, no watermark, 64x64.
```

### 19.5 进化图标 Prompt

#### 火力进化

```text
Stylized 2D UI icon for firepower evolution, small pistol with bright orange burst and leaf motif, clean readable 64x64 game icon, transparent background, no text, no logo, no watermark.
```

#### 控制进化

```text
Stylized 2D UI icon for control evolution, blue-green slowing wave around a bullet and vine motif, clean readable 64x64 game icon, transparent background, no text, no logo, no watermark.
```

#### 支援进化

```text
Stylized 2D UI icon for support evolution, golden sunlight battery and protective leaf shield, clean readable 64x64 game icon, transparent background, no text, no logo, no watermark.
```

---

## 20. 动画策略

### 20.1 V0.1 最小动画要求

V0.1 可以先只做：

| 对象 | 最小表现 |
|---|---|
| 英雄 | 静态 sprite + 轻微 bob + 枪口火光 |
| 植物 | 静态 sprite + 攻击时缩放/tween |
| 敌人 | 静态 sprite + 左右晃动移动 |
| Boss | 静态 sprite + 技能前震动/闪烁 |
| 子弹 | 移动 sprite |
| 命中 | hit spark |

### 20.2 后续动画帧

如果 image-gen / game-studio 支持批量帧，可以再生成：

| 动画 | 帧数 |
|---|---:|
| 英雄跑步 | 4 帧 |
| 输出植物攻击 | 3 帧 |
| 敌人行走 | 4 帧 |
| Boss 冲锋蓄力 | 3 帧 |
| Boss 二阶段怒吼 | 3 帧 |

### 20.3 动画验收

动画必须：

- 不影响碰撞判断；
- 不让单位位置看起来偏移太大；
- 不遮挡弱点；
- 不让玩家误判路线。

---

## 21. Phaser 导入规范

### 21.1 Preload 建议

资源统一在 `AssetPreloader` 或 Phaser scene preload 中注册。

示例：

```ts
this.load.image("hero_ranger_a_idle", "assets/art/sprites/heroes/hero_ranger_a_idle.png");
this.load.image("plant_sunbloom_idle", "assets/art/sprites/plants/plant_sunbloom_idle.png");
this.load.image("enemy_shambler_idle", "assets/art/sprites/enemies/enemy_shambler_idle.png");
```

### 21.2 缩放配置

不要在代码中随便写 magic scale。

建议建立：

```ts
export const RenderScaleV01 = {
  heroes: 0.5,
  plants: 0.55,
  enemies: {
    shambler: 0.55,
    runner: 0.5,
    brute: 0.6,
  },
  boss: 0.45,
  projectiles: 0.5,
} as const;
```

### 21.3 锚点规范

| 类型 | Origin |
|---|---|
| 英雄 | 0.5, 0.65 |
| 植物 | 0.5, 0.7 |
| 敌人 | 0.5, 0.7 |
| Boss | 0.5, 0.65 |
| 子弹 | 0.5, 0.5 |
| UI | 0.5, 0.5 |

目的：让角色底部更贴近地面。

---

## 22. 资源状态表

Codex 必须维护：

```text
assets/docs/asset_status_v0_1.md
```

### 22.1 表格模板

| Asset ID | Category | Priority | Status | Source | Path | Notes |
|---|---|---|---|---|---|---|
| hero_ranger_a | Hero | P0 | placeholder / generated / integrated | image-gen | assets/... | - |

### 22.2 Status 枚举

```text
missing
placeholder
prompt_ready
generated
needs_cleanup
integrated
approved
rejected
```

### 22.3 Source 枚举

```text
placeholder
image-gen
game-studio
manual
free-asset
```

注意：美术资源尽量使用原创生成，不使用外部游戏素材。

---

## 23. 美术生成批次计划

### 23.1 Batch A：核心角色

目标：生成 P0 玩法单位。

包含：

- `hero_ranger_a`
- `hero_ranger_b`
- `plant_sunbloom`
- `plant_peashotter`
- `plant_barkwall`
- `enemy_shambler`
- `enemy_runner`
- `enemy_brute`
- `boss_ironmaw_phase1`

验收：游戏内能替换所有主要 placeholder。

### 23.2 Batch B：地图与投射物

包含：

- `tile_ground_lane`
- `tile_plant_cell`
- `base_greenhouse_core`
- `projectile_hero_bullet`
- `projectile_pea`
- `fx_muzzle_flash`
- `fx_hit_spark`

验收：战斗画面基础完整。

### 23.3 Batch C：UI 与反馈

包含：

- `ui_icon_sun`
- `ui_icon_ammo`
- `ui_icon_hp`
- `ui_wave_banner`
- `ui_boss_hp_frame`
- `ui_evolution_firepower`
- `ui_evolution_control`
- `ui_evolution_support`

验收：UI 不再全靠文字。

### 23.4 Batch D：Boss 与打磨

包含：

- `boss_ironmaw_phase2`
- `fx_boss_weakpoint`
- `fx_boss_charge_warning`
- `fx_enemy_death`
- `fx_sun_gain`
- 简单动画帧。

验收：Boss 战机制表达清楚。

---

## 24. Codex 美术执行 Prompt 模板

### 24.1 美术批次执行 Prompt

```md
Task: Generate and integrate Art Batch [A/B/C/D] for V0.1.

Read:
- docs/ART_DIRECTION_V0_1.md
- assets/docs/asset_status_v0_1.md

Goal:
Generate or prepare the required assets for this batch using the available image-gen or game-studio workflow. If direct generation is unavailable, create prompt-ready entries and placeholder assets.

Requirements:
1. Follow the original IP constraints.
2. Use 2.5D top-down stylized readable sprites.
3. Use transparent background for gameplay sprites.
4. Use correct file names and folders.
5. Update asset_status_v0_1.md.
6. Integrate ready assets into Phaser preload.
7. Do not block gameplay if some assets fail; use placeholders.
8. Provide an integration report.

Deliverables:
- generated or placeholder PNGs,
- updated asset status,
- updated preload asset registry,
- screenshots or notes from in-game verification if possible.
```

### 24.2 单资源迭代 Prompt

```md
Task: Improve asset [asset_id].

Problem:
[Describe issue: low readability / wrong angle / too similar to existing IP / bad transparency / poor silhouette / wrong color]

Requirements:
- Keep original IP.
- Preserve gameplay role.
- Improve small-size readability.
- Maintain 2.5D top-down perspective.
- Export transparent PNG.
- Replace old candidate only after visual check.
- Update asset status and notes.
```

---

## 25. 美术验收总清单

### 25.1 单资源验收

每个资源进入 `integrated` 前必须检查：

- 是否透明背景；
- 是否无文字、水印、logo；
- 是否小尺寸可读；
- 是否符合 2.5D / top-down；
- 是否原创；
- 是否不会误认为已有游戏角色；
- 是否放在正确目录；
- 是否命名正确；
- 是否在 Phaser preload 中注册；
- 是否游戏内尺寸合理。

### 25.2 整体画面验收

V0.1 第一版画面必须满足：

1. 玩家 A/B 能明显区分；
2. 三种植物能明显区分；
3. 三种敌人能明显区分；
4. Boss 明显是 Boss；
5. Boss 弱点明显；
6. 五条路线清楚；
7. 可种植格清楚但不刺眼；
8. 子弹和命中反馈清楚；
9. UI 资源不遮挡战场；
10. 整体不侵犯已有 IP。

---

## 26. 常见问题与修正方向

### 26.1 生成图太写实

修正 prompt：

```text
more stylized, cartoon game sprite, simplified shapes, readable silhouette, not realistic, compact proportions
```

### 26.2 生成图不是俯视角

修正 prompt：

```text
top-down 2.5D game sprite, slight isometric tilt, visible top surfaces, suitable for overhead gameplay
```

### 26.3 背景不透明

修正 prompt：

```text
transparent background, isolated single asset, no scene background
```

如果仍失败，Codex 应使用图像处理工具去背或改用 placeholder。

### 26.4 太像已有 IP

立刻 reject。

修正方式：

- 改轮廓；
- 改颜色；
- 改命名；
- 改生物结构；
- 删除经典元素。

### 26.5 游戏内太小看不清

修正方式：

- 增大 sprite 显示尺寸；
- 简化细节；
- 提高颜色对比；
- 加粗轮廓；
- 加阴影底盘。

---

## 27. 版本边界

### 27.1 V0.1 必须完成

- P0 资源至少 placeholder integrated；
- 核心角色资源尽量 generated integrated；
- asset_status 表存在；
- Phaser preload 使用统一 asset registry；
- 所有玩法单位在画面上可区分。

### 27.2 V0.1 不强求

- 完整逐帧动画；
- 复杂光照；
- 骨骼动画；
- 商业级 UI；
- 多皮肤；
- 多地图环境套装；
- 完整美术统一打磨。

---

## 28. 给 Codex 的硬性规则

Codex 在执行美术任务时必须遵守：

1. 不使用已有游戏 IP 名称作为 prompt 目标；
2. 不下载来源不明的游戏素材；
3. 任何外部素材都必须记录来源和许可；
4. image-gen 生成失败时使用 placeholder，不阻塞代码；
5. 所有资源必须进入 asset_status 表；
6. 所有资源必须按目录和命名规范保存；
7. 集成资源后必须在游戏内检查尺寸；
8. 不让美术任务扩大 V0.1 玩法范围；
9. 任何可疑侵权资源必须 reject；
10. 游戏可读性优先于画面复杂度。

---

## 29. 当前版本最终判断

V0.1 的美术目标不是“立刻做出最终精品”，而是建立一条可靠管线：

> 先用 placeholder 保证玩法开发不断，再用 image-gen / game-studio 按批次生成原创 2.5D 资源，逐步替换并在游戏内验证可读性。

只要这条管线成立，后续增加植物、英雄、Boss 和地图时，Codex 就能持续产出风格一致、可管理、可替换的资源。

