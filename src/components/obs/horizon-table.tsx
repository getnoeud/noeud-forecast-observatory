import { MonoTag, SelectionBadge } from "@/components/obs/badges";
import { PaginatedTable } from "@/components/obs/paginated-table";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { bandWidthPct } from "@/lib/analytics";
import { formatDate, formatPercent, formatRate, formatShortDate, formatWeekday } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ForecastPoint, PublishedPoint } from "@/lib/types";

type WalkForwardPoint = ForecastPoint & { origin?: string };

/**
 * The path in numbers. Every chart on the forecast page is a view of this
 * table, and the release contract requires all thirty horizons to exist, so
 * nothing is dropped — only paged.
 *
 * When a row carries its own `origin` (a walk-forward series merged from many
 * stored vintages), an "Issued" column names which vintage produced it — the
 * "Day" number alone stops meaning "days from a single origin" once rows come
 * from different origins.
 */
export function HorizonTable({
  points,
  anchorRate,
  published,
  observed,
  bootstrap,
  bankMeans,
  pageSize = 15,
}: {
  points: WalkForwardPoint[];
  anchorRate: number | null;
  /**
   * Every published row for these target dates, already merged across every
   * stored snapshot (`buildPublishedWalkForward`) so a date shows whatever was
   * most recently published for it, not just the current snapshot's own window.
   */
  published?: PublishedPoint[];
  observed?: Map<string, number>;
  /** Bootstrap points for the same target dates, shown as overlay columns. */
  bootstrap?: ForecastPoint[];
  /** Cross-bank mean transfer-selling rate by date (a commercial, not a model, basis). */
  bankMeans?: { date: string; mean: number; bankCount: number }[];
  pageSize?: number;
}) {
  const publishedByDate = new Map(
    (published ?? []).map((point) => [point.target_date, point]),
  );
  const bootstrapByDate = new Map(
    (bootstrap ?? []).map((point) => [point.target_date, point]),
  );
  const bankByDate = new Map((bankMeans ?? []).map((row) => [row.date, row]));
  const showBank = bankByDate.size > 0;
  const showOrigin = points.some((point) => point.origin);
  const showBootstrap = Boolean(bootstrap?.length);

  const header = (
    <TableRow>
      <TableHead className="w-12">Day</TableHead>
      <TableHead>Target date</TableHead>
      {showOrigin ? <TableHead>Issued</TableHead> : null}
      <TableHead className="text-right">q05</TableHead>
      <TableHead className="text-right">q25</TableHead>
      <TableHead className="text-right">Median</TableHead>
      <TableHead className="text-right">q75</TableHead>
      <TableHead className="text-right">q95</TableHead>
      <TableHead className="text-right">90% width</TableHead>
      <TableHead
        className="text-right"
        title={
          showOrigin
            ? "Median against the observed rate on the day that row's vintage was issued"
            : "Median against the latest observed rate"
        }
      >
        vs spot
      </TableHead>
      {observed ? <TableHead className="text-right">Observed</TableHead> : null}
      {showBank ? <TableHead className="text-right">Bank mean</TableHead> : null}
      {showBank ? <TableHead className="text-right">Bank vs median</TableHead> : null}
      {showBootstrap ? <TableHead className="text-right">Bootstrap median</TableHead> : null}
      {published?.length ? (
        <TableHead title="The rate the publication policy selected for this date — highlighted when the LLM's proposed adjustment was the one selected">
          Published
        </TableHead>
      ) : null}
    </TableRow>
  );

  const rows = points.map((point) => {
    // A stitched row was forecast from its own origin, so measure it from the spot
    // that day; today's rate would make last week's path look like a forecast error.
    const spot = (point.origin ? observed?.get(point.origin) : undefined) ?? anchorRate;
    const drift = spot ? ((point.q50 - spot) / spot) * 100 : null;
    const actual = observed?.get(point.target_date);
    const pub = publishedByDate.get(point.target_date);
    const adjusted = pub?.selection === "event_candidate";
    const boot = bootstrapByDate.get(point.target_date);
    const bank = bankByDate.get(point.target_date);
    const bankGap = bank ? ((bank.mean - point.q50) / point.q50) * 100 : null;
    return (
      <TableRow
        key={`${point.origin ?? ""}-${point.target_date}`}
        className={cn(adjusted && "bg-[var(--serious)]/10 hover:bg-[var(--serious)]/15")}
      >
        <TableCell className="tnum font-mono text-xs text-muted-foreground">
          {point.horizon}
        </TableCell>
        <TableCell className="text-xs whitespace-nowrap">
          <span className="text-muted-foreground">{formatWeekday(point.target_date)}</span>{" "}
          {formatDate(point.target_date)}
        </TableCell>
        {showOrigin ? (
          <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
            {point.origin ? formatShortDate(point.origin) : "—"}
          </TableCell>
        ) : null}
        <TableCell className="tnum text-right font-mono text-xs text-muted-foreground">
          {formatRate(point.q05)}
        </TableCell>
        <TableCell className="tnum text-right font-mono text-xs text-muted-foreground">
          {formatRate(point.q25)}
        </TableCell>
        <TableCell className="tnum text-right font-mono text-xs font-semibold">
          {formatRate(point.q50)}
        </TableCell>
        <TableCell className="tnum text-right font-mono text-xs text-muted-foreground">
          {formatRate(point.q75)}
        </TableCell>
        <TableCell className="tnum text-right font-mono text-xs text-muted-foreground">
          {formatRate(point.q95)}
        </TableCell>
        <TableCell className="tnum text-right font-mono text-xs">
          {formatPercent(bandWidthPct(point), 2)}
        </TableCell>
        <TableCell
          className="tnum text-right font-mono text-xs"
          style={{
            color:
              drift === null
                ? undefined
                : drift > 0
                  ? "var(--chart-8)"
                  : drift < 0
                    ? "var(--chart-3)"
                    : undefined,
          }}
        >
          {formatPercent(drift, 2, true)}
        </TableCell>
        {observed ? (
          <TableCell className="tnum text-right font-mono text-xs">
            {actual === undefined ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              <span
                className="font-semibold"
                style={{
                  color:
                    actual >= point.q05 && actual <= point.q95
                      ? "var(--good)"
                      : "var(--critical)",
                }}
              >
                {formatRate(actual)}
              </span>
            )}
          </TableCell>
        ) : null}
        {showBank ? (
          <TableCell className="tnum text-right font-mono text-xs">
            {bank ? (
              <span
                className="font-semibold text-[var(--chart-1)]"
                title={`${bank.bankCount} bank${bank.bankCount === 1 ? "" : "s"}, transfer selling`}
              >
                {formatRate(bank.mean)}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </TableCell>
        ) : null}
        {showBank ? (
          <TableCell className="tnum text-right font-mono text-xs">
            {bankGap === null ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              formatPercent(bankGap, 2, true)
            )}
          </TableCell>
        ) : null}
        {showBootstrap ? (
          <TableCell className="tnum text-right font-mono text-xs">
            {boot ? (
              <span title={`${formatRate(boot.q05)} – ${formatRate(boot.q95)}`}>
                {formatRate(boot.q50)}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </TableCell>
        ) : null}
        {published?.length ? (
          <TableCell>
            {pub ? (
              <div className="flex items-center gap-2">
                <SelectionBadge selection={pub.selection} />
                <span
                  className={cn(
                    "tnum font-mono text-xs",
                    adjusted && "font-semibold text-[var(--serious)]",
                  )}
                  title={
                    adjusted && pub.adjustment_delta_pct !== null
                      ? `LLM-adjusted: ${formatPercent(pub.adjustment_delta_pct, 2, true)} from base ${formatRate(pub.base_q50)}`
                      : undefined
                  }
                >
                  {formatRate(pub.selected_rate)}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </TableCell>
        ) : null}
      </TableRow>
    );
  });

  const adjustedCount = (published ?? []).filter((point) => point.selection === "event_candidate").length;

  return (
    <div className="space-y-3">
      {showBank ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-[var(--chart-1)]">Bank mean</span> is the cross-bank
          transfer-selling rate published for that date — a commercial price, not the series the
          model forecasts, so <em>bank vs median</em> includes the banks&apos; markup and is not a
          forecast error. Banks publish on weekdays only.
        </p>
      ) : null}
      {showOrigin ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MonoTag>walk-forward</MonoTag>
          Each row keeps whichever stored vintage most recently forecast that date, so a matured
          prediction stays visible instead of dropping out once a newer vintage supersedes it.
        </p>
      ) : null}
      {adjustedCount ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            aria-hidden
            className="inline-block size-2.5 rounded-[2px] bg-[var(--serious)]/25"
          />
          {adjustedCount} date{adjustedCount === 1 ? "" : "s"} highlighted below had the LLM&apos;s
          proposed adjustment selected instead of the base median.
        </p>
      ) : null}
      <PaginatedTable header={header} rows={rows} pageSize={pageSize} label="horizons" />
    </div>
  );
}
