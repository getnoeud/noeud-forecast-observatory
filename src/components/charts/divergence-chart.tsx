"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
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
import type { DivergenceRow } from "@/lib/analytics";
import { formatDate, formatPercent, formatRate, formatShortDate } from "@/lib/format";

const WEEKLY = "var(--chart-1)";
const DAILY = "var(--chart-2)";

/**
 * The two model families on one scale, aligned by target date. The bootstrap's
 * day 1 is the Chronos vintage's day N for the same calendar date, so horizon
 * index is never the join key.
 */
export function ModelComparisonChart({
  rows,
  height = 280,
}: {
  rows: DivergenceRow[];
  height?: number;
}) {
  const data = rows.filter((row) => row.weeklyMedian !== null || row.dailyMedian !== null);

  return (
    <ChartFrame
      title="Weekly Chronos-2 against the daily bootstrap"
      description="Both median paths on the same calendar dates. Overlap is the useful signal: agreement means the week-old vintage still describes today's market."
      legend={[
        { label: "Weekly Chronos-2 median", color: WEEKLY, shape: "line" },
        { label: "Daily bootstrap median", color: DAILY, shape: "dash" },
        ...(hasWeekendBands(data.map((row) => row.target_date)) ? [WEEKEND_LEGEND] : []),
      ]}
      height={height}
      footnote="Only dates present in both vintages can be compared; the bootstrap is re-issued every day, so it runs further into the future than the Monday path."
    >
      <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis
          dataKey="target_date"
          scale="band"
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          minTickGap={40}
          tickFormatter={formatShortDate}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={56}
          domain={["auto", "auto"]}
          tickFormatter={(value: number) => value.toFixed(2)}
        />
        <Tooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as DivergenceRow;
            return (
              <TooltipShell title={formatDate(row.target_date)}>
                <TooltipRow
                  label={`Chronos (D${row.weeklyHorizon ?? "—"})`}
                  value={formatRate(row.weeklyMedian)}
                  color={WEEKLY}
                />
                <TooltipRow
                  label={`Bootstrap (D${row.dailyHorizon ?? "—"})`}
                  value={formatRate(row.dailyMedian)}
                  color={DAILY}
                />
                <TooltipRow
                  label="Bootstrap − Chronos"
                  value={formatPercent(row.deltaPct, 2, true)}
                  emphasis
                />
              </TooltipShell>
            );
          }}
        />
        {weekendBands(data.map((row) => row.target_date))}
        {/*
          Weekly is solid and drawn first; daily is dashed and drawn on top so
          its gaps reveal weekly beneath. When the two series nearly coincide
          that dash pattern alone reads as "daily is missing" — the dot markers
          are what actually keeps the bootstrap visible on an unbroken line.
        */}
        <Line
          dataKey="weeklyMedian"
          stroke={WEEKLY}
          strokeWidth={2}
          dot={false}
          connectNulls
          isAnimationActive={false}
        />
        <Line
          dataKey="dailyMedian"
          stroke={DAILY}
          strokeWidth={2.25}
          strokeDasharray="5 4"
          dot={{ r: 2.5, strokeWidth: 0, fill: DAILY }}
          activeDot={{ r: 4, strokeWidth: 0, fill: DAILY }}
          connectNulls
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartFrame>
  );
}

/** Signed disagreement between the families, in percent of the Chronos median. */
export function DivergenceBarChart({
  rows,
  height = 220,
}: {
  rows: DivergenceRow[];
  height?: number;
}) {
  const data = rows.filter((row) => row.deltaPct !== null);

  return (
    <ChartFrame
      title="Disagreement between the two families"
      description="Daily bootstrap median minus the weekly Chronos median, as a percentage of the Chronos value."
      legend={[
        { label: "Bootstrap above Chronos", color: "var(--chart-2)", shape: "area" },
        { label: "Bootstrap below Chronos", color: "var(--chart-1)", shape: "area" },
        ...(hasWeekendBands(data.map((row) => row.target_date)) ? [WEEKEND_LEGEND] : []),
      ]}
      height={height}
      footnote="The event-intelligence packet treats a difference of this size as descriptive context, not as a trained break detector. The publication policy only acts above 1% absolute, and only on dates inside the current issuance week."
    >
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis
          dataKey="target_date"
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          minTickGap={30}
          tickFormatter={formatShortDate}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={48}
          tickFormatter={(value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}%`}
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <ReferenceLine
          y={1}
          stroke="var(--warning)"
          strokeDasharray="4 4"
          label={{ value: "policy 1%", position: "right", fill: "var(--warning)", fontSize: 10 }}
        />
        <ReferenceLine y={-1} stroke="var(--warning)" strokeDasharray="4 4" />
        <Tooltip
          cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as DivergenceRow;
            return (
              <TooltipShell title={formatDate(row.target_date)}>
                <TooltipRow
                  label="Difference"
                  value={formatPercent(row.deltaPct, 2, true)}
                  emphasis
                />
                <TooltipRow label="Chronos" value={formatRate(row.weeklyMedian)} color={WEEKLY} />
                <TooltipRow label="Bootstrap" value={formatRate(row.dailyMedian)} color={DAILY} />
              </TooltipShell>
            );
          }}
        />
        {weekendBands(data.map((row) => row.target_date))}
        <Bar dataKey="deltaPct" radius={[2, 2, 2, 2]} isAnimationActive={false}>
          {data.map((row) => (
            <Cell
              key={row.target_date}
              fill={(row.deltaPct ?? 0) >= 0 ? "var(--chart-2)" : "var(--chart-1)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}
