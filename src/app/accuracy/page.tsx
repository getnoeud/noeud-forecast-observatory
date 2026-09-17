import { TargetIcon } from "lucide-react";

import {
  CalibrationScatter,
  CoverageChart,
  ErrorByCohortChart,
  RealisedErrorChart,
  type CohortRow,
} from "@/components/charts/accuracy-charts";
import { MonoTag, PairBadge, StatusPill } from "@/components/obs/badges";
import { DataSourceError } from "@/components/obs/db-error";
import { SegmentedParam } from "@/components/obs/pair-switcher";
import { PaginatedTable } from "@/components/obs/paginated-table";
import {
  EmptyState,
  PageHeader,
  ReadingNote,
  SectionHeading,
  StatTile,
} from "@/components/obs/primitives";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HORIZON_COHORTS, cohortOf } from "@/lib/analytics";
import {
  formatDate,
  formatDateTime,
  formatInteger,
  formatPercent,
  formatRate,
  formatSignedRate,
} from "@/lib/format";
import { getMaturedEvaluations, getRealizedPoints } from "@/lib/server/queries";
import { FORECAST_KIND_LABELS, PAIRS, type ForecastKind } from "@/lib/types";

export const dynamic = "force-dynamic";

const FAMILIES = [
  { value: "weekly_chronos", label: "Weekly Chronos-2" },
  { value: "daily_bootstrap", label: "Daily bootstrap" },
];

export default async function AccuracyPage({
  searchParams,
}: {
  searchParams: Promise<{ family?: string }>;
}) {
  const params = await searchParams;
  const family = (FAMILIES.some((option) => option.value === params.family)
    ? params.family
    : "weekly_chronos") as ForecastKind;

  let realized;
  let matured;
  try {
    [realized, matured] = await Promise.all([
      getRealizedPoints(4000),
      getMaturedEvaluations(2000),
    ]);
  } catch (error) {
    return (
      <>
        <PageHeader eyebrow="Evaluation" title="Forecast Accuracy" />
        <DataSourceError error={error} />
      </>
    );
  }

  const rows = realized.filter((row) => row.kind === family);

  const overall = rows.length
    ? {
        count: rows.length,
        mape: rows.reduce((sum, row) => sum + row.absolute_percentage_error, 0) / rows.length,
        mae: rows.reduce((sum, row) => sum + Math.abs(row.signed_error), 0) / rows.length,
        bias: rows.reduce((sum, row) => sum + row.signed_error, 0) / rows.length,
        coverage: (rows.filter((row) => row.inside_90).length / rows.length) * 100,
        maxHorizon: Math.max(...rows.map((row) => row.horizon)),
      }
    : null;

  /** Build one chart row per cohort, with a column per pair. */
  function cohortRows(
    value: (subset: typeof rows) => number,
  ): CohortRow[] {
    return HORIZON_COHORTS.map((cohort) => {
      const row: CohortRow = { label: cohort.label };
      for (const pair of PAIRS) {
        const subset = rows.filter(
          (item) => item.pair === pair && cohortOf(item.horizon) === cohort.key,
        );
        if (subset.length) {
          row[pair] = value(subset);
          row[`${pair}_n`] = subset.length;
        }
      }
      return row;
    }).filter((row) => PAIRS.some((pair) => row[pair] !== undefined));
  }

  const mapeRows = cohortRows(
    (subset) =>
      subset.reduce((sum, item) => sum + item.absolute_percentage_error, 0) / subset.length,
  );
  const coverageRows = cohortRows(
    (subset) => (subset.filter((item) => item.inside_90).length / subset.length) * 100,
  );
  const biasRows = cohortRows(
    (subset) => subset.reduce((sum, item) => sum + item.signed_error, 0) / subset.length,
  );

  const perPair = PAIRS.map((pair) => {
    const subset = rows.filter((row) => row.pair === pair);
    return {
      pair,
      count: subset.length,
      mape: subset.length
        ? subset.reduce((sum, row) => sum + row.absolute_percentage_error, 0) / subset.length
        : null,
      bias: subset.length
        ? subset.reduce((sum, row) => sum + row.signed_error, 0) / subset.length
        : null,
      coverage: subset.length
        ? (subset.filter((row) => row.inside_90).length / subset.length) * 100
        : null,
      worst: subset.length
        ? subset.reduce((worst, row) =>
            row.absolute_percentage_error > worst.absolute_percentage_error ? row : worst,
          )
        : null,
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Evaluation"
        title="Forecast Accuracy"
        description="Forecast points whose target date has already been observed, scored against the canonical rate. This is the experiment's running score — it accumulates for as long as the pipeline keeps issuing."
        actions={
          <SegmentedParam
            param="family"
            value={family}
            options={FAMILIES}
            label="Model family"
          />
        }
      />

      {!rows.length ? (
        <EmptyState
          title="No target dates have matured yet for this family"
          description="A forecast point becomes scoreable only once an observation exists for its target date. The first row appears one day after issuance."
          icon={<TargetIcon className="size-5" />}
        />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Matured points"
              value={formatInteger(overall?.count)}
              hint={`Up to horizon ${overall?.maxHorizon} · ${FORECAST_KIND_LABELS[family]}`}
              accent="var(--chart-1)"
            />
            <StatTile
              label="Mean absolute error"
              value={formatPercent(overall?.mape, 3)}
              hint={`${formatRate(overall?.mae)} in rate terms`}
              accent="var(--chart-2)"
            />
            <StatTile
              label="Signed bias"
              value={formatSignedRate(overall?.bias)}
              hint={
                (overall?.bias ?? 0) > 0
                  ? "Medians sat above the realised rate — the model over-predicted cedi weakness"
                  : "Medians sat below the realised rate — the model under-predicted cedi weakness"
              }
              accent="var(--chart-7)"
            />
            <StatTile
              label="90% coverage"
              value={formatPercent(overall?.coverage, 0)}
              hint={
                overall && overall.count < 30 ? (
                  <StatusPill
                    tone="warning"
                    label={`Only ${overall.count} points — not yet meaningful`}
                  />
                ) : (
                  "Share of realised rates inside q05–q95"
                )
              }
              accent="var(--chart-3)"
            />
          </section>

          <ReadingNote>
            Coverage and bias need a reasonable number of matured dates before they mean
            anything. With a handful of points, a single large move dominates every statistic on
            this page. The release gate&apos;s own thresholds are evaluated on a frozen holdout,
            not on this running tally.
          </ReadingNote>

          <section className="grid gap-4 xl:grid-cols-2">
            <ErrorByCohortChart rows={mapeRows} />
            <CoverageChart rows={coverageRows} />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <ErrorByCohortChart
              rows={biasRows}
              title="Signed bias by horizon cohort"
              description="Mean of (median − realised). Positive means the median sat above the rate that actually printed."
              unit=""
            />
            <CalibrationScatter rows={rows} />
          </section>

          <RealisedErrorChart rows={rows} />

          <section className="space-y-3">
            <SectionHeading
              title="Per-pair summary"
              description="Pair-level stability is a separate gate dimension: a large failure on one pair must not be averaged away by the other two."
            />
            <Card>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pair</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-right">MAPE</TableHead>
                      <TableHead className="text-right">Bias</TableHead>
                      <TableHead className="text-right">90% coverage</TableHead>
                      <TableHead>Worst miss</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perPair.map((row) => (
                      <TableRow key={row.pair}>
                        <TableCell>
                          <PairBadge pair={row.pair} />
                        </TableCell>
                        <TableCell className="tnum text-right font-mono text-xs">
                          {row.count}
                        </TableCell>
                        <TableCell className="tnum text-right font-mono text-xs">
                          {formatPercent(row.mape, 3)}
                        </TableCell>
                        <TableCell className="tnum text-right font-mono text-xs">
                          {formatSignedRate(row.bias)}
                        </TableCell>
                        <TableCell className="tnum text-right font-mono text-xs">
                          {formatPercent(row.coverage, 0)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.worst ? (
                            <>
                              {formatPercent(row.worst.absolute_percentage_error, 2)} on{" "}
                              {formatDate(row.worst.target_date)} (day {row.worst.horizon})
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3">
            <SectionHeading
              title="Matured points"
              description="Every scoreable forecast point in this family, newest target date first."
            />
            <Card>
              <CardContent>
                <PaginatedTable
                  pageSize={15}
                  label="matured points"
                  header={
                    <TableRow>
                      <TableHead>Target date</TableHead>
                      <TableHead>Pair</TableHead>
                      <TableHead className="text-right">Day</TableHead>
                      <TableHead className="text-right">q05</TableHead>
                      <TableHead className="text-right">Median</TableHead>
                      <TableHead className="text-right">q95</TableHead>
                      <TableHead className="text-right">Observed</TableHead>
                      <TableHead className="text-right">Error</TableHead>
                      <TableHead>Inside 90%</TableHead>
                    </TableRow>
                  }
                  rows={rows.map((row) => (
                      <TableRow key={`${row.forecast_id}-${row.horizon}`}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDate(row.target_date)}
                        </TableCell>
                        <TableCell>
                          <PairBadge pair={row.pair} />
                        </TableCell>
                        <TableCell className="tnum text-right font-mono text-xs">
                          {row.horizon}
                        </TableCell>
                        <TableCell className="tnum text-right font-mono text-xs text-muted-foreground">
                          {formatRate(row.q05)}
                        </TableCell>
                        <TableCell className="tnum text-right font-mono text-xs font-semibold">
                          {formatRate(row.q50)}
                        </TableCell>
                        <TableCell className="tnum text-right font-mono text-xs text-muted-foreground">
                          {formatRate(row.q95)}
                        </TableCell>
                        <TableCell className="tnum text-right font-mono text-xs">
                          {formatRate(row.observed_rate)}
                        </TableCell>
                        <TableCell className="tnum text-right font-mono text-xs">
                          {formatPercent(row.absolute_percentage_error, 3)}
                        </TableCell>
                        <TableCell>
                          {row.inside_90 ? (
                            <StatusPill tone="good" label="yes" />
                          ) : (
                            <StatusPill tone="critical" label="no" />
                          )}
                        </TableCell>
                      </TableRow>
                  ))}
                />
              </CardContent>
            </Card>
          </section>
        </>
      )}

      <section className="space-y-3">
        <SectionHeading
          title="Audited evaluation ledger"
          description="The pipeline's own matured-outcome ledger, written with an explicit metric version."
        />
        {matured.length ? (
          <Card>
            <CardContent>
              <PaginatedTable
                pageSize={15}
                label="evaluations"
                header={
                  <TableRow>
                    <TableHead>Target date</TableHead>
                    <TableHead>Pair</TableHead>
                    <TableHead className="text-right">Day</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right">Selected</TableHead>
                    <TableHead className="text-right">Observed</TableHead>
                    <TableHead className="text-right">APE</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Inside 90%</TableHead>
                    <TableHead>Metric</TableHead>
                  </TableRow>
                }
                rows={matured.map((row) => (
                    <TableRow key={row.evaluation_id}>
                      <TableCell className="text-xs">{formatDate(row.target_date)}</TableCell>
                      <TableCell>
                        <PairBadge pair={row.pair} />
                      </TableCell>
                      <TableCell className="tnum text-right font-mono text-xs">
                        {row.horizon}
                      </TableCell>
                      <TableCell className="tnum text-right font-mono text-xs">
                        {formatRate(row.base_rate)}
                      </TableCell>
                      <TableCell className="tnum text-right font-mono text-xs">
                        {formatRate(row.selected_rate)}
                      </TableCell>
                      <TableCell className="tnum text-right font-mono text-xs">
                        {formatRate(row.observed_rate)}
                      </TableCell>
                      <TableCell className="tnum text-right font-mono text-xs">
                        {formatPercent(row.absolute_percentage_error, 3)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.direction_correct === null
                          ? "—"
                          : row.direction_correct
                            ? "correct"
                            : "wrong"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.inside_central_90_interval ? "yes" : "no"}
                      </TableCell>
                      <TableCell>
                        <MonoTag>{row.metric_version}</MonoTag>
                      </TableCell>
                    </TableRow>
                ))}
              />
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="The audited ledger is still empty"
            description="matured_outcome_evaluations is written by the pipeline's own evaluation task, which runs after a target date matures and records a versioned metric alongside the direction and interval checks. Until it runs, the numbers above are the observatory's independent join of forecast points against canonical observations — the same arithmetic, without the audit record."
          />
        )}
        <ReadingNote>
          Two ledgers on purpose. The audited one is authoritative and versioned; the
          observatory&apos;s own join is immediate and unversioned. When both are populated they
          should agree — and a disagreement is itself a finding worth chasing.
        </ReadingNote>
      </section>

      <ReadingNote>
        Evaluated {formatDateTime(new Date().toISOString())} · matured rows are recomputed on
        every page load from the forecast and observation ledgers, never cached.
      </ReadingNote>
    </>
  );
}
