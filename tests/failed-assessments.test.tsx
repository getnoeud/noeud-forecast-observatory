import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AssessmentBadge } from "@/components/obs/badges";
import { PairCard } from "@/components/obs/pair-card";
import { assessmentBody, assessmentFailureReason, decisionMix } from "@/lib/intelligence";
import type { PairOverview } from "@/lib/server/views";
import { assessmentRow } from "./fixtures";

vi.mock("@/components/charts/overview-charts", () => ({ MiniFan: () => null }));

describe("failed assessment records", () => {
  it("renders the real null-body failure shape without losing the currency card", () => {
    const overview: PairOverview = {
      pair: "EURGHS",
      latest: {
        pair: "EURGHS", observed_on: "2026-10-04", rate: 12.5,
        source: "exchange_rate_api", fetched_at: "2026-10-04T05:00:00Z",
        provider_updated_at: null,
      },
      previousRate: 12.5, dayChangePct: 0,
      weekly: null, daily: null, publication: null,
      assessment: assessmentRow(true),
      weeklySummary: null, dailySummary: null, miniRows: [], adjustments: [],
    };
    const html = renderToStaticMarkup(<PairCard overview={overview} />);
    expect(html).toContain("12.5000");
    expect(html).toContain("Assessment failed");
    expect(html).toContain("independently verified dated evidence");
    expect(html).not.toContain(">Hold<");
  });

  it("keeps failed attempts separate from validated decisions in history summaries", () => {
    const counts = decisionMix([assessmentRow(), assessmentRow(true)]);
    expect(counts).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "hold", count: 1 }),
      expect.objectContaining({ label: "failed", count: 1 }),
    ]));
  });

  it("never uses a partial decision from a failed attempt", () => {
    const row = assessmentRow();
    row.status = "failed";
    expect(assessmentBody(row)).toBeNull();
    expect(assessmentBody(undefined)).toBeNull();
  });

  it("distinguishes failure from an expired successful view", () => {
    expect(renderToStaticMarkup(<AssessmentBadge assessment={assessmentRow(true)} showExpiry />))
      .toContain("Assessment failed");
    expect(renderToStaticMarkup(<AssessmentBadge assessment={assessmentRow()} showExpiry />))
      .toContain("Expired");
    expect(renderToStaticMarkup(<AssessmentBadge assessment={assessmentRow()} />))
      .toContain("Hold");
  });

  it("formats both structured validation messages and older string records", () => {
    const row = assessmentRow(true);
    row.record.validation_errors.push("Legacy validation failure");
    expect(assessmentFailureReason(row)).toContain("dated evidence; Legacy validation failure");
    row.record.validation_errors = [];
    expect(assessmentFailureReason(row)).toBe("invalid_structured_output_or_evidence");
  });
});
