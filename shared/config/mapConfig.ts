export const MapConfigV01 = {
  worldUnit: "pixel",
  worldWidthPx: 960,
  worldHeightPx: 540,
  cellWidthPx: 96,
  laneHeightPx: 72,
  laneCount: 5,
  plantableColumnCount: 7,
  totalPlantableCells: 35,
  laneIndices: [0, 1, 2, 3, 4],
  columnIndices: [0, 1, 2, 3, 4, 5, 6],
  baseSide: "left",
  enemySpawnSide: "right",
  playerBounds: {
    minX: 64,
    maxX: 896,
    minY: 72,
    maxY: 468
  },
  plantGrid: {
    originX: 176,
    originY: 90
  },
  base: {
    centerX: 88,
    centerY: 270,
    width: 96,
    height: 360
  },
  enemySpawnMarker: {
    centerX: 912,
    centerY: 270,
    width: 40,
    height: 360
  },
  playerSpawns: [
    { x: 128, y: 198 },
    { x: 128, y: 342 }
  ]
} as const;

export type LaneIndex = (typeof MapConfigV01.laneIndices)[number];
export type ColumnIndex = (typeof MapConfigV01.columnIndices)[number];
