export const MATCH_STATES = [
  "LOBBY",
  "COUNTDOWN",
  "WAVE_PREP",
  "WAVE_ACTIVE",
  "WAVE_CLEAR",
  "BOSS_PREP",
  "BOSS_ACTIVE",
  "VICTORY",
  "DEFEAT"
] as const;

export type MatchState = (typeof MATCH_STATES)[number];

export const ROOM_STATES = ["OPEN", "FULL", "COUNTDOWN", "IN_MATCH", "ENDED", "CLOSED"] as const;
export type RoomState = (typeof ROOM_STATES)[number];

export const PLAYER_SLOTS = [0, 1] as const;
export type PlayerSlot = (typeof PLAYER_SLOTS)[number];

export const PLANT_TYPES = ["sunbloom", "peashotter", "barkwall"] as const;
export type PlantType = (typeof PLANT_TYPES)[number];

export const ENEMY_TYPES = ["shambler", "runner", "brute"] as const;
export type EnemyType = (typeof ENEMY_TYPES)[number];

export const EVOLUTION_PATHS = ["firepower", "control", "support"] as const;
export type EvolutionPath = (typeof EVOLUTION_PATHS)[number];

export const PROJECTILE_TYPES = ["hero_bullet", "pea_projectile"] as const;
export type ProjectileType = (typeof PROJECTILE_TYPES)[number];

export const ENEMY_RUNTIME_STATES = ["MOVING", "ATTACKING_PLANT", "DEAD"] as const;
export type EnemyRuntimeState = (typeof ENEMY_RUNTIME_STATES)[number];

export const ACTION_NAMES = ["shoot", "reload", "plant", "buyAmmo", "evolve", "ready"] as const;
export type ActionName = (typeof ACTION_NAMES)[number];

export const ACTION_REJECT_REASONS = [
  "NOT_IN_VALID_MATCH_STATE",
  "PLAYER_DEAD",
  "NOT_ENOUGH_SUN",
  "OUT_OF_RANGE",
  "CELL_OCCUPIED",
  "CELL_NOT_PLANTABLE",
  "ENEMY_BLOCKING_CELL",
  "AMMO_EMPTY",
  "RESERVE_AMMO_EMPTY",
  "RELOADING",
  "FIRE_RATE_LIMITED",
  "AMMO_PURCHASE_COOLDOWN",
  "RESERVE_AMMO_FULL",
  "EVOLUTION_NOT_UNLOCKED",
  "ALREADY_EVOLVED",
  "INVALID_EVOLUTION_PATH",
  "ROOM_NOT_READY",
  "UNKNOWN_ERROR"
] as const;

export type ActionRejectReason = (typeof ACTION_REJECT_REASONS)[number];

export const BOSS_TYPES = ["ironmaw_siege_beast"] as const;
export type BossType = (typeof BOSS_TYPES)[number];

export const BOSS_SKILLS = [
  "hammer_slam",
  "summon_minions",
  "weakpoint_expose",
  "charge_windup",
  "charge_dash",
  "sun_suppression"
] as const;

export type BossSkill = (typeof BOSS_SKILLS)[number];

export const FEEDBACK_EVENT_TYPES = [
  "hero.shoot",
  "hero.reloadStart",
  "hero.reloadComplete",
  "hero.dryFire",
  "hero.evolved",
  "plant.placed",
  "plant.destroyed",
  "sun.gained",
  "enemy.spawned",
  "enemy.hit",
  "enemy.killed",
  "base.damaged",
  "wave.started",
  "boss.spawned",
  "boss.phaseChanged",
  "boss.weakPointExposed",
  "boss.chargeStarted",
  "boss.interrupted",
  "boss.chargeFailed",
  "match.victory",
  "match.defeat"
] as const;

export type FeedbackEventType = (typeof FEEDBACK_EVENT_TYPES)[number];
