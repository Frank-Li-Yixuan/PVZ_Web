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
  phase: "phase-0";
};
