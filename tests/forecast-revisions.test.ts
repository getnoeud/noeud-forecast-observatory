import { describe, expect, it } from "vitest";
import { buildFanRows, buildTrackRows, buildWalkForwardPoints, walkForwardWindow } from "../src/lib/analytics";
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

  it("matches both model fans date-for-date, including all 30 medians and bounds", () => {
    const fullPath = (rate: number) => Array.from({ length: 30 }, (_, index) => {
      const date = new Date(Date.UTC(2026, 9, 7 + index)).toISOString().slice(0, 10);
      const median = rate + index / 100;
      return {
        ...point(median), horizon: index + 1, target_date: date,
        q01: median - 0.7, q05: median - 0.5, q10: median - 0.3, q25: median - 0.1,
        q75: median + 0.2, q90: median + 0.6, q95: median + 0.9, q99: median + 1.2,
      };
    });
    const paths = [
      { kind: "weekly_chronos" as const, origin: "2026-10-06", revision: 2, points: fullPath(11.8) },
      { kind: "weekly_chronos" as const, origin: "2026-10-06", revision: 1, points: fullPath(12.1) },
      { kind: "daily_bootstrap" as const, origin: "2026-10-06", revision: 2, points: fullPath(11.9) },
      { kind: "daily_bootstrap" as const, origin: "2026-10-06", revision: 1, points: fullPath(11.5) },
    ];
    for (const ordering of [paths, [...paths].reverse()]) {
      const history = [{ observed_on: "2026-10-07", rate: 11.85 }];
      const track = buildTrackRows(history, ordering);
      expect(track).toHaveLength(30);
      for (const kind of ["weekly_chronos", "daily_bootstrap"] as const) {
        const fan = buildFanRows(history, buildWalkForwardPoints(ordering.filter(p => p.kind === kind)));
        for (const row of fan) {
          const compared = track.find(t => t.date === row.date)!;
          const weekly = kind === "weekly_chronos";
          expect(weekly ? compared.chronos : compared.bootstrap).toBe(row.median);
          expect(weekly ? compared.chronosBand : compared.bootstrapBand).toEqual([row.q05, row.q95]);
          expect(weekly ? compared.chronosOrigin : compared.bootstrapOrigin).toBe("2026-10-06");
          expect(weekly ? compared.chronosHorizon : compared.bootstrapHorizon).toBe(row.horizon);
          expect(compared.actual).toBe(row.actual);
        }
      }
    }
  });

  it("prefers later origins over earlier high revisions in the comparison chart", () => {
    const rows = buildTrackRows([], [
      { kind: "weekly_chronos", origin: "2026-10-05", revision: 5, points: [point(11.4)] },
      { kind: "weekly_chronos", origin: "2026-10-06", revision: 1, points: [point(11.8)] },
    ]);
    expect(rows[0].chronos).toBe(11.8);
    expect(rows[0].bootstrap).toBeNull();
  });
});
