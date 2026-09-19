"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
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
import { hasWeekendBands, WEEKEND_LEGEND, weekendBands } from "@/components/charts/weekend";
import { PAIR_COLOR_VAR } from "@/components/obs/badges";
import { formatDate, formatPercent, formatRate, formatShortDate } from "@/lib/format";
import type { MultiSeriesRow } from "@/lib/analytics";
import { PAIRS, type Pair } from "@/lib/types";

const PAIR_LEGEND = PAIRS.map((pair) => ({
  label: pair,
  color: PAIR_COLOR_VAR[pair],
  shape: "line" as const,
}));

/**
 * All three pairs indexed to their first observation. Levels differ by a factor
 * of nearly two, so a common index is the only honest way to put them on one
 * axis — never two y-scales.
 */
export function IndexedHistoryChart({
  rows,
  height = 300,
  title = "Cedi depreciation since the series start",
  description = "Each pair indexed to 0% at its first observation, so the three can share one axis.",
}: {
  rows: MultiSeriesRow[];
  height?: number;
  title?: string;
  description?: string;
}) {
  return (
    <ChartFrame
      title={title}
      description={description}
      legend={[...PAIR_LEGEND, ...(hasWeekendBands(rows.map((r) => r.date)) ? [WEEKEND_LEGEND] : [])]}
      height={height}
      footnote="A rising line means the cedi has weakened against that currency since the start of the window."
    >
      <LineChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis
          dataKey="date"
          scale="band"
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          minTickGap={56}
          tickFormatter={(value: string) => formatDate(value).slice(3)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={52}
          tickFormatter={(value: number) => `${value > 0 ? "+" : ""}${value.toFixed(0)}%`}
        />
        {weekendBands(rows.map((r) => r.date))}
        <ReferenceLine y={0} stroke="var(--border)" />
        <Tooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as MultiSeriesRow;
            return (
              <TooltipShell title={formatDate(row.date)}>
                {PAIRS.map((pair) => (
                  <TooltipRow
                    key={pair}
                    label={pair}
                    value={formatPercent(row[pair], 1, true)}
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

export function VolatilityChart({
  rows,
  window,
  height = 260,
}: {
  rows: MultiSeriesRow[];
  window: number;
  height?: number;
}) {
  return (
    <ChartFrame
      title={`Rolling ${window}-day realised volatility`}
      description="Annualised standard deviation of daily log returns. This is the market's own turbulence, independent of any model."
      legend={[...PAIR_LEGEND, ...(hasWeekendBands(rows.map((r) => r.date)) ? [WEEKEND_LEGEND] : [])]}
      height={height}
      footnote="Calendar-day series include weekends, where the provider repeats the last quoted rate. Zero-return days pull realised volatility below an equivalent trading-day estimate."
    >
      <LineChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis
          dataKey="date"
          scale="band"
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          minTickGap={56}
          tickFormatter={(value: string) => formatDate(value).slice(3)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={46}
          tickFormatter={(value: number) => `${value.toFixed(0)}%`}
        />
        {weekendBands(rows.map((r) => r.date))}
        <Tooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as MultiSeriesRow;
            return (
              <TooltipShell title={formatDate(row.date)}>
                {PAIRS.map((pair) => (
                  <TooltipRow
                    key={pair}
                    label={pair}
                    value={formatPercent(row[pair], 1)}
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

/** Single-pair level chart with a shaded area, used on the pair detail views. */
export function LevelChart({
  series,
  pair,
  height = 240,
  title,
  description,
}: {
  series: { observed_on: string; rate: number }[];
  pair: Pair;
  height?: number;
  title?: string;
  description?: string;
}) {
  const color = PAIR_COLOR_VAR[pair];
  const id = `level-${pair}`;
  return (
    <ChartFrame
      title={title ?? `${pair} observed rate`}
      description={description}
      legend={
        hasWeekendBands(series.map((r) => r.observed_on))
          ? [{ label: pair, color, shape: "area" }, WEEKEND_LEGEND]
          : undefined
      }
      height={height}
    >
      <AreaChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis
          dataKey="observed_on"
          scale="band"
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          minTickGap={48}
          tickFormatter={formatShortDate}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={54}
          domain={["auto", "auto"]}
          tickFormatter={(value: number) => value.toFixed(2)}
        />
        {weekendBands(series.map((r) => r.observed_on))}
        <Tooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as { observed_on: string; rate: number };
            return (
              <TooltipShell title={formatDate(row.observed_on)}>
                <TooltipRow label={pair} value={formatRate(row.rate)} color={color} emphasis />
              </TooltipShell>
            );
          }}
        />
        <Area
          dataKey="rate"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${id})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartFrame>
  );
}

/** Daily log-return bars — the input the block bootstrap resamples. */
export function ReturnsChart({
  rows,
  pair,
  height = 200,
}: {
  rows: { date: string; ret: number }[];
  pair: Pair;
  height?: number;
}) {
  const data = rows.map((row) => ({ ...row, pct: row.ret * 100 }));
  return (
    <ChartFrame
      title="Daily log returns"
      description="The return series the 1,000-path block bootstrap resamples in seven-day blocks."
      legend={[
        { label: "Cedi weaker", color: "var(--chart-8)", shape: "area" },
        { label: "Cedi firmer", color: "var(--chart-3)", shape: "area" },
        ...(hasWeekendBands(data.map((r) => r.date)) ? [WEEKEND_LEGEND] : []),
      ]}
      height={height}
      footnote="Block resampling preserves short runs of momentum that an independent draw would destroy."
    >
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          minTickGap={48}
          tickFormatter={formatShortDate}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={46}
          tickFormatter={(value: number) => `${value.toFixed(1)}%`}
        />
        {weekendBands(data.map((r) => r.date))}
        <ReferenceLine y={0} stroke="var(--border)" />
        <Tooltip
          cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as { date: string; pct: number };
            return (
              <TooltipShell title={formatDate(row.date)}>
                <TooltipRow label={`${pair} return`} value={formatPercent(row.pct, 3, true)} emphasis />
              </TooltipShell>
            );
          }}
        />
        <Bar dataKey="pct" isAnimationActive={false}>
          {data.map((row) => (
            <Cell key={row.date} fill={row.pct >= 0 ? "var(--chart-8)" : "var(--chart-3)"} />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}
