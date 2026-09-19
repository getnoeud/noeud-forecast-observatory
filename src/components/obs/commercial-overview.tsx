import Link from "next/link";
import { ArrowUpRightIcon, LandmarkIcon } from "lucide-react";

import { BankVsProviderSpark } from "@/components/charts/commercial-charts";
import { PairDot, StatusPill } from "@/components/obs/badges";
import { EmptyState, SectionHeading } from "@/components/obs/primitives";
import { Card, CardContent } from "@/components/ui/card";
import { pctDiff } from "@/lib/commercial";
import { formatDate, formatPercent, formatRate } from "@/lib/format";
import type { CommercialComparison } from "@/lib/server/queries";
import { PAIR_LABELS, PAIRS } from "@/lib/types";

/**
 * The overview's view of the commercial market: for each pair, what banks
 * published most recently beside the provider rate the models use, and how
 * that gap has moved since collection began.
 */
export function CommercialOverview({
  comparisons,
  series,
}: {
  comparisons: CommercialComparison[];
  series: Record<string, { observed_on: string; rate: number }[]>;
}) {
  const days = new Set(comparisons.map((row) => row.observed_on)).size;

  return (
    <section className="space-y-3">
      <SectionHeading
        title="Commercial bank rates"
        description={`Cross-bank mean transfer-selling rate (Absa, Stanbic, FNB) against the provider rate every model is trained on. Collected weekdays at 12:00 Africa/Accra${days ? ` · ${days} publication date${days === 1 ? "" : "s"} so far` : ""}.`}
        actions={
          <Link
            href="/commercial"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Full commercial view
            <ArrowUpRightIcon className="size-3" />
          </Link>
        }
      />

      {!comparisons.length ? (
        <EmptyState
          title="No bank quotes archived yet"
          description="The weekday midday cycle collects the bank rate cards. The first comparison appears after its first successful run."
          icon={<LandmarkIcon className="size-5" />}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {PAIRS.map((pair) => {
            const rows = comparisons
              .filter((row) => row.pair === pair)
              .sort((a, b) => a.observed_on.localeCompare(b.observed_on));
            const latest = rows.at(-1) ?? null;
            const spread = latest
              ? pctDiff(latest.mean_transfer_selling_rate, latest.exchange_rate_api_rate)
              : null;
            return (
              <Card key={pair} className="gap-0 py-0">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <PairDot pair={pair} />
                      {PAIR_LABELS[pair]}
                    </span>
                    {latest ? (
                      latest.benchmark_eligible ? (
                        <StatusPill tone="good" label={`${latest.bank_count} banks`} />
                      ) : (
                        <StatusPill tone="warning" label={`${latest.bank_count} bank`} />
                      )
                    ) : null}
                  </div>

                  <dl className="grid grid-cols-3 gap-3">
                    <div>
                      <dt className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                        Bank mean
                      </dt>
                      <dd className="tnum mt-0.5 font-mono text-sm font-semibold text-[var(--chart-1)]">
                        {formatRate(latest?.mean_transfer_selling_rate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                        Provider
                      </dt>
                      <dd className="tnum mt-0.5 font-mono text-sm">
                        {formatRate(latest?.exchange_rate_api_rate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                        Spread
                      </dt>
                      <dd className="tnum mt-0.5 font-mono text-sm">
                        {formatPercent(spread, 2, true)}
                      </dd>
                    </div>
                  </dl>

                  <ul className="flex items-center gap-4 text-[0.7rem] text-muted-foreground">
                    <li className="flex items-center gap-1.5">
                      <span aria-hidden className="h-0.5 w-4 rounded-full bg-foreground" />
                      Provider
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span aria-hidden className="size-2 rounded-full bg-[var(--chart-1)]" />
                      Bank mean
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="h-2.5 w-3.5 rounded-[2px] bg-[var(--chart-1)] opacity-30"
                      />
                      Bank range
                    </li>
                  </ul>

                  <BankVsProviderSpark
                    pair={pair}
                    provider={(series[pair] ?? []).map((point) => ({
                      date: point.observed_on,
                      rate: point.rate,
                    }))}
                    bank={rows.map((row) => ({
                      date: row.observed_on,
                      mean: row.mean_transfer_selling_rate,
                      min: row.min_transfer_selling_rate,
                      max: row.max_transfer_selling_rate,
                      bankCount: row.bank_count,
                    }))}
                  />

                  <p className="text-[0.7rem] text-muted-foreground">
                    Range {formatRate(latest?.min_transfer_selling_rate)} –{" "}
                    {formatRate(latest?.max_transfer_selling_rate)} ·{" "}
                    {latest ? formatDate(latest.observed_on) : "—"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
