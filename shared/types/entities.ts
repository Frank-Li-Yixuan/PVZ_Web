import type {
  BossSkill,
  BossType,
  EnemyRuntimeState,
  EnemyType,
  EvolutionPath,
  PlayerSlot,
  PlantType,
  ProjectileType
} from "./enums";

export type MatchId = string;
export type PlayerId = string;
export type EntityId = string;
export type RequestId = string;

export type Vector2 = {
  x: number;
  y: number;
};

export type GridCell = {
  laneIndex: number;
  columnIndex: number;
};

export type PlayerLiveStats = {
  shotsFired: number;
  shotsHit: number;
  plantsPlaced: number;
  sunSpent: number;
  ammoPurchased: number;
  damageDealt: number;
  damageTaken: number;
  deaths: number;
  enemiesKilled: number;
  bossInterrupts: number;
};

export type PlayerState = {
  playerId: PlayerId;
  slot: PlayerSlot;
  name: string;
  connected: boolean;
  x: number;
  y: number;
  aimX: number;
  aimY: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  respawnRemainingSeconds?: number;
  invulnerableRemainingSeconds?: number;
  ammoInMagazine: number;
  magazineSize: number;
  reserveAmmo: number;
  maxReserveAmmo: number;
  reloading: boolean;
  reloadRemainingSeconds?: number;
  ammoPurchaseCooldownRemainingSeconds: number;
  evolutionPath?: EvolutionPath;
  hasEvolved: boolean;
  stats: Partial<PlayerLiveStats>;
};

export type PlantState = {
  id: EntityId;
  type: PlantType;
  laneIndex: number;
  columnIndex: number;
  hp: number;
  maxHp: number;
  shield?: number;
  alive: boolean;
  cooldownRemainingSeconds?: number;
};

export type EnemyState = {
  id: EntityId;
  type: EnemyType;
  laneIndex: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  state: EnemyRuntimeState;
  targetPlantId?: EntityId;
  slowed?: boolean;
  slowRemainingSeconds?: number;
};

export type BulletState = {
  id: EntityId;
  ownerPlayerId?: PlayerId;
  ownerPlantId?: EntityId;
  type: ProjectileType;
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  speed: number;
  remainingLifetimeSeconds: number;
};

export type BossState = {
  id: EntityId;
  bossType: BossType;
  x: number;
  y: number;
  laneIndex: number;
  hp: number;
  maxHp: number;
  phase: 1 | 2;
  weakPointActive: boolean;
  weakPointX?: number;
  weakPointY?: number;
  weakPointRemainingSeconds?: number;
  currentSkill?: BossSkill;
  skillRemainingSeconds?: number;
  charging: boolean;
  interruptProgress: number;
  interruptRequired: number;
};
