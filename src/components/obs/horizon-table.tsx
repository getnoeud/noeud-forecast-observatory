import { SelectionBadge } from "@/components/obs/badges";
import { PaginatedTable } from "@/components/obs/paginated-table";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { bandWidthPct } from "@/lib/analytics";
import { formatDate, formatPercent, formatRate, formatWeekday } from "@/lib/format";
import type { ForecastPoint, PublishedPoint } from "@/lib/types";

/**
 * The 30-row path in numbers. Every chart on the forecast page is a view of
 * this table, and the release contract requires all thirty horizons to exist,
 * so nothing is dropped — only paged.
 */
export function HorizonTable({
  points,
  anchorRate,
  published,
  observed,
  pageSize = 15,
}: {
  points: ForecastPoint[];
  anchorRate: number | null;
  published?: PublishedPoint[];
  observed?: Map<string, number>;
  pageSize?: number;
}) {
  const publishedByDate = new Map(
    (published ?? []).map((point) => [point.target_date, point]),
  );

  const header = (
    <TableRow>
      <TableHead className="w-12">Day</TableHead>
      <TableHead>Target date</TableHead>
      <TableHead className="text-right">q05</TableHead>
      <TableHead className="text-right">q25</TableHead>
      <TableHead className="text-right">Median</TableHead>
      <TableHead className="text-right">q75</TableHead>
      <TableHead className="text-right">q95</TableHead>
      <TableHead className="text-right">90% width</TableHead>
      <TableHead className="text-right">vs spot</TableHead>
      {observed ? <TableHead className="text-right">Observed</TableHead> : null}
      {published?.length ? <TableHead>Published</TableHead> : null}
    </TableRow>
  );

  const rows = points.map((point) => {
    const drift = anchorRate ? ((point.q50 - anchorRate) / anchorRate) * 100 : null;
    const actual = observed?.get(point.target_date);
    const pub = publishedByDate.get(point.target_date);
    return (
      <TableRow key={point.horizon}>
        <TableCell className="tnum font-mono text-xs text-muted-foreground">
          {point.horizon}
        </TableCell>
        <TableCell className="text-xs whitespace-nowrap">
          <span className="text-muted-foreground">{formatWeekday(point.target_date)}</span>{" "}
          {formatDate(point.target_date)}
        </TableCell>
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
    <PaginatedTable header={header} rows={rows} pageSize={pageSize} label="horizons" />
  );
}
