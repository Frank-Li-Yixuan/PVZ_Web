import {
  CombatNumbersV01,
  MapConfigV01,
  PLANT_TYPES,
  createEntityId,
  distanceSquared,
  getPlantCellCenter,
  isGridCellInBounds,
  type ActionAcceptedPayload,
  type ActionRejectedPayload,
  type ActionRejectReason,
  type EnemyState,
  type FeedbackEvent,
  type MatchState,
  type PlantRequestPayload,
  type PlantState,
  type PlayerId,
  type PlayerState,
  type RequestId
} from "@sprout-and-steel/shared";
import type { EconomySystem } from "./EconomySystem";

const PRODUCE_EPSILON_SECONDS = 0.000_001;

const PLANTING_MATCH_STATES = new Set<MatchState>([
  "WAVE_PREP",
  "WAVE_ACTIVE",
  "WAVE_CLEAR",
  "BOSS_PREP",
  "BOSS_ACTIVE"
]);

type PlantRuntimeState = PlantState & {
  produceRemainingSeconds?: number;
};

export type PlantDamageResult = {
  plant?: PlantState;
  destroyed?: FeedbackEvent;
};

export type BlockingPlantResult = {
  plant: PlantState;
  stopX: number;
};

export type PlantActionInput = {
  requestId: RequestId;
  request: PlantRequestPayload;
  matchState: MatchState;
  player: PlayerState | undefined;
  economy: EconomySystem;
  serverTimeMs: number;
  enemies: EnemyState[];
};

export type PlantActionResult =
  | {
      ok: true;
      accepted: ActionAcceptedPayload;
      feedback: FeedbackEvent;
      plant: PlantState;
    }
  | {
      ok: false;
      rejected: ActionRejectedPayload;
    };

export class PlantSystem {
  private readonly plantsById = new Map<string, PlantRuntimeState>();
  private readonly occupiedCells = new Map<string, string>();
  private plantSequence = 0;
  private eventSequence = 0;

  tryPlant(input: PlantActionInput): PlantActionResult {
    const rejection = this.validatePlantAction(input);
    if (rejection) {
      return {
        ok: false,
        rejected: this.rejected(input.requestId, rejection.reason, rejection.message, input.serverTimeMs)
      };
    }

    const player = input.player;
    if (!player) {
      return {
        ok: false,
        rejected: this.rejected(input.requestId, "PLAYER_DEAD", "Dead players cannot plant.", input.serverTimeMs)
      };
    }

    const plantType = input.request.plantType;
    const config = CombatNumbersV01.plants[plantType];
    const cellKey = toCellKey(input.request.laneIndex, input.request.columnIndex);

    if (!input.economy.spend(config.sunCost)) {
      return {
        ok: false,
        rejected: this.rejected(input.requestId, "NOT_ENOUGH_SUN", "Not enough shared sun.", input.serverTimeMs)
      };
    }

    const id = createEntityId("plant", ++this.plantSequence);
    const plant: PlantRuntimeState = {
      id,
      type: plantType,
      laneIndex: input.request.laneIndex,
      columnIndex: input.request.columnIndex,
      hp: config.maxHp,
      maxHp: config.maxHp,
      alive: true
    };

    if (plantType === "sunbloom") {
      plant.produceRemainingSeconds = CombatNumbersV01.plants.sunbloom.firstProduceDelaySeconds;
      plant.cooldownRemainingSeconds = CombatNumbersV01.plants.sunbloom.firstProduceDelaySeconds;
    }

    this.plantsById.set(id, plant);
    this.occupiedCells.set(cellKey, id);
    player.stats.plantsPlaced = (player.stats.plantsPlaced ?? 0) + 1;
    player.stats.sunSpent = (player.stats.sunSpent ?? 0) + config.sunCost;

    const center = getPlantCellCenter({
      laneIndex: input.request.laneIndex,
      columnIndex: input.request.columnIndex
    });

    return {
      ok: true,
      accepted: {
        requestId: input.requestId,
        action: "plant",
        serverTimeMs: input.serverTimeMs,
        affectedEntityIds: [id]
      },
      feedback: {
        id: createEntityId("event", ++this.eventSequence),
        eventType: "plant.placed",
        serverTimeMs: input.serverTimeMs,
        entityId: id,
        playerId: player.playerId,
        x: center.x,
        y: center.y,
        data: {
          plantType,
          laneIndex: input.request.laneIndex,
          columnIndex: input.request.columnIndex
        }
      },
      plant: toPlantSnapshot(plant)
    };
  }

  update(deltaSeconds: number, economy: EconomySystem, serverTimeMs: number): FeedbackEvent[] {
    if (deltaSeconds <= 0 || economy.isSunSuppressed()) {
      return [];
    }

    const events: FeedbackEvent[] = [];
    for (const plant of this.plantsById.values()) {
      if (!plant.alive || plant.type !== "sunbloom" || plant.produceRemainingSeconds === undefined) {
        continue;
      }

      plant.produceRemainingSeconds -= deltaSeconds;
      while (plant.produceRemainingSeconds <= PRODUCE_EPSILON_SECONDS) {
        economy.gain(CombatNumbersV01.plants.sunbloom.produceAmount);
        events.push({
          id: createEntityId("event", ++this.eventSequence),
          eventType: "sun.gained",
          serverTimeMs,
          entityId: plant.id,
          data: {
            amount: CombatNumbersV01.plants.sunbloom.produceAmount,
            reason: "sunbloom_produce"
          }
        });
        plant.produceRemainingSeconds += CombatNumbersV01.plants.sunbloom.produceIntervalSeconds;
      }

      plant.cooldownRemainingSeconds = roundSeconds(plant.produceRemainingSeconds);
    }

    return events;
  }

  getSnapshot(): PlantState[] {
    return [...this.plantsById.values()].map(toPlantSnapshot).sort((a, b) => a.id.localeCompare(b.id));
  }

  getLivingPlants(): PlantState[] {
    return [...this.plantsById.values()]
      .filter((plant) => plant.alive)
      .map(toPlantSnapshot)
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  getPlant(plantId: string | undefined): PlantState | undefined {
    if (!plantId) {
      return undefined;
    }

    const plant = this.plantsById.get(plantId);
    return plant?.alive ? toPlantSnapshot(plant) : undefined;
  }

  damagePlant(plantId: string | undefined, amount: number, serverTimeMs: number): PlantDamageResult {
    if (!plantId || !Number.isFinite(amount) || amount <= 0) {
      return {};
    }

    const plant = this.plantsById.get(plantId);
    if (!plant || !plant.alive) {
      return {};
    }

    plant.hp = Math.max(0, plant.hp - amount);
    if (plant.hp > 0) {
      return { plant: toPlantSnapshot(plant) };
    }

    plant.alive = false;
    this.plantsById.delete(plant.id);
    this.occupiedCells.delete(toCellKey(plant.laneIndex, plant.columnIndex));

    const center = getPlantCellCenter({
      laneIndex: plant.laneIndex as 0 | 1 | 2 | 3 | 4,
      columnIndex: plant.columnIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6
    });

    return {
      destroyed: {
        id: createEntityId("event", ++this.eventSequence),
        eventType: "plant.destroyed",
        serverTimeMs,
        entityId: plant.id,
        x: center.x,
        y: center.y,
        data: {
          plantType: plant.type,
          laneIndex: plant.laneIndex,
          columnIndex: plant.columnIndex
        }
      }
    };
  }

  findBlockingPlant(laneIndex: number, enemyX: number, enemyRadius = 18): BlockingPlantResult | undefined {
    let best: PlantRuntimeState | undefined;

    for (const plant of this.plantsById.values()) {
      if (!plant.alive || plant.laneIndex !== laneIndex) {
        continue;
      }

      const bounds = getCellBounds(plant.laneIndex, plant.columnIndex);
      const overlapsCell = enemyX - enemyRadius <= bounds.right && enemyX + enemyRadius >= bounds.left;
      if (!overlapsCell) {
        continue;
      }

      if (!best || plant.columnIndex > best.columnIndex) {
        best = plant;
      }
    }

    if (!best) {
      return undefined;
    }

    const bounds = getCellBounds(best.laneIndex, best.columnIndex);
    return {
      plant: toPlantSnapshot(best),
      stopX: bounds.right + enemyRadius
    };
  }

  private validatePlantAction(input: PlantActionInput): { reason: ActionRejectReason; message: string } | undefined {
    if (!PLANTING_MATCH_STATES.has(input.matchState)) {
      return { reason: "NOT_IN_VALID_MATCH_STATE", message: "Planting is not allowed in the current match state." };
    }

    if (!input.player?.alive) {
      return { reason: "PLAYER_DEAD", message: "Dead players cannot plant." };
    }

    if (!isValidPlantType(input.request.plantType)) {
      return { reason: "UNKNOWN_ERROR", message: "Unknown plant type." };
    }

    if (!isGridCellInBounds(input.request)) {
      return { reason: "CELL_NOT_PLANTABLE", message: "Target cell is not plantable." };
    }

    if (this.occupiedCells.has(toCellKey(input.request.laneIndex, input.request.columnIndex))) {
      return { reason: "CELL_OCCUPIED", message: "Target cell is already occupied." };
    }

    if (isEnemyBlockingCell(input.request, input.enemies)) {
      return { reason: "ENEMY_BLOCKING_CELL", message: "An enemy is blocking the target cell." };
    }

    const center = getPlantCellCenter({
      laneIndex: input.request.laneIndex,
      columnIndex: input.request.columnIndex
    });
    const interactRange = CombatNumbersV01.hero.interactRange;
    if (distanceSquared(input.player, center) > interactRange * interactRange) {
      return { reason: "OUT_OF_RANGE", message: "Move closer to the target cell." };
    }

    const config = CombatNumbersV01.plants[input.request.plantType];
    if (!input.economy.canSpend(config.sunCost)) {
      return { reason: "NOT_ENOUGH_SUN", message: "Not enough shared sun." };
    }

    return undefined;
  }

  private rejected(
    requestId: RequestId,
    reason: ActionRejectReason,
    message: string,
    serverTimeMs: number
  ): ActionRejectedPayload {
    return {
      requestId,
      action: "plant",
      reason,
      message,
      serverTimeMs
    };
  }
}

function isValidPlantType(value: string): value is PlantRequestPayload["plantType"] {
  return PLANT_TYPES.includes(value as PlantRequestPayload["plantType"]);
}

function isEnemyBlockingCell(request: PlantRequestPayload, enemies: EnemyState[]): boolean {
  const cellLeft = MapConfigV01.plantGrid.originX + request.columnIndex * MapConfigV01.cellWidthPx;
  const cellRight = cellLeft + MapConfigV01.cellWidthPx;

  return enemies.some((enemy) => {
    if (enemy.state === "DEAD" || enemy.laneIndex !== request.laneIndex) {
      return false;
    }

    return enemy.x >= cellLeft && enemy.x <= cellRight;
  });
}

function toCellKey(laneIndex: number, columnIndex: number): string {
  return `${laneIndex}:${columnIndex}`;
}

function getCellBounds(laneIndex: number, columnIndex: number): { left: number; right: number } {
  const left = MapConfigV01.plantGrid.originX + columnIndex * MapConfigV01.cellWidthPx;
  return {
    left,
    right: left + MapConfigV01.cellWidthPx
  };
}

function toPlantSnapshot(plant: PlantRuntimeState): PlantState {
  const snapshot: PlantState = {
    id: plant.id,
    type: plant.type,
    laneIndex: plant.laneIndex,
    columnIndex: plant.columnIndex,
    hp: plant.hp,
    maxHp: plant.maxHp,
    alive: plant.alive
  };

  if (plant.shield !== undefined) {
    snapshot.shield = plant.shield;
  }
  if (plant.cooldownRemainingSeconds !== undefined) {
    snapshot.cooldownRemainingSeconds = roundSeconds(plant.cooldownRemainingSeconds);
  }

  return snapshot;
}

function roundSeconds(value: number): number {
  return Number(value.toFixed(3));
}
