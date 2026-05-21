import {
  CombatNumbersV01,
  MapConfigV01,
  createEntityId,
  getLaneCenterY,
  getPlantCellCenter,
  isLaneIndex,
  type BaseState,
  type EnemyState,
  type EnemyType,
  type FeedbackEvent,
  type PlantState
} from "@sprout-and-steel/shared";
import type { EconomySystem } from "./EconomySystem";
import type { PlantSystem } from "./PlantSystem";

const ENEMY_COLLISION_RADIUS_PX = 18;
const ATTACK_EPSILON_SECONDS = 0.000_001;

type EnemyRuntimeState = EnemyState & {
  attackCooldownRemainingSeconds: number;
  slowPercent?: number;
};

export type SpawnEnemyInput = {
  enemyType: EnemyType;
  laneIndex: number;
  serverTimeMs: number;
  debugSpawn?: boolean;
  waveIndex?: number;
  waveEventIndex?: number;
};

export type SpawnEnemyResult =
  | {
      ok: true;
      enemy: EnemyState;
      feedback: FeedbackEvent;
    }
  | {
      ok: false;
      reason: string;
    };

export type EnemyUpdateResult = {
  events: FeedbackEvent[];
  defeated: boolean;
};

export type EnemyDamageResult = {
  events: FeedbackEvent[];
  killed: boolean;
  damageApplied: number;
};

export type EnemyDamageOptions = {
  sunDropChanceBonus?: number;
};

export class EnemySystem {
  private readonly enemiesById = new Map<string, EnemyRuntimeState>();
  private enemySequence = 0;
  private eventSequence = 0;

  constructor(private readonly random: () => number = Math.random) {}

  spawnEnemy(input: SpawnEnemyInput): SpawnEnemyResult {
    if (!isLaneIndex(input.laneIndex)) {
      return {
        ok: false,
        reason: "INVALID_LANE"
      };
    }

    const config = CombatNumbersV01.enemies[input.enemyType];
    const enemy: EnemyRuntimeState = {
      id: createEntityId("enemy", ++this.enemySequence),
      type: input.enemyType,
      laneIndex: input.laneIndex,
      x: MapConfigV01.enemySpawnMarker.centerX,
      y: getLaneCenterY(input.laneIndex as 0 | 1 | 2 | 3 | 4),
      hp: config.maxHp,
      maxHp: config.maxHp,
      state: "MOVING",
      attackCooldownRemainingSeconds: 0
    };

    this.enemiesById.set(enemy.id, enemy);

    return {
      ok: true,
      enemy: toEnemySnapshot(enemy),
      feedback: {
        id: createEntityId("event", ++this.eventSequence),
        eventType: "enemy.spawned",
        serverTimeMs: input.serverTimeMs,
        entityId: enemy.id,
        x: enemy.x,
        y: enemy.y,
        data: {
          enemyType: input.enemyType,
          laneIndex: input.laneIndex,
          debugSpawn: input.debugSpawn ?? false,
          waveIndex: input.waveIndex,
          waveEventIndex: input.waveEventIndex
        }
      }
    };
  }

  update(
    deltaSeconds: number,
    plants: PlantSystem,
    economy: EconomySystem,
    base: BaseState,
    serverTimeMs: number
  ): EnemyUpdateResult {
    if (deltaSeconds <= 0) {
      return { events: [], defeated: base.hp <= 0 };
    }

    const events: FeedbackEvent[] = [];
    let defeated = base.hp <= 0;

    for (const enemy of [...this.enemiesById.values()]) {
      if (enemy.state === "DEAD") {
        continue;
      }

      if (enemy.state === "ATTACKING_PLANT") {
        events.push(...this.updatePlantAttack(enemy, deltaSeconds, plants, serverTimeMs));
        this.updateSlowTimer(enemy, deltaSeconds);
        continue;
      }

      const blocked = this.updateMovement(enemy, deltaSeconds, plants);
      if (blocked) {
        this.updateSlowTimer(enemy, deltaSeconds);
        continue;
      }

      if (enemy.x <= getBaseBreakthroughX()) {
        const enemyConfig = CombatNumbersV01.enemies[enemy.type];
        const previousHp = base.hp;
        base.hp = Math.max(0, base.hp - enemyConfig.baseDamage);
        defeated = base.hp <= 0;
        this.enemiesById.delete(enemy.id);
        events.push({
          id: createEntityId("event", ++this.eventSequence),
          eventType: "base.damaged",
          serverTimeMs,
          entityId: enemy.id,
          x: getBaseBreakthroughX(),
          y: enemy.y,
          data: {
            enemyType: enemy.type,
            previousHp,
            nextHp: base.hp,
            damage: enemyConfig.baseDamage
          }
        });
        continue;
      }

      this.updateSlowTimer(enemy, deltaSeconds);
    }

    return {
      events,
      defeated
    };
  }

  damageEnemy(
    enemyId: string | undefined,
    amount: number,
    economy: EconomySystem,
    serverTimeMs: number,
    options: EnemyDamageOptions = {}
  ): EnemyDamageResult {
    if (!enemyId || !Number.isFinite(amount) || amount <= 0) {
      return { events: [], killed: false, damageApplied: 0 };
    }

    const enemy = this.enemiesById.get(enemyId);
    if (!enemy || enemy.state === "DEAD") {
      return { events: [], killed: false, damageApplied: 0 };
    }

    const damageApplied = Math.min(enemy.hp, amount);
    enemy.hp = Math.max(0, enemy.hp - amount);
    const events: FeedbackEvent[] = [
      {
        id: createEntityId("event", ++this.eventSequence),
        eventType: "enemy.hit",
        serverTimeMs,
        entityId: enemy.id,
        x: enemy.x,
        y: enemy.y,
        data: {
          enemyType: enemy.type,
          damage: damageApplied,
          hp: enemy.hp
        }
      }
    ];

    if (enemy.hp > 0) {
      return { events, killed: false, damageApplied };
    }

    enemy.state = "DEAD";
    this.enemiesById.delete(enemy.id);
    events.push({
      id: createEntityId("event", ++this.eventSequence),
      eventType: "enemy.killed",
      serverTimeMs,
      entityId: enemy.id,
      x: enemy.x,
      y: enemy.y,
      data: {
        enemyType: enemy.type
      }
    });

    const enemyConfig = CombatNumbersV01.enemies[enemy.type];
    const sunDropChance = clampChance(enemyConfig.sunDropChance + (options.sunDropChanceBonus ?? 0));
    if (this.random() < sunDropChance) {
      economy.gain(CombatNumbersV01.economy.sunDropAmount);
      events.push({
        id: createEntityId("event", ++this.eventSequence),
        eventType: "sun.gained",
        serverTimeMs,
        entityId: enemy.id,
        x: enemy.x,
        y: enemy.y,
        data: {
          amount: CombatNumbersV01.economy.sunDropAmount,
          reason: "enemy_drop",
          enemyType: enemy.type,
          sunDropChance
        }
      });
    }

    return { events, killed: true, damageApplied };
  }

  applySlow(enemyId: string | undefined, slowPercent: number, durationSeconds: number): boolean {
    if (!enemyId || !Number.isFinite(slowPercent) || !Number.isFinite(durationSeconds)) {
      return false;
    }

    const enemy = this.enemiesById.get(enemyId);
    if (!enemy || enemy.state === "DEAD" || slowPercent <= 0 || durationSeconds <= 0) {
      return false;
    }

    enemy.slowed = true;
    enemy.slowPercent = Math.max(enemy.slowPercent ?? 0, Math.min(0.95, slowPercent));
    enemy.slowRemainingSeconds = roundSeconds(Math.max(enemy.slowRemainingSeconds ?? 0, durationSeconds));
    return true;
  }

  findPeashotterTarget(plant: PlantState): EnemyState | undefined {
    const plantCenter = getPlantCellCenter({
      laneIndex: plant.laneIndex as 0 | 1 | 2 | 3 | 4,
      columnIndex: plant.columnIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6
    });

    return [...this.enemiesById.values()]
      .filter((enemy) => enemy.state !== "DEAD" && enemy.laneIndex === plant.laneIndex && enemy.x > plantCenter.x)
      .sort((a, b) => a.x - b.x)
      .map(toEnemySnapshot)
      .at(0);
  }

  findFirstEnemyHitInLane(input: {
    laneIndex: number;
    startX: number;
    endX: number;
    radius: number;
  }): EnemyState | undefined {
    const minX = Math.min(input.startX, input.endX) - input.radius - ENEMY_COLLISION_RADIUS_PX;
    const maxX = Math.max(input.startX, input.endX) + input.radius + ENEMY_COLLISION_RADIUS_PX;

    return [...this.enemiesById.values()]
      .filter((enemy) => enemy.state !== "DEAD" && enemy.laneIndex === input.laneIndex)
      .filter((enemy) => enemy.x >= minX && enemy.x <= maxX)
      .sort((a, b) => (input.endX >= input.startX ? a.x - b.x : b.x - a.x))
      .map(toEnemySnapshot)
      .at(0);
  }

  findFirstEnemyHitInSegment(input: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    radius: number;
  }): EnemyState | undefined {
    const dx = input.endX - input.startX;
    const dy = input.endY - input.startY;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared <= 0) {
      return undefined;
    }

    const collisionRadius = input.radius + ENEMY_COLLISION_RADIUS_PX;
    const collisionRadiusSquared = collisionRadius * collisionRadius;

    return [...this.enemiesById.values()]
      .filter((enemy) => enemy.state !== "DEAD")
      .map((enemy) => {
        const projected =
          ((enemy.x - input.startX) * dx + (enemy.y - input.startY) * dy) / lengthSquared;
        const t = Math.max(0, Math.min(1, projected));
        const closestX = input.startX + dx * t;
        const closestY = input.startY + dy * t;
        const distanceSquared = (enemy.x - closestX) ** 2 + (enemy.y - closestY) ** 2;
        return {
          enemy,
          t,
          distanceSquared
        };
      })
      .filter((candidate) => candidate.distanceSquared <= collisionRadiusSquared)
      .sort((a, b) => a.t - b.t || a.distanceSquared - b.distanceSquared)
      .map((candidate) => toEnemySnapshot(candidate.enemy))
      .at(0);
  }

  getSnapshot(): EnemyState[] {
    return [...this.enemiesById.values()].map(toEnemySnapshot).sort((a, b) => a.id.localeCompare(b.id));
  }

  private updateMovement(enemy: EnemyRuntimeState, deltaSeconds: number, plants: PlantSystem): boolean {
    const config = CombatNumbersV01.enemies[enemy.type];
    const speedMultiplier = enemy.slowed ? Math.max(0, 1 - (enemy.slowPercent ?? 0)) : 1;
    const nextX = enemy.x - config.moveSpeed * speedMultiplier * deltaSeconds;
    const blocker = plants.findBlockingPlant(enemy.laneIndex, nextX, ENEMY_COLLISION_RADIUS_PX);

    if (blocker) {
      enemy.x = Math.max(nextX, blocker.stopX);
      enemy.state = "ATTACKING_PLANT";
      enemy.targetPlantId = blocker.plant.id;
      enemy.attackCooldownRemainingSeconds = 0;
      return true;
    }

    enemy.x = nextX;
    return false;
  }

  private updateSlowTimer(enemy: EnemyRuntimeState, deltaSeconds: number): void {
    if (!enemy.slowed) {
      return;
    }

    const remaining = (enemy.slowRemainingSeconds ?? 0) - deltaSeconds;
    if (remaining > ATTACK_EPSILON_SECONDS) {
      enemy.slowRemainingSeconds = roundSeconds(remaining);
      return;
    }

    delete enemy.slowed;
    delete enemy.slowRemainingSeconds;
    delete enemy.slowPercent;
  }

  private updatePlantAttack(
    enemy: EnemyRuntimeState,
    deltaSeconds: number,
    plants: PlantSystem,
    serverTimeMs: number
  ): FeedbackEvent[] {
    const target = plants.getPlant(enemy.targetPlantId);
    if (!target) {
      enemy.state = "MOVING";
      delete enemy.targetPlantId;
      enemy.attackCooldownRemainingSeconds = 0;
      return [];
    }

    const config = CombatNumbersV01.enemies[enemy.type];
    const events: FeedbackEvent[] = [];
    enemy.attackCooldownRemainingSeconds -= deltaSeconds;

    while (enemy.attackCooldownRemainingSeconds <= ATTACK_EPSILON_SECONDS) {
      const result = plants.damagePlant(enemy.targetPlantId, config.plantDamage, serverTimeMs);
      if (result.destroyed) {
        events.push(result.destroyed);
        enemy.state = "MOVING";
        delete enemy.targetPlantId;
        enemy.attackCooldownRemainingSeconds = 0;
        break;
      }

      enemy.attackCooldownRemainingSeconds += config.plantAttackIntervalSeconds;
    }

    return events;
  }
}

function getBaseBreakthroughX(): number {
  return MapConfigV01.base.centerX + MapConfigV01.base.width / 2;
}

function toEnemySnapshot(enemy: EnemyRuntimeState): EnemyState {
  const snapshot: EnemyState = {
    id: enemy.id,
    type: enemy.type,
    laneIndex: enemy.laneIndex,
    x: roundPosition(enemy.x),
    y: roundPosition(enemy.y),
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    state: enemy.state
  };

  if (enemy.targetPlantId) {
    snapshot.targetPlantId = enemy.targetPlantId;
  }
  if (enemy.slowed !== undefined) {
    snapshot.slowed = enemy.slowed;
  }
  if (enemy.slowRemainingSeconds !== undefined) {
    snapshot.slowRemainingSeconds = enemy.slowRemainingSeconds;
  }

  return snapshot;
}

function roundPosition(value: number): number {
  return Number(value.toFixed(2));
}

function roundSeconds(value: number): number {
  return Number(value.toFixed(3));
}

function clampChance(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}
