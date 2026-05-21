export type EntityIdPrefix = "player" | "plant" | "enemy" | "bullet" | "boss" | "event" | "match" | "room" | "request";

export function createEntityId(prefix: EntityIdPrefix, sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 0) {
    throw new Error("Entity id sequence must be a non-negative integer.");
  }

  return `${prefix}_${sequence}`;
}

export function createRequestId(sequence: number): string {
  return createEntityId("request", sequence);
}
