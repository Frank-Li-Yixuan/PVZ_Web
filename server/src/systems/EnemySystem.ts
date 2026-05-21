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
};

export type SpawnEnemyInput = {
  enemyType: EnemyType;
  laneIndex: number;
  serverTimeMs: number;
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
          debugSpawn: true
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
        continue;
      }

      const blocked = this.updateMovement(enemy, deltaSeconds, plants);
      if (blocked) {
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
      }
    }

    return {
      events,
      defeated
    };
  }

  damageEnemy(enemyId: string | undefined, amount: number, economy: EconomySystem, serverTimeMs: number): EnemyDamageResult {
    if (!enemyId || !Number.isFinite(amount) || amount <= 0) {
      return { events: [], killed: false };
    }

    const enemy = this.enemiesById.get(enemyId);
    if (!enemy || enemy.state === "DEAD") {
      return { events: [], killed: false };
    }

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
          damage: amount,
          hp: enemy.hp
        }
      }
    ];

    if (enemy.hp > 0) {
      return { events, killed: false };
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
    if (this.random() < enemyConfig.sunDropChance) {
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
          enemyType: enemy.type
        }
      });
    }

    return { events, killed: true };
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

  getSnapshot(): EnemyState[] {
    return [...this.enemiesById.values()].map(toEnemySnapshot).sort((a, b) => a.id.localeCompare(b.id));
  }

  private updateMovement(enemy: EnemyRuntimeState, deltaSeconds: number, plants: PlantSystem): boolean {
    const config = CombatNumbersV01.enemies[enemy.type];
    const nextX = enemy.x - config.moveSpeed * deltaSeconds;
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
