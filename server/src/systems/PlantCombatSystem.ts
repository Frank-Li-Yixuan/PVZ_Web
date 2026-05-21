import {
  CombatNumbersV01,
  createEntityId,
  getPlantCellCenter,
  type FeedbackEvent,
  type PlantState
} from "@sprout-and-steel/shared";
import type { EnemySystem } from "./EnemySystem";
import type { PlantSystem } from "./PlantSystem";
import type { ProjectileSystem } from "./ProjectileSystem";
import type { BossSystem } from "./BossSystem";

const FIRE_EPSILON_SECONDS = 0.000_001;

export class PlantCombatSystem {
  private readonly cooldownByPlantId = new Map<string, number>();
  private eventSequence = 0;

  update(
    deltaSeconds: number,
    plants: PlantSystem,
    enemies: EnemySystem,
    projectiles: ProjectileSystem,
    serverTimeMs: number,
    boss?: BossSystem
  ): FeedbackEvent[] {
    if (deltaSeconds <= 0) {
      return [];
    }

    const events: FeedbackEvent[] = [];
    const livingPlants = plants.getLivingPlants();
    const livingPlantIds = new Set(livingPlants.map((plant) => plant.id));

    for (const plantId of this.cooldownByPlantId.keys()) {
      if (!livingPlantIds.has(plantId)) {
        this.cooldownByPlantId.delete(plantId);
      }
    }

    for (const plant of livingPlants) {
      if (plant.type !== "peashotter") {
        continue;
      }

      const remaining = Math.max(0, (this.cooldownByPlantId.get(plant.id) ?? 0) - deltaSeconds);
      this.cooldownByPlantId.set(plant.id, remaining);

      if (remaining > FIRE_EPSILON_SECONDS) {
        continue;
      }

      if (!enemies.findPeashotterTarget(plant) && !boss?.canPeashotterTarget(plant)) {
        continue;
      }

      const projectile = projectiles.spawnPeaProjectile(plant, serverTimeMs);
      const center = getPlantCellCenter({
        laneIndex: plant.laneIndex as 0 | 1 | 2 | 3 | 4,
        columnIndex: plant.columnIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6
      });
      events.push({
        id: createEntityId("event", ++this.eventSequence),
        eventType: "plant.shoot",
        serverTimeMs,
        entityId: plant.id,
        x: center.x,
        y: center.y,
        data: {
          plantType: plant.type,
          projectileId: projectile.id,
          laneIndex: plant.laneIndex,
          columnIndex: plant.columnIndex
        }
      });
      this.cooldownByPlantId.set(plant.id, CombatNumbersV01.plants.peashotter.attackIntervalSeconds);
    }

    return events;
  }

  getCooldownForPlant(plant: PlantState): number | undefined {
    const cooldown = this.cooldownByPlantId.get(plant.id);
    return cooldown === undefined ? undefined : Number(cooldown.toFixed(3));
  }
}
