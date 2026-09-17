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
import { niceDomain, type WidthRow } from "@/lib/analytics";
import { formatDate, formatPercent, formatRate } from "@/lib/format";


/**
 * How fast the model admits it does not know. A well-behaved probabilistic
 * forecast widens with horizon; a flat curve means the intervals are not
 * responding to the extra distance.
 */
export function UncertaintyGrowthChart({
  rows,
  accent = "var(--chart-1)",
  height = 240,
}: {
  rows: WidthRow[];
  accent?: string;
  height?: number;
}) {
  return (
    <ChartFrame
      title="Interval width by horizon"
      description="Width of each prediction interval as a percentage of that day's median."
      legend={[
        { label: "90% interval (q05–q95)", color: accent, shape: "area" },
        { label: "50% interval (q25–q75)", color: "var(--seq-600)", shape: "area" },
      ]}
      height={height}
      footnote="Widening with horizon is expected. A step change at a single day usually points at a calibration cohort boundary rather than the market."
    >
      <AreaChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="width90" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
            <stop offset="100%" stopColor={accent} stopOpacity={0.04} />
          </linearGradient>
        </defs>
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
          width={44}
          tickFormatter={(value: number) => `${value.toFixed(1)}%`}
        />
        <Tooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as WidthRow;
            return (
              <TooltipShell title={`Day ${row.horizon}`} subtitle={formatDate(row.target_date)}>
                <TooltipRow label="90% width" value={formatPercent(row.width90)} color={accent} />
                <TooltipRow
                  label="50% width"
                  value={formatPercent(row.width50)}
                  color="var(--seq-600)"
                />
                <TooltipRow label="Median" value={formatRate(row.median)} />
              </TooltipShell>
            );
          }}
        />
        <Area
          dataKey="width90"
          stroke={accent}
          strokeWidth={2}
          fill="url(#width90)"
          isAnimationActive={false}
        />
        <Area
          dataKey="width50"
          stroke="var(--seq-600)"
          strokeWidth={2}
          fill="var(--seq-600)"
          fillOpacity={0.12}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartFrame>
  );
}

/**
 * Diverging bars: which side of the median carries the longer tail. Positive
 * means more room above the median (cedi weaker) than below it.
 */
export function SkewChart({ rows, height = 220 }: { rows: WidthRow[]; height?: number }) {
  const axis = niceDomain(
    rows.map((row) => row.skew).concat(0),
    5,
    0.15,
  );

  return (
    <ChartFrame
      title="Distribution skew by horizon"
      description="Share of the 90% interval that sits above the median, centred on zero."
      legend={[
        { label: "Upside-heavy (cedi weaker)", color: "var(--chart-8)", shape: "area" },
        { label: "Downside-heavy (cedi firmer)", color: "var(--chart-1)", shape: "area" },
      ]}
      height={height}
      footnote="Zero is a symmetric interval. Chronos-2 quantiles are calibrated per horizon cohort, so a persistent tilt in one direction is worth checking against realised outcomes."
    >
      <BarChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
          domain={axis?.domain ?? ["auto", "auto"]}
          ticks={axis?.ticks}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={44}
          tickFormatter={(value: number) => `${value.toFixed(0)}%`}
        />
        <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} />
        <Tooltip
          cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as WidthRow;
            const upside = row.skew > 0;
            const flat = row.skew === 0;
            return (
              <TooltipShell title={`Day ${row.horizon}`} subtitle={formatDate(row.target_date)}>
                <TooltipRow
                  label={
                    flat
                      ? "Symmetric"
                      : upside
                        ? "Upside-heavy (cedi weaker)"
                        : "Downside-heavy (cedi firmer)"
                  }
                  value={formatPercent(row.skew, 1, true)}
                  color={flat ? undefined : upside ? "var(--chart-8)" : "var(--chart-1)"}
                  emphasis
                />
              </TooltipShell>
            );
          }}
        />
        <Bar dataKey="skew" radius={[2, 2, 2, 2]} isAnimationActive={false}>
          {rows.map((row) => (
            <Cell
              key={row.horizon}
              fill={row.skew >= 0 ? "var(--chart-8)" : "var(--chart-1)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

/** Median path expressed as percent change from the origin spot. */
export function DriftChart({
  rows,
  anchorRate,
  accent = "var(--chart-1)",
  height = 240,
}: {
  rows: WidthRow[];
  anchorRate: number;
  accent?: string;
  height?: number;
}) {
  const data = rows.map((row) => ({
    ...row,
    driftPct: ((row.median - anchorRate) / anchorRate) * 100,
    upperPct: null,
  }));

  return (
    <ChartFrame
      title="Median drift from today's spot"
      description="Cumulative percentage move implied by the median path, measured from the latest observed rate."
      height={height}
      footnote="Above zero the model expects the cedi to weaken against this currency; below zero it expects the cedi to firm."
    >
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
          width={48}
          tickFormatter={(value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}%`}
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <Tooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as WidthRow & { driftPct: number };
            return (
              <TooltipShell title={`Day ${row.horizon}`} subtitle={formatDate(row.target_date)}>
                <TooltipRow
                  label="Drift from spot"
                  value={formatPercent(row.driftPct, 2, true)}
                  emphasis
                  color={accent}
                />
                <TooltipRow label="Median" value={formatRate(row.median)} />
              </TooltipShell>
            );
          }}
        />
        <Line
          dataKey="driftPct"
          stroke={accent}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartFrame>
  );
}
