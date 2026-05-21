import {
  CombatNumbersV01,
  createEntityId,
  getPlantCellCenter,
  type BulletState,
  type FeedbackEvent,
  type PlantState
} from "@sprout-and-steel/shared";
import type { EconomySystem } from "./EconomySystem";
import type { EnemySystem } from "./EnemySystem";

type ProjectileRuntimeState = BulletState & {
  laneIndex?: number;
};

export class ProjectileSystem {
  private readonly bulletsById = new Map<string, ProjectileRuntimeState>();
  private bulletSequence = 0;

  spawnPeaProjectile(plant: PlantState, _serverTimeMs: number): BulletState {
    const center = getPlantCellCenter({
      laneIndex: plant.laneIndex as 0 | 1 | 2 | 3 | 4,
      columnIndex: plant.columnIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6
    });
    const config = CombatNumbersV01.plants.peashotter;
    const bullet: ProjectileRuntimeState = {
      id: createEntityId("bullet", ++this.bulletSequence),
      ownerPlantId: plant.id,
      type: "pea_projectile",
      x: center.x + 32,
      y: center.y - 6,
      dirX: 1,
      dirY: 0,
      speed: config.projectileSpeed,
      remainingLifetimeSeconds: config.projectileLifetimeSeconds,
      laneIndex: plant.laneIndex
    };

    this.bulletsById.set(bullet.id, bullet);
    return toBulletSnapshot(bullet);
  }

  update(deltaSeconds: number, enemies: EnemySystem, economy: EconomySystem, serverTimeMs: number): FeedbackEvent[] {
    if (deltaSeconds <= 0) {
      return [];
    }

    const events: FeedbackEvent[] = [];

    for (const bullet of [...this.bulletsById.values()]) {
      const startX = bullet.x;
      const startY = bullet.y;
      bullet.x += bullet.dirX * bullet.speed * deltaSeconds;
      bullet.y += bullet.dirY * bullet.speed * deltaSeconds;
      bullet.remainingLifetimeSeconds -= deltaSeconds;

      if (bullet.type === "pea_projectile" && bullet.laneIndex !== undefined) {
        const hit = enemies.findFirstEnemyHitInLane({
          laneIndex: bullet.laneIndex,
          startX,
          endX: bullet.x,
          radius: CombatNumbersV01.plants.peashotter.projectileRadius
        });

        if (hit) {
          events.push(
            ...enemies.damageEnemy(hit.id, CombatNumbersV01.plants.peashotter.damage, economy, serverTimeMs).events
          );
          this.bulletsById.delete(bullet.id);
          continue;
        }
      }

      if (bullet.remainingLifetimeSeconds <= 0 || !Number.isFinite(startY)) {
        this.bulletsById.delete(bullet.id);
      }
    }

    return events;
  }

  getSnapshot(): BulletState[] {
    return [...this.bulletsById.values()].map(toBulletSnapshot).sort((a, b) => a.id.localeCompare(b.id));
  }
}

function toBulletSnapshot(bullet: ProjectileRuntimeState): BulletState {
  const snapshot: BulletState = {
    id: bullet.id,
    type: bullet.type,
    x: roundPosition(bullet.x),
    y: roundPosition(bullet.y),
    dirX: bullet.dirX,
    dirY: bullet.dirY,
    speed: bullet.speed,
    remainingLifetimeSeconds: Number(Math.max(0, bullet.remainingLifetimeSeconds).toFixed(3))
  };

  if (bullet.ownerPlayerId !== undefined) {
    snapshot.ownerPlayerId = bullet.ownerPlayerId;
  }
  if (bullet.ownerPlantId !== undefined) {
    snapshot.ownerPlantId = bullet.ownerPlantId;
  }

  return snapshot;
}

function roundPosition(value: number): number {
  return Number(value.toFixed(2));
}
