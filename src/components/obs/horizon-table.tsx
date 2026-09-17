import { MonoTag, SelectionBadge } from "@/components/obs/badges";
import { PaginatedTable } from "@/components/obs/paginated-table";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { bandWidthPct } from "@/lib/analytics";
import { formatDate, formatPercent, formatRate, formatShortDate, formatWeekday } from "@/lib/format";
import type { ForecastPoint, PublishedPoint } from "@/lib/types";

type WalkForwardPoint = ForecastPoint & { origin?: string };

/**
 * The path in numbers. Every chart on the forecast page is a view of this
 * table, and the release contract requires all thirty horizons to exist, so
 * nothing is dropped — only paged.
 *
 * When a row carries its own `origin` (the walk-forward bootstrap series,
 * merged from many stored vintages), an "Issued" column names which vintage
 * produced it — the "Day" number alone stops meaning "days from a single
 * origin" once rows come from different origins.
 */
export function HorizonTable({
  points,
  anchorRate,
  published,
  observed,
  bootstrap,
  pageSize = 15,
}: {
  points: WalkForwardPoint[];
  anchorRate: number | null;
  published?: PublishedPoint[];
  observed?: Map<string, number>;
  /** Bootstrap points for the same target dates, shown as overlay columns. */
  bootstrap?: ForecastPoint[];
  pageSize?: number;
}) {
  const publishedByDate = new Map(
    (published ?? []).map((point) => [point.target_date, point]),
  );
  const bootstrapByDate = new Map(
    (bootstrap ?? []).map((point) => [point.target_date, point]),
  );
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
      <TableHead className="text-right">vs spot</TableHead>
      {observed ? <TableHead className="text-right">Observed</TableHead> : null}
      {showBootstrap ? <TableHead className="text-right">Bootstrap median</TableHead> : null}
      {published?.length ? <TableHead>Published</TableHead> : null}
    </TableRow>
  );

  const rows = points.map((point) => {
    const drift = anchorRate ? ((point.q50 - anchorRate) / anchorRate) * 100 : null;
    const actual = observed?.get(point.target_date);
    const pub = publishedByDate.get(point.target_date);
    const boot = bootstrapByDate.get(point.target_date);
    return (
      <TableRow key={`${point.origin ?? ""}-${point.target_date}`}>
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
                <span className="tnum font-mono text-xs">{formatRate(pub.selected_rate)}</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </TableCell>
        ) : null}
      </TableRow>
    );
  });

  return (
    <div className="space-y-3">
      {showOrigin ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MonoTag>walk-forward</MonoTag>
          Each row keeps whichever stored vintage most recently forecast that date, so a matured
          prediction stays visible instead of dropping out once a newer vintage supersedes it.
        </p>
      ) : null}
      <PaginatedTable header={header} rows={rows} pageSize={pageSize} label="horizons" />
    </div>
  );
}
