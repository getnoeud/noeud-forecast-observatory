"use client";

import * as React from "react";
import {
  Area,
  CartesianGrid,
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
  type LegendEntry,
} from "@/components/charts/frame";
import { niceDomain, type TrackRow } from "@/lib/analytics";
import { formatDate, formatPercent, formatRate, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const CHRONOS = "var(--chart-1)";
const BOOTSTRAP = "var(--chart-2)";

type BandMode = "none" | "chronos" | "both";

function BandToggle({
  value,
  onChange,
}: {
  value: BandMode;
  onChange: (value: BandMode) => void;
}) {
  const options: { value: BandMode; label: string }[] = [
    { value: "none", label: "Medians" },
    { value: "chronos", label: "+ Chronos 90%" },
    { value: "both", label: "+ both 90%" },
  ];
  return (
    <div
      role="group"
      aria-label="Interval overlay"
      className="inline-flex items-center gap-0.5 rounded-lg border bg-card p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-2 py-1 text-[0.7rem] font-medium transition-colors",
            option.value === value
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * The tracking chart: what actually happened, against what each model family
 * was saying about that same date.
 *
 * Both model lines are drawn by target date, so a point on the Chronos line
 * left of today is a forecast that has already been tested against the observed
 * line beside it.
 */
export function TrackChart({
  rows,
  todayDate,
  title = "Observed against both model views",
  description = "Every calendar date carries the realised rate, the Chronos median that covered it, and the bootstrap median that covered it. Left of the marker all three are settled; right of it only the models have an opinion.",
  footnote,
  height = 400,
}: {
  rows: TrackRow[];
  todayDate?: string | null;
  title?: string;
  description?: React.ReactNode;
  footnote?: React.ReactNode;
  height?: number;
}) {
  const [bands, setBands] = React.useState<BandMode>("chronos");

  const axis = React.useMemo(() => {
    const values: number[] = [];
    for (const row of rows) {
      if (row.actual !== null) values.push(row.actual);
      if (row.chronos !== null) values.push(row.chronos);
      if (row.bootstrap !== null) values.push(row.bootstrap);
      if (bands !== "none" && row.chronosBand) values.push(...row.chronosBand);
      if (bands === "both" && row.bootstrapBand) values.push(...row.bootstrapBand);
    }
    return niceDomain(values, 6);
  }, [rows, bands]);

  const legend: LegendEntry[] = [
    { label: "Observed rate", color: "var(--foreground)", shape: "line" },
    { label: "Chronos-2 median", color: CHRONOS, shape: "dash" },
    { label: "Bootstrap median", color: BOOTSTRAP, shape: "dash" },
    ...(bands !== "none"
      ? ([{ label: "Chronos 90%", color: CHRONOS, shape: "area" }] as LegendEntry[])
      : []),
    ...(bands === "both"
      ? ([{ label: "Bootstrap 90%", color: BOOTSTRAP, shape: "area" }] as LegendEntry[])
      : []),
  ];

  return (
    <ChartFrame
      title={title}
      description={description}
      legend={legend}
      toolbar={<BandToggle value={bands} onChange={setBands} />}
      footnote={footnote}
      height={height}
    >
      <ComposedChart data={rows} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          minTickGap={44}
          tickFormatter={formatShortDate}
        />
        <YAxis
          domain={axis?.domain ?? ["auto", "auto"]}
          ticks={axis?.ticks}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={56}
          tickFormatter={(value: number) => value.toFixed(2)}
        />
        <Tooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1, strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as TrackRow;
            const chronosMiss =
              row.actual !== null && row.chronos !== null
                ? ((row.actual - row.chronos) / row.chronos) * 100
                : null;
            const bootstrapMiss =
              row.actual !== null && row.bootstrap !== null
                ? ((row.actual - row.bootstrap) / row.bootstrap) * 100
                : null;
            return (
              <TooltipShell title={formatDate(row.date)}>
                {row.actual !== null ? (
                  <TooltipRow
                    label="Observed"
                    value={formatRate(row.actual)}
                    color="var(--foreground)"
                    emphasis
                  />
                ) : null}
                {row.chronos !== null ? (
                  <TooltipRow
                    label={`Chronos (D${row.chronosHorizon ?? "—"} of ${formatShortDate(row.chronosOrigin)})`}
                    value={formatRate(row.chronos)}
                    color={CHRONOS}
                  />
                ) : null}
                {chronosMiss !== null ? (
                  <TooltipRow label="Chronos miss" value={formatPercent(chronosMiss, 2, true)} />
                ) : null}
                {row.bootstrap !== null ? (
                  <TooltipRow
                    label={`Bootstrap (D${row.bootstrapHorizon ?? "—"} of ${formatShortDate(row.bootstrapOrigin)})`}
                    value={formatRate(row.bootstrap)}
                    color={BOOTSTRAP}
                  />
                ) : null}
                {bootstrapMiss !== null ? (
                  <TooltipRow
                    label="Bootstrap miss"
                    value={formatPercent(bootstrapMiss, 2, true)}
                  />
                ) : null}
              </TooltipShell>
            );
          }}
        />

        {bands === "both" ? (
          <Area
            dataKey="bootstrapBand"
            stroke="none"
            fill={BOOTSTRAP}
            fillOpacity={0.12}
            isAnimationActive={false}
            connectNulls
          />
        ) : null}
        {bands !== "none" ? (
          <Area
            dataKey="chronosBand"
            stroke="none"
            fill={CHRONOS}
            fillOpacity={0.14}
            isAnimationActive={false}
            connectNulls
          />
        ) : null}

        {todayDate ? (
          <ReferenceLine
            x={todayDate}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{
              value: "latest observation",
              position: "insideTopLeft",
              fill: "var(--muted-foreground)",
              fontSize: 10,
            }}
          />
        ) : null}

        <Line
          dataKey="chronos"
          stroke={CHRONOS}
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
          connectNulls
          isAnimationActive={false}
        />
        <Line
          dataKey="bootstrap"
          stroke={BOOTSTRAP}
          strokeWidth={2}
          strokeDasharray="2 3"
          dot={false}
          connectNulls
          isAnimationActive={false}
        />
        <Line
          dataKey="actual"
          stroke="var(--foreground)"
          strokeWidth={2}
          dot={false}
          connectNulls
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartFrame>
  );
}
