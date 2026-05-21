export const PROJECT_NAME = "Sprout & Steel";
export const PROJECT_VERSION = "0.1.0";

export const Phase0RuntimeConfig = {
  clientPort: 5173,
  serverPort: 3001,
  serverHost: "127.0.0.1"
} as const;

export type HealthCheckPayload = {
  ok: true;
  service: string;
  version: string;
  phase: string;
};

export * from "../types/enums";
export * from "../types/entities";
export * from "../types/events";
export * from "../types/messages";
export * from "../types/network";
export * from "../types/state";
export * from "../config/combatNumbers";
export * from "../config/mapConfig";
export * from "../config/networkTiming";
export * from "../config/wavesV01";
export * from "../utils/id";
export * from "../utils/mapGeometry";
export * from "../utils/math";
