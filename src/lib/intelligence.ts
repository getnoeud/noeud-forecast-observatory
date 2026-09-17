import type {
  EventAssessmentRecord,
  EventAssessmentRow,
  EvidenceItem,
  GatewayCall,
} from "@/lib/types";

export function callOf(record: EventAssessmentRecord, stage: string): GatewayCall | undefined {
  return record.calls.find((call) => call.stage === stage);
}

export type StageTotals = {
  pair: string;
  retrieval: number;
  analysis: number;
  total: number;
};

function stageTotals(
  rows: EventAssessmentRow[],
  pick: (call: GatewayCall | undefined) => number,
): StageTotals[] {
  return rows.map((row) => {
    const retrieval = pick(callOf(row.record, "retrieval"));
    const analysis = pick(callOf(row.record, "analysis"));
    return { pair: row.pair, retrieval, analysis, total: retrieval + analysis };
  });
}

export const costRows = (rows: EventAssessmentRow[]) =>
  stageTotals(rows, (call) => call?.cost_usd ?? 0);

export const latencyRows = (rows: EventAssessmentRow[]) =>
  stageTotals(rows, (call) => call?.latency_seconds ?? 0);

export const tokenRows = (rows: EventAssessmentRow[]) =>
  stageTotals(rows, (call) => (call?.prompt_tokens ?? 0) + (call?.completion_tokens ?? 0));

export function totalCost(rows: EventAssessmentRow[]): number {
  return rows.reduce(
    (sum, row) => sum + row.record.calls.reduce((s, call) => s + (call.cost_usd ?? 0), 0),
    0,
  );
}

export function totalLatency(row: EventAssessmentRow): number {
  return row.record.calls.reduce((sum, call) => sum + (call.latency_seconds ?? 0), 0);
}

/** Counts by an evidence field, ordered by frequency then label. */
export function countBy(
  evidence: EvidenceItem[],
  key: (item: EvidenceItem) => string,
): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of evidence) {
    const label = key(item) || "unspecified";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export const DECISION_COLORS: Record<string, string> = {
  hold: "var(--good)",
  monitor: "var(--warning)",
  review_adjustment: "var(--serious)",
};

export function decisionMix(rows: EventAssessmentRow[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const decision = row.record.assessment.decision;
    counts.set(decision, (counts.get(decision) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      color: DECISION_COLORS[label] ?? "var(--muted-foreground)",
    }))
    .sort((a, b) => b.count - a.count);
}

/** The five axes used by the evidence-composition radar. */
export function evidenceProfile(evidence: EvidenceItem[]) {
  return [
    { axis: "Accepted", value: evidence.length },
    {
      axis: "High relevance",
      value: evidence.filter((item) => item.relevance === "high").length,
    },
    {
      axis: "Official source",
      value: evidence.filter((item) => item.source_type === "official_release").length,
    },
    {
      axis: "Verified",
      value: evidence.filter((item) => item.source_verification?.status === "verified").length,
    },
    {
      axis: "Cedi-negative",
      value: evidence.filter((item) => item.sentiment === "cedi_negative").length,
    },
  ];
}

/** `outside_news_window:https://…` → a readable reason and its URL. */
export function parseRejection(raw: string): { reason: string; url: string } {
  const separator = raw.indexOf(":http");
  if (separator === -1) return { reason: raw, url: "" };
  return { reason: raw.slice(0, separator), url: raw.slice(separator + 1) };
}

export function assessmentAgeHours(row: EventAssessmentRow, now = Date.now()): number {
  return (now - new Date(row.created_at).getTime()) / 3_600_000;
}

export function isExpired(row: EventAssessmentRow, now = Date.now()): boolean {
  return new Date(row.expires_at).getTime() < now;
}
