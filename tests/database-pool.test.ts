import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { pool } from "@/lib/server/db";

afterEach(async () => {
  const globals = globalThis as typeof globalThis & {
    noeudObservatoryPool?: ReturnType<typeof pool>;
    noeudObservatoryPoolOwner?: object;
  };
  await globals.noeudObservatoryPool?.end();
  delete globals.noeudObservatoryPool;
  delete globals.noeudObservatoryPoolOwner;
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("background database disconnects", () => {
  it("handles idle-client errors without crashing or logging credentials", () => {
    vi.stubEnv("OBSERVATORY_DATABASE_URL", "postgresql://test:secret-password@localhost/postgres");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const current = pool();
    const error = Object.assign(new Error("connection failed: secret-password"), { code: "57P01" });
    expect(() => current.emit("error", error)).not.toThrow();
    expect(log).toHaveBeenCalledWith("[observatory] Idle database connection failed", { code: "57P01" });
    expect(JSON.stringify(log.mock.calls)).not.toContain("secret-password");
    expect(pool()).toBe(current);
  });
});
