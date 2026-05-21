import { CombatNumbersV01, type FeedbackEvent, type PlantState } from "@sprout-and-steel/shared";
import type { EnemySystem } from "./EnemySystem";
import type { PlantSystem } from "./PlantSystem";
import type { ProjectileSystem } from "./ProjectileSystem";

const FIRE_EPSILON_SECONDS = 0.000_001;

export class PlantCombatSystem {
  private readonly cooldownByPlantId = new Map<string, number>();

  update(
    deltaSeconds: number,
    plants: PlantSystem,
    enemies: EnemySystem,
    projectiles: ProjectileSystem,
    serverTimeMs: number
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

      if (!enemies.findPeashotterTarget(plant)) {
        continue;
      }

      projectiles.spawnPeaProjectile(plant, serverTimeMs);
      this.cooldownByPlantId.set(plant.id, CombatNumbersV01.plants.peashotter.attackIntervalSeconds);
    }

    return events;
  }

  getCooldownForPlant(plant: PlantState): number | undefined {
    const cooldown = this.cooldownByPlantId.get(plant.id);
    return cooldown === undefined ? undefined : Number(cooldown.toFixed(3));
  }
}
