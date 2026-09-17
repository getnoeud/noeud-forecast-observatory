"use client";

import * as React from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  AXIS_TICK,
  ChartFrame,
  GRID_PROPS,
  TooltipRow,
  TooltipShell,
} from "@/components/charts/frame";
import { PAIR_COLOR_VAR } from "@/components/obs/badges";
import { formatDate, formatPercent, formatRate, formatShortDate } from "@/lib/format";
import { PAIRS, type Pair } from "@/lib/types";

export type DriftRow = { horizon: number; target_date: string } & Partial<Record<Pair, number>>;

/**
 * The forward view for all three pairs at once: median path expressed as
 * percent change from each pair's latest observed rate, so the three sit on a
 * single comparable axis.
 */
export function ForwardOutlookChart({
  rows,
  height = 300,
}: {
  rows: DriftRow[];
  height?: number;
}) {
  return (
    <ChartFrame
      title="Forward outlook — next 30 days"
      description="Median forecast path for each pair, measured as percent change from that pair's latest observed rate."
      legend={PAIRS.map((pair) => ({
        label: pair,
        color: PAIR_COLOR_VAR[pair],
        shape: "line" as const,
      }))}
      height={height}
      footnote="Above the zero line the model expects the cedi to weaken against that currency over the horizon; below it, to firm. Intervals are on the Forward Forecast page — this is the central path only."
    >
      <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis
          dataKey="horizon"
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          tickFormatter={(value: number) => `D${value}`}
          minTickGap={16}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={50}
          tickFormatter={(value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}%`}
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <Tooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as DriftRow;
            return (
              <TooltipShell title={`Day ${row.horizon}`} subtitle={formatDate(row.target_date)}>
                {PAIRS.map((pair) => (
                  <TooltipRow
                    key={pair}
                    label={pair}
                    value={formatPercent(row[pair], 2, true)}
                    color={PAIR_COLOR_VAR[pair]}
                  />
                ))}
              </TooltipShell>
            );
          }}
        />
        {PAIRS.map((pair) => (
          <Line
            key={pair}
            dataKey={pair}
            stroke={PAIR_COLOR_VAR[pair]}
            strokeWidth={2}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ChartFrame>
  );
}

export type MiniRow = {
  date: string;
  actual: number | null;
  floor: number | null;
  band50: number | null;
  median: number | null;
  q25: number | null;
  q75: number | null;
  q05: number | null;
  q95: number | null;
};

/**
 * Sparkline used on the pair cards: observed history, then the median path.
 *
 * Deliberately no interval band — at this height the 90% fan is several times
 * the span of a month of history, so drawing it would flatten the line into a
 * hairline and read as precision the chart cannot actually show. The card
 * states the band width as a number, and the full fan is one click away.
 */
export function MiniFan({
  rows,
  pair,
  height = 120,
}: {
  rows: MiniRow[];
  pair: Pair;
  height?: number;
}) {
  const color = PAIR_COLOR_VAR[pair];
  const gradientId = `mini-${pair}`;

  const domain = React.useMemo<[number, number] | ["auto", "auto"]>(() => {
    const values = rows.flatMap((row) =>
      [row.actual, row.median].filter((value): value is number => value !== null),
    );
    if (!values.length) return ["auto", "auto"];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.18 || 0.02;
    return [min - pad, max + pad];
  }, [rows]);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.26} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <YAxis domain={domain} hide />
          <XAxis dataKey="date" hide />
          <Area
            dataKey="median"
            stroke={color}
            strokeWidth={1.75}
            strokeDasharray="4 3"
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            connectNulls
          />
          <Line
            dataKey="actual"
            stroke="var(--foreground)"
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as MiniRow;
              return (
                <TooltipShell title={formatShortDate(row.date)}>
                  {row.actual !== null ? (
                    <TooltipRow label="Observed" value={formatRate(row.actual)} emphasis />
                  ) : null}
                  {row.median !== null ? (
                    <>
                      <TooltipRow label="Median" value={formatRate(row.median)} color={color} />
                      <TooltipRow
                        label="50% band"
                        value={`${formatRate(row.q25)} – ${formatRate(row.q75)}`}
                      />
                      <TooltipRow
                        label="90% band"
                        value={`${formatRate(row.q05)} – ${formatRate(row.q95)}`}
                      />
                    </>
                  ) : null}
                </TooltipShell>
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
