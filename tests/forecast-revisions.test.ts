import { describe, expect, it } from "vitest";
import { buildWalkForwardPoints, walkForwardWindow } from "../src/lib/analytics";
import type { ForecastPoint } from "../src/lib/types";

function point(rate: number): ForecastPoint {
  return {
    horizon: 1, target_date: "2026-10-07",
    q01: rate, q05: rate, q10: rate, q25: rate, q50: rate,
    q75: rate, q90: rate, q95: rate, q99: rate,
  };
}

describe("explicit forecast revisions", () => {
  it("uses the latest same-origin revision regardless of archive order", () => {
    const newest = { origin: "2026-10-06", revision: 2, points: [point(11.8)] };
    const older = { origin: "2026-10-06", revision: 1, points: [point(11.6)] };
    for (const paths of [[newest, older], [older, newest]]) {
      expect(buildWalkForwardPoints(paths)[0].q50).toBe(11.8);
      expect(walkForwardWindow(paths)[0].q50).toBe(11.8);
    }
  });

  it("prefers a later origin even when the earlier origin has a higher revision", () => {
    expect(buildWalkForwardPoints([
      { origin: "2026-10-05", revision: 5, points: [point(11.4)] },
      { origin: "2026-10-06", revision: 1, points: [point(11.8)] },
    ])[0].q50).toBe(11.8);
  });

  it("retains the origin filter for historical windows", () => {
    expect(walkForwardWindow([
      { origin: "2026-10-05", revision: 2, points: [point(11.4)] },
      { origin: "2026-10-06", revision: 1, points: [point(11.8)] },
    ], { asOf: "2026-10-05" })[0].q50).toBe(11.4);
  });
});
