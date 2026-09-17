import {
  IndexedHistoryChart,
  LevelChart,
  ReturnsChart,
  VolatilityChart,
} from "@/components/charts/market-charts";
import { AnomalyTable } from "@/components/obs/anomaly-table";
import { CorrelationMatrix } from "@/components/obs/correlation-matrix";
import { PaginatedTable } from "@/components/obs/paginated-table";
import { DataSourceError } from "@/components/obs/db-error";
import { PairSwitcher, SegmentedParam } from "@/components/obs/pair-switcher";
import { PairBadge, RunStateBadge, StatusPill } from "@/components/obs/badges";
import {
  PageHeader,
  ReadingNote,
  SectionHeading,
  StatTile,
} from "@/components/obs/primitives";
import { Card, CardContent } from "@/components/ui/card";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import {
  buildMultiSeries,
  logReturns,
  pearson,
  rollingVolatility,
} from "@/lib/analytics";
import {
  formatDate,
  formatDateTime,
  formatInteger,
  formatPercent,
  formatRate,
} from "@/lib/format";
import {
  getAllSeries,
  getCoverage,
  getObservations,
  getProviderRollup,
  getProviderRuns,
  getRateAnomalies,
} from "@/lib/server/queries";
import { isPair, PAIRS, type Pair } from "@/lib/types";

export const dynamic = "force-dynamic";

const WINDOWS = [
  { value: "90", label: "90d" },
  { value: "365", label: "1y" },
  { value: "1095", label: "3y" },
  { value: "2100", label: "All" },
];

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ pair?: string; window?: string }>;
}) {
  const params = await searchParams;
  const pair: Pair = isPair(params.pair) ? params.pair : "USDGHS";
  const windowValue = WINDOWS.some((option) => option.value === params.window)
    ? (params.window as string)
    : "365";
  const limit = Number(windowValue);

  let series;
  let coverage;
  let observations;
  let providerRuns;
  let rollup;
  let anomalies;
  try {
    [series, coverage, observations, providerRuns, rollup, anomalies] = await Promise.all([
      getAllSeries(limit),
      getCoverage(),
      getObservations(pair, limit),
      getProviderRuns(25),
      getProviderRollup(),
      getRateAnomalies(4),
    ]);
  } catch (error) {
    return (
      <>
        <PageHeader eyebrow="Foundations" title="Market History" />
        <DataSourceError error={error} />
      </>
    );
  }

  const indexed = buildMultiSeries(series, (value, first) => ((value - first) / first) * 100);
  const volatilityWindow = limit <= 90 ? 14 : 30;
  const volatility = buildMultiSeries(
    Object.fromEntries(
      Object.entries(series).map(([key, points]) => [
        key,
        rollingVolatility(points, volatilityWindow).map((row) => ({
          observed_on: row.date,
          rate: row.vol,
        })),
      ]),
    ),
  );

  const returnsByPair = Object.fromEntries(
    PAIRS.map((item) => [item, logReturns(series[item] ?? []).map((row) => row.ret)]),
  ) as Record<Pair, number[]>;
  const correlation: Record<string, Record<string, number>> = {};
  for (const rowPair of PAIRS) {
    correlation[rowPair] = {};
    for (const columnPair of PAIRS) {
      correlation[rowPair][columnPair] =
        rowPair === columnPair ? 1 : pearson(returnsByPair[rowPair], returnsByPair[columnPair]);
    }
  }

  const pairSeries = (series[pair] ?? []).map((point) => ({
    observed_on: point.observed_on,
    rate: point.rate,
  }));
  const pairReturns = logReturns(pairSeries);
  const annualVol =
    pairReturns.length > 2
      ? Math.sqrt(
          pairReturns.reduce((total, item) => {
            const mean =
              pairReturns.reduce((sum, value) => sum + value.ret, 0) / pairReturns.length;
            return total + (item.ret - mean) ** 2;
          }, 0) /
            (pairReturns.length - 1),
        ) *
        Math.sqrt(365) *
        100
      : Number.NaN;

  const first = pairSeries[0];
  const last = pairSeries[pairSeries.length - 1];
  const windowChange = first && last ? ((last.rate - first.rate) / first.rate) * 100 : null;
  const maxRate = pairSeries.length ? Math.max(...pairSeries.map((p) => p.rate)) : null;
  const minRate = pairSeries.length ? Math.min(...pairSeries.map((p) => p.rate)) : null;

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedParam param="window" value={windowValue} options={WINDOWS} label="Window" />
      <PairSwitcher value={pair} />
    </div>
  );

  return (
    <>
      <PageHeader
        eyebrow="Foundations"
        title="Market History"
        description="The calendar-day observation series every model is built on. One canonical rate per pair per date, derived from the immutable provider payload with the highest fetch timestamp."
        actions={controls}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={`${pair} latest`}
          value={formatRate(last?.rate)}
          hint={`Observed ${formatDate(last?.observed_on)}`}
          accent={`var(--pair-${pair.toLowerCase()})`}
        />
        <StatTile
          label="Change over window"
          value={formatPercent(windowChange, 2, true)}
          trend={(windowChange ?? 0) > 0 ? "up" : (windowChange ?? 0) < 0 ? "down" : "flat"}
          hint={`From ${formatRate(first?.rate)} on ${formatDate(first?.observed_on)}`}
          accent="var(--chart-2)"
        />
        <StatTile
          label="Realised volatility"
          value={formatPercent(annualVol, 1)}
          unit="annualised"
          hint={`Standard deviation of daily log returns across ${formatInteger(pairReturns.length)} days`}
          accent="var(--chart-7)"
        />
        <StatTile
          label="Window range"
          value={`${formatRate(minRate, 2)} – ${formatRate(maxRate, 2)}`}
          hint={
            minRate && maxRate
              ? `${formatPercent(((maxRate - minRate) / minRate) * 100, 1)} peak-to-trough`
              : undefined
          }
          accent="var(--chart-3)"
        />
      </section>

      <IndexedHistoryChart
        rows={indexed}
        title="All three pairs, indexed"
        description="Each pair indexed to 0% at the start of the selected window, so a single axis is honest for all three."
        height={330}
      />

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <VolatilityChart rows={volatility} window={volatilityWindow} />
        <Card className="gap-4">
          <CardContent className="space-y-4">
            <SectionHeading
              title="Return correlation"
              description="Pearson correlation of daily log returns across the selected window."
            />
            <CorrelationMatrix
              values={correlation}
              caption="All three pairs share the cedi as the quote currency, so a common cedi move drives correlation upward regardless of what the base currencies do independently. A reading close to 1 says the pairs moved together; a low reading says base-currency moves dominated."
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <LevelChart
          series={pairSeries}
          pair={pair}
          title={`${pair} observed level`}
          description="The canonical daily series, straight from the point-in-time observation view."
          height={280}
        />
        <ReturnsChart rows={pairReturns} pair={pair} height={280} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1.5fr]">
        <Card className="gap-4">
          <CardContent className="space-y-4">
            <SectionHeading
              title="Coverage"
              description="Continuity of the calendar-day series per pair, across the full stored history."
            />
            <PaginatedTable
              pageSize={10}
              label="pairs"
              header={
                <TableRow>
                  <TableHead>Pair</TableHead>
                  <TableHead>First</TableHead>
                  <TableHead>Last</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="text-right">Versions</TableHead>
                </TableRow>
              }
              rows={coverage.map((row) => (
                <TableRow key={row.pair}>
                  <TableCell>
                    <PairBadge pair={row.pair} />
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(row.first_date)}</TableCell>
                  <TableCell className="text-xs">{formatDate(row.last_date)}</TableCell>
                  <TableCell className="tnum text-right font-mono text-xs">
                    {formatInteger(row.observed_days)}
                    {row.observed_days === row.span_days ? null : (
                      <span className="text-[var(--warning)]">
                        {" "}
                        / {formatInteger(row.span_days)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="tnum text-right font-mono text-xs text-muted-foreground">
                    {formatInteger(row.versions)}
                  </TableCell>
                </TableRow>
              ))}
            />
            <ReadingNote>
              &ldquo;Versions&rdquo; counts every stored provider payload, including repeat
              observations for a date. The canonical view keeps the latest fetch per pair and
              date; the earlier payloads stay on record because the observation ledger rejects
              updates and deletes.
            </ReadingNote>
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardContent className="space-y-4">
            <SectionHeading
              title="Provider ingestion"
              description="How the history was acquired, by request kind."
            />
            <PaginatedTable
              pageSize={10}
              label="request kinds"
              header={
                <TableRow>
                  <TableHead>Request kind</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Runs</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                  <TableHead>First</TableHead>
                  <TableHead>Latest</TableHead>
                </TableRow>
              }
              rows={rollup.map((row) => (
                <TableRow key={`${row.request_kind}-${row.status}`}>
                  <TableCell className="font-mono text-xs">{row.request_kind}</TableCell>
                  <TableCell>
                    <RunStateBadge state={row.status} />
                  </TableCell>
                  <TableCell className="tnum text-right font-mono text-xs">
                    {formatInteger(row.runs)}
                  </TableCell>
                  <TableCell className="tnum text-right font-mono text-xs">
                    {formatInteger(row.rows_written)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(row.first_started)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(row.last_started)}
                  </TableCell>
                </TableRow>
              ))}
            />

            <SectionHeading title="Most recent provider runs" />
            <PaginatedTable
              pageSize={8}
              label="runs"
              header={
                <TableRow>
                  <TableHead>Kind</TableHead>
                  <TableHead>For</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              }
              rows={providerRuns.map((run) => (
                    <TableRow key={run.provider_run_id}>
                      <TableCell className="font-mono text-xs">{run.request_kind}</TableCell>
                      <TableCell className="text-xs">
                        {run.requested_for ? formatDate(run.requested_for) : "—"}
                      </TableCell>
                      <TableCell>
                        {run.error_code ? (
                          <StatusPill tone="critical" label={run.error_code} />
                        ) : (
                          <RunStateBadge state={run.status} />
                        )}
                      </TableCell>
                      <TableCell className="tnum text-right font-mono text-xs">
                        {run.row_count}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(run.started_at)}
                      </TableCell>
                    </TableRow>
              ))}
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionHeading
          title={`Large single-day moves (${anomalies.length})`}
          description="Every stored day whose move exceeded 4%, with the following day's move beside it. Nothing here is corrected — the ledger is append-only — but a jump that reverses the next day is almost certainly a bad provider print rather than a market event."
        />
        <Card>
          <CardContent>
            <AnomalyTable anomalies={anomalies} />
          </CardContent>
        </Card>
        <ReadingNote>
          These rows matter for the models, not just for the record. The block bootstrap
          resamples exactly this return series, and Chronos-2 reads the levels as context — so a
          spurious ±5% print widens intervals and drags medians for as long as it stays inside
          the lookback window.
        </ReadingNote>
      </section>

      <ReadingNote>
        {formatInteger(observations.length)} observations are loaded for {pair} in this window.
        Rates are stored as <code className="font-mono">numeric(20,10)</code> with the raw
        provider payload and its SHA-256 alongside, so any derived rate can be re-checked
        against exactly what the provider returned.
      </ReadingNote>
    </>
  );
}
