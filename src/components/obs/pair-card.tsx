import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";

import { MiniFan } from "@/components/charts/overview-charts";
import { DecisionBadge, PairDot } from "@/components/obs/badges";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatPercent, formatRate } from "@/lib/format";
import type { PairOverview } from "@/lib/server/views";
import { PAIR_BASE_LABELS, PAIR_LABELS } from "@/lib/types";

export function PairCard({ overview }: { overview: PairOverview }) {
  const { pair, latest, dayChangePct, weeklySummary, assessment } = overview;
  const decision = assessment?.record.assessment.decision;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex items-start justify-between gap-3 px-4 pt-4">
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <PairDot pair={pair} />
              {PAIR_LABELS[pair]}
            </p>
            <p className="tnum font-display text-2xl leading-none font-semibold">
              {formatRate(latest?.rate)}
            </p>
            <p className="text-xs text-muted-foreground">
              {dayChangePct === null ? (
                "No prior observation"
              ) : (
                <>
                  <span
                    className="tnum font-medium"
                    style={{
                      color:
                        dayChangePct > 0
                          ? "var(--chart-8)"
                          : dayChangePct < 0
                            ? "var(--chart-3)"
                            : "var(--muted-foreground)",
                    }}
                  >
                    {formatPercent(dayChangePct, 2, true)}
                  </span>{" "}
                  day on day · {formatDate(latest?.observed_on)}
                </>
              )}
            </p>
          </div>
          <Link
            href={`/forecast?pair=${pair}`}
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Forecast
            <ArrowUpRightIcon className="size-3" />
          </Link>
        </div>

        <MiniFan rows={overview.miniRows} pair={pair} height={132} />

        <dl className="grid grid-cols-3 gap-px border-t bg-border">
          <div className="bg-card px-3 py-2.5">
            <dt className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">
              Day 30 median
            </dt>
            <dd className="tnum mt-0.5 font-mono text-sm font-medium">
              {formatRate(weeklySummary?.medianEnd)}
            </dd>
          </div>
          <div className="bg-card px-3 py-2.5">
            <dt className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">
              Drift vs spot
            </dt>
            <dd
              className="tnum mt-0.5 font-mono text-sm font-medium"
              style={{
                color:
                  (weeklySummary?.anchorDriftPct ?? 0) > 0
                    ? "var(--chart-8)"
                    : (weeklySummary?.anchorDriftPct ?? 0) < 0
                      ? "var(--chart-3)"
                      : undefined,
              }}
            >
              {formatPercent(weeklySummary?.anchorDriftPct, 2, true)}
            </dd>
          </div>
          <div className="bg-card px-3 py-2.5">
            <dt className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">
              Day 30 band
            </dt>
            <dd className="tnum mt-0.5 font-mono text-sm font-medium">
              {formatPercent(weeklySummary?.widthEnd, 1)}
            </dd>
          </div>
        </dl>

        <div className="flex items-center justify-between gap-2 border-t px-4 py-2.5">
          <span className="text-xs text-muted-foreground">
            {PAIR_BASE_LABELS[pair]} event view
          </span>
          {decision ? (
            <DecisionBadge decision={decision} />
          ) : (
            <span className="text-xs text-muted-foreground">No assessment</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
