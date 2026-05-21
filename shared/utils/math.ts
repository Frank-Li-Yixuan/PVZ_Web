import { MapConfigV01 } from "../config/mapConfig";
import type { GridCell, Vector2 } from "../types/entities";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function distanceSquared(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function normalizeVector(vector: Vector2): Vector2 {
  const length = Math.hypot(vector.x, vector.y);
  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: vector.x / length,
    y: vector.y / length
  };
}

export function isLaneIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < MapConfigV01.laneCount;
}

export function isColumnIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < MapConfigV01.plantableColumnCount;
}

export function isGridCellInBounds(cell: GridCell): boolean {
  return isLaneIndex(cell.laneIndex) && isColumnIndex(cell.columnIndex);
}
