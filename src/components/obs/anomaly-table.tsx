import { PairBadge, StatusPill } from "@/components/obs/badges";
import { PaginatedTable } from "@/components/obs/paginated-table";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { formatDate, formatPercent, formatRate } from "@/lib/format";
import type { RateAnomaly } from "@/lib/server/queries";

/**
 * A jump that reverses most of itself the next day is the signature of a bad
 * provider print rather than a market event. Nothing is corrected here — the
 * observation ledger is append-only — but these rows are worth seeing, because
 * the bootstrap resamples exactly this return series and Chronos reads the
 * levels as context.
 */
export function AnomalyTable({ anomalies }: { anomalies: RateAnomaly[] }) {
  const header = (
    <TableRow>
      <TableHead>Date</TableHead>
      <TableHead>Pair</TableHead>
      <TableHead className="text-right">Previous</TableHead>
      <TableHead className="text-right">Rate</TableHead>
      <TableHead className="text-right">Move</TableHead>
      <TableHead className="text-right">Next day</TableHead>
      <TableHead>Shape</TableHead>
    </TableRow>
  );

  const rows = anomalies.map((row) => {
    const reverts =
      row.reversal_pct !== null &&
      Math.sign(row.reversal_pct) !== Math.sign(row.move_pct) &&
      Math.abs(row.reversal_pct) > Math.abs(row.move_pct) * 0.6;
    return (
      <TableRow key={`${row.pair}-${row.observed_on}`}>
        <TableCell className="text-xs whitespace-nowrap">{formatDate(row.observed_on)}</TableCell>
        <TableCell>
          <PairBadge pair={row.pair} />
        </TableCell>
        <TableCell className="tnum text-right font-mono text-xs text-muted-foreground">
          {formatRate(row.previous_rate)}
        </TableCell>
        <TableCell className="tnum text-right font-mono text-xs">{formatRate(row.rate)}</TableCell>
        <TableCell
          className="tnum text-right font-mono text-xs font-semibold"
          style={{ color: row.move_pct > 0 ? "var(--chart-8)" : "var(--chart-3)" }}
        >
          {formatPercent(row.move_pct, 2, true)}
        </TableCell>
        <TableCell className="tnum text-right font-mono text-xs">
          {formatPercent(row.reversal_pct, 2, true)}
        </TableCell>
        <TableCell>
          {reverts ? (
            <StatusPill tone="warning" label="Reverted next day" />
          ) : (
            <StatusPill tone="neutral" label="Sustained" />
          )}
        </TableCell>
      </TableRow>
    );
  });

  return (
    <PaginatedTable
      header={header}
      rows={rows}
      pageSize={12}
      label="days"
      emptyMessage="No single-day move exceeded the threshold in the stored history."
    />
  );
}
