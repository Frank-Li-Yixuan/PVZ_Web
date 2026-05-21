import {
  CombatNumbersV01,
  MapConfigV01,
  createEntityId,
  getLaneCenterY,
  getPlantCellCenter,
  type BaseState,
  type BossSkill,
  type BossState,
  type EnemyType,
  type FeedbackEvent,
  type MatchState,
  type PlayerId,
  type PlayerState,
  type PlantState
} from "@sprout-and-steel/shared";
import type { EconomySystem } from "./EconomySystem";
import { getBossInterruptBonus, getHeroPistolDamage } from "./EvolutionSystem";
import type { EnemySystem } from "./EnemySystem";
import type { PlantSystem } from "./PlantSystem";

const BOSS_WEAK_POINT_RADIUS_PX = 18;
const HERO_CHARGE_HIT_RADIUS_PX = 34;
const HAMMER_HERO_RADIUS_PX = 78;
const BOSS_VISIBLE_SPAWN_INSET_PX = CombatNumbersV01.boss.ironmaw.collisionRadius * 0.55;

type BossRuntimeState = BossState & {
  phaseTransitionRemainingSeconds?: number;
  hammerCooldownSeconds: number;
  summonCooldownSeconds: number;
  weakPointCooldownSeconds: number;
  chargeCooldownSeconds?: number;
  phase2SummonCooldownSeconds?: number;
  sunSuppressionCooldownSeconds?: number;
  controlInterruptBonusByPlayerId: Map<PlayerId, number>;
  hasDamagedBase: boolean;
};

export type BossSpawnResult =
  | {
      ok: true;
      boss: BossState;
      feedback: FeedbackEvent;
    }
  | {
      ok: false;
      reason: string;
    };

export type BossSpawnCommand = {
  enemyType: EnemyType;
  laneIndex: 0 | 1 | 2 | 3 | 4;
};

export type BossUpdateInput = {
  matchState: MatchState;
  deltaSeconds: number;
  plants: PlantSystem;
  enemies: EnemySystem;
  economy: EconomySystem;
  base: BaseState;
  players: Iterable<PlayerState>;
  serverTimeMs: number;
};

export type BossUpdateResult = {
  events: FeedbackEvent[];
  spawns: BossSpawnCommand[];
  defeated: boolean;
  victorious: boolean;
};

export type BossDamageSource = "hero" | "plant";

export type BossDamageInput = {
  amount: number;
  source: BossDamageSource;
  player?: PlayerState;
  economy: EconomySystem;
  serverTimeMs: number;
  hitWeakPoint?: boolean;
};

export type BossDamageResult = {
  hit: boolean;
  events: FeedbackEvent[];
  killed: boolean;
  damageApplied: number;
  interruptPointsAdded: number;
};

export type BossProjectileHitInput = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  radius: number;
  economy: EconomySystem;
  serverTimeMs: number;
};

export type BossHeroProjectileHitInput = BossProjectileHitInput & {
  player?: PlayerState;
};

export class BossSystem {
  private boss: BossRuntimeState | undefined;
  private eventSequence = 0;
  private defeated = false;

  constructor(private readonly random: () => number = Math.random) {}

  spawnBoss(serverTimeMs: number): BossSpawnResult {
    if (this.boss && !this.defeated) {
      return {
        ok: false,
        reason: "BOSS_ALREADY_ACTIVE"
      };
    }

    const config = CombatNumbersV01.boss.ironmaw;
    this.defeated = false;
    this.boss = {
      id: createEntityId("boss", 1),
      bossType: "ironmaw_siege_beast",
      x: roundPosition(MapConfigV01.enemySpawnMarker.centerX - BOSS_VISIBLE_SPAWN_INSET_PX),
      y: getLaneCenterY(config.mainLane),
      laneIndex: config.mainLane,
      hp: config.maxHp,
      maxHp: config.maxHp,
      phase: 1,
      weakPointActive: false,
      charging: false,
      interruptProgress: 0,
      interruptRequired: config.charge.requiredInterruptPoints,
      hammerCooldownSeconds: config.hammerSlam.firstCastSeconds,
      summonCooldownSeconds: config.summonMinions.firstCastSeconds,
      weakPointCooldownSeconds: config.weakPointExpose.firstCastSeconds,
      controlInterruptBonusByPlayerId: new Map(),
      hasDamagedBase: false
    };

    return {
      ok: true,
      boss: toBossSnapshot(this.boss),
      feedback: this.feedback("boss.spawned", serverTimeMs, {
        bossType: "ironmaw_siege_beast"
      })
    };
  }

  update(input: BossUpdateInput): BossUpdateResult {
    const result: BossUpdateResult = {
      events: [],
      spawns: [],
      defeated: false,
      victorious: false
    };

    const boss = this.boss;
    if (!boss || this.defeated || input.matchState !== "BOSS_ACTIVE" || input.deltaSeconds <= 0) {
      return result;
    }

    if (boss.phaseTransitionRemainingSeconds !== undefined) {
      this.updatePhaseTransition(boss, input.deltaSeconds);
      return result;
    }

    this.updateWeakPointTimer(boss, input.deltaSeconds);
    if (boss.currentSkill === "charge_windup") {
      this.updateChargeWindup(boss, input, result);
      return result;
    }
    if (boss.currentSkill === "charge_dash" || boss.currentSkill === "hammer_slam") {
      this.updateCurrentSkillRecovery(boss, input.deltaSeconds);
      return result;
    }

    this.updateMovement(boss, input.deltaSeconds, input.base, input.serverTimeMs, result);
    if (this.defeated || input.base.hp <= 0) {
      result.defeated = input.base.hp <= 0;
      return result;
    }

    if (boss.phase === 1) {
      this.updatePhase1Skills(boss, input, result);
      return result;
    }

    this.updatePhase2Skills(boss, input, result);
    return result;
  }

  damageBoss(input: BossDamageInput): BossDamageResult {
    const boss = this.boss;
    if (!boss || this.defeated || !Number.isFinite(input.amount) || input.amount <= 0) {
      return { hit: false, events: [], killed: false, damageApplied: 0, interruptPointsAdded: 0 };
    }

    const damageApplied = Math.min(boss.hp, input.amount);
    boss.hp = roundValue(Math.max(0, boss.hp - input.amount));
    const events = [
      this.feedback("enemy.hit", input.serverTimeMs, {
        target: "boss",
        bossType: boss.bossType,
        damage: damageApplied,
        hp: boss.hp,
        source: input.source,
        weakPoint: input.hitWeakPoint ?? false
      })
    ];

    if (input.player) {
      input.player.stats.damageDealt = roundValue((input.player.stats.damageDealt ?? 0) + damageApplied);
      if (input.source === "hero") {
        input.player.stats.shotsHit = (input.player.stats.shotsHit ?? 0) + 1;
      }
    }

    let interruptPointsAdded = 0;
    if (input.source === "hero" && input.hitWeakPoint) {
      interruptPointsAdded = this.applyInterruptPoint(boss, input.player, input.serverTimeMs, events);
    }

    if (boss.hp <= 0) {
      this.defeated = true;
      this.boss = undefined;
      events.push(
        this.feedback("match.victory", input.serverTimeMs, {
          reason: "boss_defeated"
        })
      );
      return { hit: true, events, killed: true, damageApplied, interruptPointsAdded };
    }

    if (boss.phase === 1 && boss.hp <= CombatNumbersV01.boss.ironmaw.phase2HpThreshold) {
      events.push(...this.enterPhase2(boss, input.economy, input.serverTimeMs));
    }

    return { hit: true, events, killed: false, damageApplied, interruptPointsAdded };
  }

  tryHitHeroBullet(input: BossHeroProjectileHitInput): BossDamageResult | undefined {
    const boss = this.boss;
    if (!boss || this.defeated) {
      return undefined;
    }

    if (
      boss.weakPointActive &&
      boss.weakPointX !== undefined &&
      boss.weakPointY !== undefined &&
      segmentIntersectsCircle(
        input.startX,
        input.startY,
        input.endX,
        input.endY,
        boss.weakPointX,
        boss.weakPointY,
        BOSS_WEAK_POINT_RADIUS_PX + input.radius
      )
    ) {
      const multiplier =
        input.player?.evolutionPath === "firepower"
          ? CombatNumbersV01.evolution.firepower.weakPointMultiplier
          : CombatNumbersV01.boss.ironmaw.weakPointMultiplier;
      return this.damageBoss({
        amount: getHeroPistolDamage(input.player) * multiplier,
        source: "hero",
        economy: input.economy,
        serverTimeMs: input.serverTimeMs,
        hitWeakPoint: true,
        ...(input.player ? { player: input.player } : {})
      });
    }

    if (
      segmentIntersectsCircle(
        input.startX,
        input.startY,
        input.endX,
        input.endY,
        boss.x,
        boss.y,
        CombatNumbersV01.boss.ironmaw.collisionRadius + input.radius
      )
    ) {
      return this.damageBoss({
        amount: getHeroPistolDamage(input.player),
        source: "hero",
        economy: input.economy,
        serverTimeMs: input.serverTimeMs,
        hitWeakPoint: false,
        ...(input.player ? { player: input.player } : {})
      });
    }

    return undefined;
  }

  tryHitPeaProjectile(input: BossProjectileHitInput & { laneIndex: number }): BossDamageResult | undefined {
    const boss = this.boss;
    if (!boss || this.defeated || !CombatNumbersV01.boss.ironmaw.plantDamageLanes.includes(input.laneIndex as 1 | 2 | 3)) {
      return undefined;
    }

    if (
      !segmentIntersectsCircle(
        input.startX,
        input.startY,
        input.endX,
        input.endY,
        boss.x,
        boss.y,
        CombatNumbersV01.boss.ironmaw.collisionRadius + input.radius
      )
    ) {
      return undefined;
    }

    return this.damageBoss({
      amount: CombatNumbersV01.plants.peashotter.damage,
      source: "plant",
      economy: input.economy,
      serverTimeMs: input.serverTimeMs,
      hitWeakPoint: false
    });
  }

  canPeashotterTarget(plant: PlantState): boolean {
    const boss = this.boss;
    if (!boss || this.defeated || plant.type !== "peashotter") {
      return false;
    }
    if (!CombatNumbersV01.boss.ironmaw.plantDamageLanes.includes(plant.laneIndex as 1 | 2 | 3)) {
      return false;
    }

    const center = getPlantCellCenter({
      laneIndex: plant.laneIndex as 0 | 1 | 2 | 3 | 4,
      columnIndex: plant.columnIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6
    });
    return boss.x > center.x;
  }

  getSnapshot(matchState: MatchState): BossState | undefined {
    if (matchState !== "BOSS_ACTIVE" || !this.boss || this.defeated) {
      return undefined;
    }

    return toBossSnapshot(this.boss);
  }

  isDefeated(): boolean {
    return this.defeated;
  }

  private updatePhaseTransition(boss: BossRuntimeState, deltaSeconds: number): void {
    const remaining = (boss.phaseTransitionRemainingSeconds ?? 0) - deltaSeconds;
    if (remaining > 0) {
      boss.phaseTransitionRemainingSeconds = roundSeconds(remaining);
      boss.skillRemainingSeconds = boss.phaseTransitionRemainingSeconds;
      return;
    }

    delete boss.phaseTransitionRemainingSeconds;
    delete boss.currentSkill;
    delete boss.skillRemainingSeconds;
    boss.weakPointActive = false;
    delete boss.weakPointX;
    delete boss.weakPointY;
    delete boss.weakPointRemainingSeconds;
    boss.chargeCooldownSeconds = CombatNumbersV01.boss.ironmaw.charge.firstCastAfterPhase2Seconds;
    boss.phase2SummonCooldownSeconds = CombatNumbersV01.boss.ironmaw.phase2Summon.firstCastAfterPhase2Seconds;
    boss.sunSuppressionCooldownSeconds = CombatNumbersV01.boss.ironmaw.sunSuppression.firstCastAfterPhase2Seconds;
    boss.weakPointCooldownSeconds = CombatNumbersV01.boss.ironmaw.weakPointExpose.cooldownSeconds / 2;
  }

  private updateWeakPointTimer(boss: BossRuntimeState, deltaSeconds: number): void {
    if (!boss.weakPointActive || boss.currentSkill === "charge_windup") {
      return;
    }

    const remaining = (boss.weakPointRemainingSeconds ?? 0) - deltaSeconds;
    if (remaining > 0) {
      boss.weakPointRemainingSeconds = roundSeconds(remaining);
      if (boss.currentSkill === "weakpoint_expose") {
        boss.skillRemainingSeconds = boss.weakPointRemainingSeconds;
      }
      return;
    }

    boss.weakPointActive = false;
    delete boss.weakPointX;
    delete boss.weakPointY;
    delete boss.weakPointRemainingSeconds;
    if (boss.currentSkill === "weakpoint_expose") {
      delete boss.currentSkill;
      delete boss.skillRemainingSeconds;
    }
  }

  private updateMovement(
    boss: BossRuntimeState,
    deltaSeconds: number,
    base: BaseState,
    serverTimeMs: number,
    result: BossUpdateResult
  ): void {
    const speed = boss.phase === 1 ? CombatNumbersV01.boss.ironmaw.phase1MoveSpeed : CombatNumbersV01.boss.ironmaw.phase2MoveSpeed;
    boss.x = roundPosition(boss.x - speed * deltaSeconds);

    if (boss.hasDamagedBase || boss.x - CombatNumbersV01.boss.ironmaw.collisionRadius > getBaseBreakthroughX()) {
      return;
    }

    boss.hasDamagedBase = true;
    const previousHp = base.hp;
    base.hp = Math.max(0, base.hp - CombatNumbersV01.boss.ironmaw.baseDamage);
    result.defeated = base.hp <= 0;
    result.events.push(
      this.feedback("base.damaged", serverTimeMs, {
        source: "boss",
        previousHp,
        nextHp: base.hp,
        damage: CombatNumbersV01.boss.ironmaw.baseDamage
      })
    );
  }

  private updatePhase1Skills(boss: BossRuntimeState, input: BossUpdateInput, result: BossUpdateResult): void {
    boss.weakPointCooldownSeconds -= input.deltaSeconds;
    if (boss.weakPointCooldownSeconds <= 0 && !boss.weakPointActive) {
      this.activateWeakPoint(boss, input.serverTimeMs, result.events);
      boss.weakPointCooldownSeconds = CombatNumbersV01.boss.ironmaw.weakPointExpose.cooldownSeconds;
    }

    boss.hammerCooldownSeconds -= input.deltaSeconds;
    if (boss.hammerCooldownSeconds <= 0) {
      this.applyHammerSlam(boss, input, result.events);
      boss.hammerCooldownSeconds = CombatNumbersV01.boss.ironmaw.hammerSlam.cooldownSeconds;
    }

    boss.summonCooldownSeconds -= input.deltaSeconds;
    if (boss.summonCooldownSeconds <= 0) {
      result.spawns.push(...this.createSummonSpawns(CombatNumbersV01.boss.ironmaw.summonMinions.count, "shambler"));
      boss.summonCooldownSeconds = CombatNumbersV01.boss.ironmaw.summonMinions.cooldownSeconds;
      result.events.push(this.feedback("boss.phaseChanged", input.serverTimeMs, { skill: "summon_minions" }));
    }
  }

  private updatePhase2Skills(boss: BossRuntimeState, input: BossUpdateInput, result: BossUpdateResult): void {
    boss.weakPointCooldownSeconds -= input.deltaSeconds;
    if (boss.weakPointCooldownSeconds <= 0 && !boss.weakPointActive) {
      this.activateWeakPoint(boss, input.serverTimeMs, result.events);
      boss.weakPointCooldownSeconds = CombatNumbersV01.boss.ironmaw.weakPointExpose.cooldownSeconds;
    }

    if (boss.chargeCooldownSeconds !== undefined) {
      boss.chargeCooldownSeconds -= input.deltaSeconds;
      if (boss.chargeCooldownSeconds <= 0) {
        this.startChargeWindup(boss, input.serverTimeMs, result.events);
        boss.chargeCooldownSeconds = CombatNumbersV01.boss.ironmaw.charge.cooldownSeconds;
      }
    }

    if (boss.phase2SummonCooldownSeconds !== undefined) {
      boss.phase2SummonCooldownSeconds -= input.deltaSeconds;
      if (boss.phase2SummonCooldownSeconds <= 0) {
        result.spawns.push(...this.createSummonSpawns(CombatNumbersV01.boss.ironmaw.phase2Summon.count, "runner"));
        boss.phase2SummonCooldownSeconds = CombatNumbersV01.boss.ironmaw.phase2Summon.cooldownSeconds;
        result.events.push(this.feedback("boss.phaseChanged", input.serverTimeMs, { skill: "summon_minions", phase: 2 }));
      }
    }

    if (boss.sunSuppressionCooldownSeconds !== undefined) {
      boss.sunSuppressionCooldownSeconds -= input.deltaSeconds;
      if (boss.sunSuppressionCooldownSeconds <= 0) {
        input.economy.suppressSun(CombatNumbersV01.boss.ironmaw.sunSuppression.durationSeconds);
        boss.currentSkill = "sun_suppression";
        boss.skillRemainingSeconds = CombatNumbersV01.boss.ironmaw.sunSuppression.durationSeconds;
        boss.sunSuppressionCooldownSeconds = CombatNumbersV01.boss.ironmaw.sunSuppression.cooldownSeconds;
        result.events.push(this.feedback("boss.phaseChanged", input.serverTimeMs, { skill: "sun_suppression", phase: 2 }));
      }
    }
  }

  private updateChargeWindup(boss: BossRuntimeState, input: BossUpdateInput, result: BossUpdateResult): void {
    const remaining = (boss.skillRemainingSeconds ?? CombatNumbersV01.boss.ironmaw.charge.windupSeconds) - input.deltaSeconds;
    if (remaining > 0) {
      boss.skillRemainingSeconds = roundSeconds(remaining);
      boss.weakPointRemainingSeconds = boss.skillRemainingSeconds;
      return;
    }

    this.failCharge(boss, input, result);
  }

  private updateCurrentSkillRecovery(boss: BossRuntimeState, deltaSeconds: number): void {
    const remaining = (boss.skillRemainingSeconds ?? 0) - deltaSeconds;
    if (remaining > 0) {
      boss.skillRemainingSeconds = roundSeconds(remaining);
      return;
    }

    delete boss.currentSkill;
    delete boss.skillRemainingSeconds;
  }

  private activateWeakPoint(boss: BossRuntimeState, serverTimeMs: number, events: FeedbackEvent[]): void {
    boss.weakPointActive = true;
    boss.weakPointX = roundPosition(boss.x - 8);
    boss.weakPointY = roundPosition(boss.y - 18);
    boss.weakPointRemainingSeconds = CombatNumbersV01.boss.ironmaw.weakPointExpose.durationSeconds;
    boss.currentSkill = "weakpoint_expose";
    boss.skillRemainingSeconds = boss.weakPointRemainingSeconds;
    events.push(
      this.feedback("boss.weakPointExposed", serverTimeMs, {
        weakPointX: boss.weakPointX,
        weakPointY: boss.weakPointY,
        durationSeconds: boss.weakPointRemainingSeconds
      })
    );
  }

  private startChargeWindup(boss: BossRuntimeState, serverTimeMs: number, events: FeedbackEvent[]): void {
    boss.currentSkill = "charge_windup";
    boss.skillRemainingSeconds = CombatNumbersV01.boss.ironmaw.charge.windupSeconds;
    boss.charging = true;
    boss.weakPointActive = true;
    boss.weakPointX = roundPosition(boss.x - 8);
    boss.weakPointY = roundPosition(boss.y - 18);
    boss.weakPointRemainingSeconds = boss.skillRemainingSeconds;
    boss.interruptProgress = 0;
    boss.interruptRequired = CombatNumbersV01.boss.ironmaw.charge.requiredInterruptPoints;
    boss.controlInterruptBonusByPlayerId.clear();
    events.push(
      this.feedback("boss.chargeStarted", serverTimeMs, {
        interruptRequired: boss.interruptRequired,
        windupSeconds: boss.skillRemainingSeconds
      })
    );
  }

  private applyHammerSlam(boss: BossRuntimeState, input: BossUpdateInput, events: FeedbackEvent[]): void {
    boss.currentSkill = "hammer_slam";
    boss.skillRemainingSeconds = CombatNumbersV01.boss.ironmaw.hammerSlam.warningSeconds;

    const target = findFrontMostPlant(input.plants.getLivingPlants(), boss.x);
    if (target) {
      const damage =
        target.type === "barkwall"
          ? CombatNumbersV01.boss.ironmaw.hammerSlam.damageToWallPlant
          : CombatNumbersV01.boss.ironmaw.hammerSlam.damageToNonWallPlant;
      const damageResult = input.plants.damagePlant(target.id, damage, input.serverTimeMs);
      if (damageResult.destroyed) {
        events.push(damageResult.destroyed);
      }
    }

    for (const player of input.players) {
      if (!player.alive || Math.hypot(player.x - boss.x, player.y - boss.y) > HAMMER_HERO_RADIUS_PX) {
        continue;
      }
      damagePlayer(player, CombatNumbersV01.boss.ironmaw.hammerSlam.damageToHero);
    }

    events.push(this.feedback("boss.phaseChanged", input.serverTimeMs, { skill: "hammer_slam" }));
  }

  private failCharge(boss: BossRuntimeState, input: BossUpdateInput, result: BossUpdateResult): void {
    const startX = boss.x;
    boss.x = roundPosition(boss.x - CombatNumbersV01.boss.ironmaw.charge.failedChargeDistance);
    boss.currentSkill = "charge_dash";
    boss.skillRemainingSeconds = CombatNumbersV01.boss.ironmaw.charge.recoverySeconds;
    boss.charging = false;
    boss.weakPointActive = false;
    delete boss.weakPointX;
    delete boss.weakPointY;
    delete boss.weakPointRemainingSeconds;

    const damagedPlant = findFirstPlantInChargePath(input.plants.getLivingPlants(), startX, boss.x);
    if (damagedPlant) {
      const plantDamage = input.plants.damagePlant(
        damagedPlant.id,
        CombatNumbersV01.boss.ironmaw.charge.damageToFirstPlant,
        input.serverTimeMs
      );
      if (plantDamage.destroyed) {
        result.events.push(plantDamage.destroyed);
      }
    }

    for (const player of input.players) {
      if (!player.alive || !isPointInChargePath(player.x, player.y, startX, boss.x)) {
        continue;
      }
      damagePlayer(player, CombatNumbersV01.boss.ironmaw.charge.damageToHero);
    }

    this.applyBaseContactAfterCharge(boss, input.base, input.serverTimeMs, result);
    result.events.push(
      this.feedback("boss.chargeFailed", input.serverTimeMs, {
        startX,
        endX: boss.x,
        damagedPlantId: damagedPlant?.id
      })
    );
  }

  private applyBaseContactAfterCharge(
    boss: BossRuntimeState,
    base: BaseState,
    serverTimeMs: number,
    result: BossUpdateResult
  ): void {
    if (boss.hasDamagedBase || boss.x - CombatNumbersV01.boss.ironmaw.collisionRadius > getBaseBreakthroughX()) {
      return;
    }

    boss.hasDamagedBase = true;
    const previousHp = base.hp;
    base.hp = Math.max(0, base.hp - CombatNumbersV01.boss.ironmaw.baseDamage);
    result.defeated = base.hp <= 0;
    result.events.push(
      this.feedback("base.damaged", serverTimeMs, {
        source: "boss_charge",
        previousHp,
        nextHp: base.hp,
        damage: CombatNumbersV01.boss.ironmaw.baseDamage
      })
    );
  }

  private enterPhase2(boss: BossRuntimeState, economy: EconomySystem, serverTimeMs: number): FeedbackEvent[] {
    boss.phase = 2;
    boss.phaseTransitionRemainingSeconds = CombatNumbersV01.boss.ironmaw.phaseTransition.stunSeconds;
    boss.skillRemainingSeconds = boss.phaseTransitionRemainingSeconds;
    boss.charging = false;
    boss.weakPointActive = false;
    boss.interruptProgress = 0;
    boss.controlInterruptBonusByPlayerId.clear();
    delete boss.currentSkill;
    delete boss.weakPointX;
    delete boss.weakPointY;
    delete boss.weakPointRemainingSeconds;
    economy.gain(CombatNumbersV01.boss.ironmaw.phaseTransition.teamSunReward);

    return [
      this.feedback("boss.phaseChanged", serverTimeMs, {
        phase: 2,
        transitionSeconds: CombatNumbersV01.boss.ironmaw.phaseTransition.stunSeconds
      }),
      this.feedback("sun.gained", serverTimeMs, {
        amount: CombatNumbersV01.boss.ironmaw.phaseTransition.teamSunReward,
        reason: "boss_phase_reward"
      })
    ];
  }

  private applyInterruptPoint(
    boss: BossRuntimeState,
    player: PlayerState | undefined,
    serverTimeMs: number,
    events: FeedbackEvent[]
  ): number {
    if (boss.currentSkill !== "charge_windup" || !boss.charging) {
      return 0;
    }

    let points = 1;
    if (player?.evolutionPath === "control") {
      const used = boss.controlInterruptBonusByPlayerId.get(player.playerId) ?? 0;
      const maxBonus = getBossInterruptBonus(player);
      if (used < maxBonus) {
        points += 1;
        boss.controlInterruptBonusByPlayerId.set(player.playerId, used + 1);
      }
    }

    boss.interruptProgress = Math.min(boss.interruptRequired, boss.interruptProgress + points);
    if (boss.interruptProgress >= boss.interruptRequired) {
      boss.charging = false;
      boss.weakPointActive = false;
      delete boss.weakPointX;
      delete boss.weakPointY;
      delete boss.weakPointRemainingSeconds;
      delete boss.currentSkill;
      boss.skillRemainingSeconds = CombatNumbersV01.boss.ironmaw.charge.recoverySeconds;
      if (player) {
        player.stats.bossInterrupts = (player.stats.bossInterrupts ?? 0) + 1;
      }
      events.push(
        this.feedback("boss.interrupted", serverTimeMs, {
          interruptProgress: boss.interruptProgress,
          interruptRequired: boss.interruptRequired,
          playerId: player?.playerId
        })
      );
    }

    return points;
  }

  private createSummonSpawns(count: number, enemyType: EnemyType): BossSpawnCommand[] {
    const preferredLanes = [0, 1, 3, 4, 2] as const;
    const available = [...preferredLanes];
    const spawns: BossSpawnCommand[] = [];

    for (let index = 0; index < count && available.length > 0; index += 1) {
      const laneIndex = Math.min(available.length - 1, Math.floor(this.random() * available.length));
      const lane = available.splice(laneIndex, 1)[0] ?? 2;
      spawns.push({ enemyType, laneIndex: lane });
    }

    return spawns;
  }

  private feedback(eventType: FeedbackEvent["eventType"], serverTimeMs: number, data: Record<string, unknown> = {}): FeedbackEvent {
    const boss = this.boss;
    const event: FeedbackEvent = {
      id: createEntityId("event", ++this.eventSequence),
      eventType,
      serverTimeMs,
      data
    };
    if (boss) {
      event.entityId = boss.id;
      event.x = boss.x;
      event.y = boss.y;
    }
    return event;
  }
}

function toBossSnapshot(boss: BossRuntimeState): BossState {
  const snapshot: BossState = {
    id: boss.id,
    bossType: boss.bossType,
    x: roundPosition(boss.x),
    y: roundPosition(boss.y),
    laneIndex: boss.laneIndex,
    hp: roundValue(boss.hp),
    maxHp: boss.maxHp,
    phase: boss.phase,
    weakPointActive: boss.weakPointActive,
    charging: boss.charging,
    interruptProgress: boss.interruptProgress,
    interruptRequired: boss.interruptRequired
  };

  if (boss.weakPointX !== undefined) {
    snapshot.weakPointX = roundPosition(boss.weakPointX);
  }
  if (boss.weakPointY !== undefined) {
    snapshot.weakPointY = roundPosition(boss.weakPointY);
  }
  if (boss.weakPointRemainingSeconds !== undefined) {
    snapshot.weakPointRemainingSeconds = roundSeconds(boss.weakPointRemainingSeconds);
  }
  if (boss.currentSkill !== undefined) {
    snapshot.currentSkill = boss.currentSkill;
  }
  if (boss.skillRemainingSeconds !== undefined) {
    snapshot.skillRemainingSeconds = roundSeconds(boss.skillRemainingSeconds);
  }

  return snapshot;
}

function findFrontMostPlant(plants: PlantState[], bossX: number): PlantState | undefined {
  return plants
    .filter((plant) => CombatNumbersV01.boss.ironmaw.plantDamageLanes.includes(plant.laneIndex as 1 | 2 | 3))
    .filter((plant) => plantCenterX(plant) < bossX)
    .sort((a, b) => plantCenterX(b) - plantCenterX(a))
    .at(0);
}

function findFirstPlantInChargePath(plants: PlantState[], startX: number, endX: number): PlantState | undefined {
  const minX = Math.min(startX, endX);
  const maxX = Math.max(startX, endX);
  return plants
    .filter((plant) => plant.laneIndex === CombatNumbersV01.boss.ironmaw.mainLane)
    .filter((plant) => {
      const centerX = plantCenterX(plant);
      return centerX >= minX - CombatNumbersV01.boss.ironmaw.collisionRadius && centerX <= maxX;
    })
    .sort((a, b) => plantCenterX(b) - plantCenterX(a))
    .at(0);
}

function plantCenterX(plant: PlantState): number {
  return getPlantCellCenter({
    laneIndex: plant.laneIndex as 0 | 1 | 2 | 3 | 4,
    columnIndex: plant.columnIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6
  }).x;
}

function isPointInChargePath(x: number, y: number, startX: number, endX: number): boolean {
  const minX = Math.min(startX, endX);
  const maxX = Math.max(startX, endX);
  const xPadding = CombatNumbersV01.boss.ironmaw.collisionRadius;
  return (
    x >= minX - xPadding &&
    x <= maxX + xPadding &&
    Math.abs(y - getLaneCenterY(CombatNumbersV01.boss.ironmaw.mainLane)) <= HERO_CHARGE_HIT_RADIUS_PX
  );
}

function damagePlayer(player: PlayerState, amount: number): void {
  player.hp = Math.max(0, player.hp - amount);
  player.stats.damageTaken = (player.stats.damageTaken ?? 0) + amount;
  if (player.hp <= 0 && player.alive) {
    player.alive = false;
    player.stats.deaths = (player.stats.deaths ?? 0) + 1;
  }
}

function segmentIntersectsCircle(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  circleX: number,
  circleY: number,
  radius: number
): boolean {
  const dx = endX - startX;
  const dy = endY - startY;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= 0) {
    return (circleX - startX) ** 2 + (circleY - startY) ** 2 <= radius * radius;
  }

  const projected = ((circleX - startX) * dx + (circleY - startY) * dy) / lengthSquared;
  const t = Math.max(0, Math.min(1, projected));
  const closestX = startX + dx * t;
  const closestY = startY + dy * t;
  return (circleX - closestX) ** 2 + (circleY - closestY) ** 2 <= radius * radius;
}

function getBaseBreakthroughX(): number {
  return MapConfigV01.base.centerX + MapConfigV01.base.width / 2;
}

function roundPosition(value: number): number {
  return Number(value.toFixed(2));
}

function roundSeconds(value: number): number {
  return Number(value.toFixed(3));
}

function roundValue(value: number): number {
  return Number(value.toFixed(3));
}
