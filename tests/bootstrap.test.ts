import { describe, expect, test } from "vitest";
import { Phase0RuntimeConfig, PROJECT_NAME, PROJECT_VERSION } from "../shared/src";

describe("Phase 0 shared foundation", () => {
  test("exposes project identity and runtime defaults", () => {
    expect(PROJECT_NAME).toBe("Sprout & Steel");
    expect(PROJECT_VERSION).toBe("0.1.0");
    expect(Phase0RuntimeConfig.clientPort).toBe(5173);
    expect(Phase0RuntimeConfig.serverPort).toBe(3001);
  });
});
