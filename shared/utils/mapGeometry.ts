import { MapConfigV01, type ColumnIndex, type LaneIndex } from "../config/mapConfig";
import type { PlayerSlot } from "../types/enums";
import type { GridCell, Vector2 } from "../types/entities";
import { clamp, isGridCellInBounds } from "./math";

export type MapBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export const MapBoundsV01: MapBounds = MapConfigV01.playerBounds;

export function getLaneCenterY(laneIndex: LaneIndex): number {
  return MapConfigV01.plantGrid.originY + laneIndex * MapConfigV01.laneHeightPx + MapConfigV01.laneHeightPx / 2;
}

export function getPlantCellCenter(cell: GridCell & { laneIndex: LaneIndex; columnIndex: ColumnIndex }): Vector2 {
  return {
    x: MapConfigV01.plantGrid.originX + cell.columnIndex * MapConfigV01.cellWidthPx + MapConfigV01.cellWidthPx / 2,
    y: getLaneCenterY(cell.laneIndex)
  };
}

export function getPlantCellAtWorldPoint(
  point: Vector2
): (GridCell & { laneIndex: LaneIndex; columnIndex: ColumnIndex }) | undefined {
  const columnIndex = Math.floor((point.x - MapConfigV01.plantGrid.originX) / MapConfigV01.cellWidthPx);
  const laneIndex = Math.floor((point.y - MapConfigV01.plantGrid.originY) / MapConfigV01.laneHeightPx);
  const cell = { laneIndex, columnIndex };

  if (!isGridCellInBounds(cell)) {
    return undefined;
  }

  return cell as GridCell & { laneIndex: LaneIndex; columnIndex: ColumnIndex };
}

export function getPlayerSpawnPosition(slot: PlayerSlot): Vector2 {
  const spawn = MapConfigV01.playerSpawns[slot];
  return { x: spawn.x, y: spawn.y };
}

export function clampPointToMapBounds(point: Vector2, padding = 0, bounds: MapBounds = MapBoundsV01): Vector2 {
  return {
    x: clamp(point.x, bounds.minX + padding, bounds.maxX - padding),
    y: clamp(point.y, bounds.minY + padding, bounds.maxY - padding)
  };
}
