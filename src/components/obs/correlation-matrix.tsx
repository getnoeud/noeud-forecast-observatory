import { PairBadge } from "@/components/obs/badges";
import { PAIRS, type Pair } from "@/lib/types";

/**
 * Diverging heatmap: two poles with a neutral midpoint, because a correlation
 * of zero genuinely means "nothing" and must not read as a low value on a
 * one-hue ramp. Every cell carries its number, so colour is never the only
 * encoding.
 */
function cellColor(value: number): { background: string; color: string } {
  if (!Number.isFinite(value)) {
    return { background: "var(--muted)", color: "var(--muted-foreground)" };
  }
  const magnitude = Math.min(1, Math.abs(value));
  const hue = value >= 0 ? "var(--chart-1)" : "var(--chart-8)";
  const mix = Math.round(magnitude * 78);
  return {
    background: `color-mix(in oklab, ${hue} ${mix}%, var(--card))`,
    color: mix > 45 ? "white" : "var(--foreground)",
  };
}

export function CorrelationMatrix({
  values,
  caption,
}: {
  values: Record<string, Record<string, number>>;
  caption?: string;
}) {
  return (
    <figure className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0.5 text-xs">
          <thead>
            <tr>
              <th className="w-24" />
              {PAIRS.map((pair) => (
                <th key={pair} className="px-2 pb-1 text-center font-medium">
                  <span className="font-mono text-[0.7rem] text-muted-foreground">{pair}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PAIRS.map((rowPair) => (
              <tr key={rowPair}>
                <th className="py-1 pr-2 text-left">
                  <PairBadge pair={rowPair as Pair} />
                </th>
                {PAIRS.map((columnPair) => {
                  const value = values[rowPair]?.[columnPair] ?? Number.NaN;
                  const style = cellColor(value);
                  return (
                    <td
                      key={columnPair}
                      className="tnum rounded-md px-2 py-3 text-center font-mono text-xs font-medium"
                      style={style}
                    >
                      {Number.isFinite(value) ? value.toFixed(2) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption ? (
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
