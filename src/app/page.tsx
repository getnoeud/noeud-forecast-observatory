import Link from "next/link";
import {
  ActivityIcon,
  BrainCircuitIcon,
  CalendarClockIcon,
  LineChartIcon,
} from "lucide-react";

import { ForwardOutlookChart, type DriftRow } from "@/components/charts/overview-charts";
import { IndexedHistoryChart } from "@/components/charts/market-charts";
import { buildMultiSeries } from "@/lib/analytics";
import { DataSourceError } from "@/components/obs/db-error";
import { CommercialOverview } from "@/components/obs/commercial-overview";
import { PairCard } from "@/components/obs/pair-card";
import { PaginatedTable } from "@/components/obs/paginated-table";
import {
  ModeBadge,
  PairBadge,
  RunStateBadge,
  StatusPill,
} from "@/components/obs/badges";
import {
  EmptyState,
  PageHeader,
  ReadingNote,
  SectionHeading,
  StatTile,
} from "@/components/obs/primitives";
import { Card, CardContent } from "@/components/ui/card";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import {
  formatDate,
  formatDateTime,
  formatInteger,
  formatPercent,
  formatRelative,
  shortHash,
} from "@/lib/format";
import { getOverview } from "@/lib/server/views";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  let model;
  try {
    model = await getOverview();
  } catch (error) {
    return (
      <>
        <PageHeader
          eyebrow="Noeud FX Forecast Intelligence"
          title="Observatory overview"
        />
        <DataSourceError error={error} />
      </>
    );
  }

  const { pairs, coverage, publications, latestRun, runs } = model;

  const driftRows: DriftRow[] = [];
  for (let horizon = 1; horizon <= 30; horizon += 1) {
    const row: DriftRow = { horizon, target_date: "" };
    for (const entry of pairs) {
      const point = entry.weekly?.points.find((item) => item.horizon === horizon);
      const spot = entry.latest?.rate;
      if (point && spot) {
        row[entry.pair] = ((point.q50 - spot) / spot) * 100;
        row.target_date = point.target_date;
      }
    }
    if (row.target_date) driftRows.push(row);
  }

  const historyRows = buildMultiSeries(
    Object.fromEntries(
      Object.entries(model.series).map(([pair, series]) => [pair, series.slice(-180)]),
    ),
    (value, first) => ((value - first) / first) * 100,
  );

  const observedDays = coverage[0]?.observed_days ?? 0;
  const continuous = coverage.every((row) => row.observed_days === row.span_days);
  const decisions = pairs
    .map((entry) => entry.assessment?.record.assessment.decision)
    .filter(Boolean) as string[];
  const shadowCount = publications.filter((item) => item.mode === "shadow").length;
  const adjustedPoints = publications.reduce((sum, item) => sum + item.adjusted_points, 0);

  return (
    <>
      <PageHeader
        eyebrow="Noeud FX Forecast Intelligence"
        title="Observatory overview"
        description="Everything the daily pipeline produced for USD/GHS, EUR/GHS and GBP/GHS: the live 30-day probabilistic paths, the event-intelligence decision behind each one, and the ledgers that make both auditable."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Last pipeline cycle"
          value={latestRun ? formatRelative(latestRun.completed_at ?? latestRun.started_at) : "—"}
          hint={
            latestRun ? (
              <span className="flex items-center gap-1.5">
                <RunStateBadge state={latestRun.state} />
                <span className="font-mono">{latestRun.deployment_name}</span>
              </span>
            ) : (
              "No pipeline run recorded"
            )
          }
          accent="var(--chart-1)"
        />
        <StatTile
          label="Observation coverage"
          value={formatInteger(observedDays)}
          unit="days × 3 pairs"
          hint={
            continuous ? (
              <StatusPill tone="good" label="Continuous calendar coverage" />
            ) : (
              <StatusPill tone="warning" label="Gaps detected in the calendar" />
            )
          }
          accent="var(--chart-3)"
        />
        <StatTile
          label="Live forecast paths"
          value={pairs.filter((entry) => entry.weekly).length * 2}
          unit="vintages"
          hint="One weekly Chronos-2 path and one daily bootstrap path per pair, each covering days 1–30."
          accent="var(--chart-7)"
        />
        <StatTile
          label="Event decisions today"
          value={decisions.length ? decisions.filter((d) => d !== "hold").length : 0}
          unit={`of ${decisions.length || 3} non-hold`}
          hint={`${shadowCount} shadow snapshot${shadowCount === 1 ? "" : "s"} published · ${adjustedPoints} event-adjusted point${adjustedPoints === 1 ? "" : "s"}`}
          accent="var(--chart-2)"
        />
      </section>

      <section className="space-y-3">
        <SectionHeading
          title="Pairs"
          description="Latest observed rate, the forward path the Monday Chronos vintage implies, and where event intelligence landed."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {pairs.map((entry) => (
            <PairCard key={entry.pair} overview={entry} />
          ))}
        </div>
      </section>

      <CommercialOverview comparisons={model.commercial} series={model.series} />

      <section className="grid gap-4 xl:grid-cols-2">
        {driftRows.length ? (
          <ForwardOutlookChart rows={driftRows} />
        ) : (
          <EmptyState
            title="No forward path available"
            description="No weekly Chronos vintage is currently pointed to for any pair."
            icon={<LineChartIcon className="size-5" />}
          />
        )}
        <IndexedHistoryChart
          rows={historyRows}
          title="Recent market context — last 180 days"
          description="Each pair indexed to 0% 180 days ago, so all three fit one axis."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card className="gap-4">
          <CardContent className="space-y-4">
            <SectionHeading
              title="Latest publication snapshots"
              description="The append-only selected-rate paths the pipeline materialised for each pair."
            />
            {publications.length ? (
              <PaginatedTable
                pageSize={10}
                label="snapshots"
                header={
                  <TableRow>
                    <TableHead>Pair</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Adjusted</TableHead>
                    <TableHead className="text-right">Max |Δ|</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                }
                rows={publications.map((item) => (
                  <TableRow key={item.snapshot_id}>
                    <TableCell>
                      <PairBadge pair={item.pair} />
                    </TableCell>
                    <TableCell>
                      <ModeBadge mode={item.mode} />
                    </TableCell>
                    <TableCell className="tnum text-right font-mono text-xs">
                      {item.point_count}
                    </TableCell>
                    <TableCell className="tnum text-right font-mono text-xs">
                      {item.adjusted_points}
                    </TableCell>
                    <TableCell className="tnum text-right font-mono text-xs">
                      {item.max_abs_delta_pct === null
                        ? "—"
                        : formatPercent(item.max_abs_delta_pct, 2)}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatRelative(item.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              />
            ) : (
              <EmptyState
                title="No publication snapshots yet"
                description="Snapshots appear once an event assessment has been materialised into a 30-point selected-rate path."
              />
            )}
            <ReadingNote>
              Policy{" "}
              <code className="font-mono text-[0.7rem]">
                {publications[0]?.policy_version ?? "—"}
              </code>
              . A snapshot in <strong>shadow</strong> mode is not a customer deliverable: it
              records what the bounded publication policy <em>would</em> have selected, so the
              policy can be reviewed against realised outcomes before anything is approved.
            </ReadingNote>
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardContent className="space-y-4">
            <SectionHeading
              title="Data coverage"
              description="Calendar-day continuity per pair, straight from the canonical observation view."
            />
            <div className="space-y-3">
              {coverage.map((row) => {
                const complete = row.observed_days === row.span_days;
                return (
                  <div key={row.pair} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <PairBadge pair={row.pair} />
                      <span className="tnum font-mono text-xs text-muted-foreground">
                        {formatInteger(row.observed_days)} / {formatInteger(row.span_days)} days
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (row.observed_days / row.span_days) * 100)}%`,
                          background: complete ? "var(--good)" : "var(--warning)",
                        }}
                      />
                    </div>
                    <p className="text-[0.7rem] text-muted-foreground">
                      {formatDate(row.first_date)} → {formatDate(row.last_date)} ·{" "}
                      {formatInteger(row.versions)} stored payload versions
                    </p>
                  </div>
                );
              })}
            </div>
            <ReadingNote>
              Chronos-2 is configured with a 2,048-day context, so continuity across this
              window is a precondition for issuance rather than a nice-to-have.
            </ReadingNote>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionHeading
          title="Recent pipeline runs"
          description="The dependency-ordered daily flow: ingest, issue, assess, publish."
          actions={
            <Link
              href="/operations"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Full operations view →
            </Link>
          }
        />
        <Card>
          <CardContent>
            {runs.length ? (
              <PaginatedTable
                pageSize={8}
                label="runs"
                header={
                  <TableRow>
                    <TableHead>Deployment</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Run key</TableHead>
                  </TableRow>
                }
                rows={runs.map((run) => (
                    <TableRow key={run.pipeline_run_id}>
                      <TableCell className="font-mono text-xs">{run.deployment_name}</TableCell>
                      <TableCell>
                        <RunStateBadge state={run.state} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(run.scheduled_for)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(run.started_at)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(run.completed_at)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {shortHash(run.run_key, 12)}
                      </TableCell>
                    </TableRow>
                ))}
              />
            ) : (
              <EmptyState
                title="No pipeline runs recorded"
                description="Prefect schedules stay paused until a manual database write/read cycle has passed its acceptance checks."
                icon={<CalendarClockIcon className="size-5" />}
              />
            )}
          </CardContent>
        </Card>
      </section>

      <nav className="grid gap-3 sm:grid-cols-3">
        {[
          {
            href: "/forecast",
            icon: LineChartIcon,
            title: "Forward Forecast",
            blurb: "Full quantile fan, interval growth, and the two model families side by side.",
          },
          {
            href: "/intelligence",
            icon: BrainCircuitIcon,
            title: "Event Intelligence",
            blurb: "The evidence the LLM retrieved, what it rejected, and the bounded decision it reached.",
          },
          {
            href: "/models",
            icon: ActivityIcon,
            title: "Model Lineage",
            blurb: "Vintage ledger, frozen model identity, and where promotion currently stands.",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl border bg-card p-4 transition-colors hover:border-ring/50 hover:bg-accent/40"
          >
            <item.icon className="mb-2 size-4 text-muted-foreground" />
            <p className="text-sm font-medium">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.blurb}</p>
          </Link>
        ))}
      </nav>
    </>
  );
}
