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
  ToggleChip,
  TooltipRow,
  TooltipShell,
  type LegendEntry,
} from "@/components/charts/frame";
import { filledMarker } from "@/components/charts/markers";
import { hasWeekendBands, WEEKEND_LEGEND, weekendBands } from "@/components/charts/weekend";
import { FAN_BANDS, niceDomain, type FanRow } from "@/lib/analytics";
import { formatDate, formatPercent, formatRate, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Depth of shade by band rank: darkest at the median, palest in the tails. */
const SHADE_FILL: Record<number, string> = {
  1: "var(--seq-100)",
  2: "var(--seq-200)",
  3: "var(--seq-300)",
  4: "var(--seq-400)",
};

const SHADE_OPACITY: Record<number, number> = { 1: 0.4, 2: 0.55, 3: 0.7, 4: 0.85 };

const ADJUSTMENT_COLOR = "var(--serious)";

const COVERAGE = {
  "50": { bands: ["b4", "b5"], lower: "q25", upper: "q75", label: "50%" },
  "90": { bands: ["b2", "b3", "b4", "b5", "b6", "b7"], lower: "q05", upper: "q95", label: "90%" },
  "98": {
    bands: ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8"],
    lower: "q01",
    upper: "q99",
    label: "98%",
  },
} as const;

type CoverageKey = keyof typeof COVERAGE;

function FanTooltip({
  active,
  payload,
  anchorRate,
  accent,
  adjustmentByDate,
}: {
  active?: boolean;
  payload?: { payload: FanRow & { __adjustedRate?: number | null } }[];
  anchorRate?: number | null;
  accent: string;
  adjustmentByDate?: Map<string, { rate: number; base: number; deltaPct: number }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const hasFan = row.median !== null && row.horizon !== null;
  const adjustment = adjustmentByDate?.get(row.date);

  return (
    <TooltipShell
      title={formatDate(row.date)}
      subtitle={
        hasFan ? `Forecast day ${row.horizon}` : row.actual !== null ? "Observed" : undefined
      }
    >
      {row.actual !== null ? (
        <TooltipRow
          label="Observed"
          value={formatRate(row.actual)}
          color="var(--foreground)"
          emphasis
        />
      ) : null}
      {hasFan ? (
        <>
          <TooltipRow
            label="Median (q50)"
            value={formatRate(row.median)}
            color={accent}
            emphasis
          />
          <TooltipRow
            label="50% band"
            value={`${formatRate(row.q25)} – ${formatRate(row.q75)}`}
            color="var(--seq-400)"
          />
          <TooltipRow label="90% band" value={`${formatRate(row.q05)} – ${formatRate(row.q95)}`} />
          <TooltipRow label="98% band" value={`${formatRate(row.q01)} – ${formatRate(row.q99)}`} />
          {anchorRate && row.median ? (
            <TooltipRow
              label="Vs latest spot"
              value={formatPercent(((row.median - anchorRate) / anchorRate) * 100, 2, true)}
            />
          ) : null}
          {row.realisedError !== null ? (
            <TooltipRow label="Realised − median" value={formatRate(row.realisedError)} emphasis />
          ) : null}
        </>
      ) : null}
      {adjustment ? (
        <TooltipRow
          label="LLM selected"
          value={`${formatRate(adjustment.rate)} (${formatPercent(adjustment.deltaPct, 2, true)})`}
          color={ADJUSTMENT_COLOR}
          emphasis
        />
      ) : null}
    </TooltipShell>
  );
}

function CoverageToggle({
  value,
  onChange,
}: {
  value: CoverageKey;
  onChange: (value: CoverageKey) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Interval coverage"
      className="inline-flex items-center gap-0.5 rounded-lg border bg-card p-0.5"
    >
      {(Object.keys(COVERAGE) as CoverageKey[]).map((key) => (
        <button
          key={key}
          aria-pressed={key === value}
          onClick={() => onChange(key)}
          className={cn(
            "rounded-md px-2 py-1 font-mono text-[0.7rem] font-medium transition-colors",
            key === value
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {COVERAGE[key].label}
        </button>
      ))}
    </div>
  );
}

export function ForecastFanChart({
  rows,
  anchorDate,
  anchorLabel = "origin",
  earlierOrigins = [],
  anchorRate,
  title,
  description,
  footnote,
  toolbar,
  accent = "var(--chart-8)",
  height = 380,
  defaultCoverage = "90",
  adjustments = [],
}: {
  rows: FanRow[];
  anchorDate?: string | null;
  anchorLabel?: string;
  /** Start dates of earlier vintages whose paths are still drawn, marked without a label. */
  earlierOrigins?: string[];
  anchorRate?: number | null;
  title: React.ReactNode;
  description?: React.ReactNode;
  footnote?: React.ReactNode;
  toolbar?: React.ReactNode;
  accent?: string;
  height?: number;
  defaultCoverage?: CoverageKey;
  /** Dates where the publication policy selected the LLM's proposed rate over the base median. */
  adjustments?: { date: string; rate: number; base: number; deltaPct: number }[];
}) {
  const [coverage, setCoverage] = React.useState<CoverageKey>(defaultCoverage);
  const active = COVERAGE[coverage];
  const visibleBands = React.useMemo(
    () => FAN_BANDS.filter((band) => (active.bands as readonly string[]).includes(band.key)),
    [active],
  );

  const axis = React.useMemo(() => {
    const values: number[] = [];
    for (const row of rows) {
      if (row.actual !== null) values.push(row.actual);
      if (row[active.lower] !== null) values.push(row[active.lower] as number);
      if (row[active.upper] !== null) values.push(row[active.upper] as number);
    }
    return niceDomain(values, 6);
  }, [rows, active]);

  const dates = React.useMemo(() => rows.map((row) => row.date), [rows]);
  const showWeekends = hasWeekendBands(dates);

  const adjustmentByDate = React.useMemo(
    () => new Map(adjustments.map((item) => [item.date, item])),
    [adjustments],
  );
  const [showAdjustments, setShowAdjustments] = React.useState(true);
  const data = React.useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        __adjustedRate: showAdjustments ? (adjustmentByDate.get(row.date)?.rate ?? null) : null,
      })),
    [rows, adjustmentByDate, showAdjustments],
  );

  const legend: LegendEntry[] = [
    { label: "Observed rate", color: "var(--foreground)", shape: "line" },
    { label: "Forecast median", color: accent, shape: "dash" },
    { label: "50% band", color: "var(--seq-400)", shape: "area" },
    ...(coverage === "50"
      ? []
      : ([{ label: "90% band", color: "var(--seq-300)", shape: "area" }] as LegendEntry[])),
    ...(coverage === "98"
      ? ([{ label: "98% band", color: "var(--seq-100)", shape: "area" }] as LegendEntry[])
      : []),
    ...(showWeekends ? [WEEKEND_LEGEND] : []),
    ...(adjustments.length && showAdjustments
      ? ([{ label: "LLM-selected rate", color: ADJUSTMENT_COLOR, marker: "diamond" }] as LegendEntry[])
      : []),
  ];

  return (
    <ChartFrame
      title={title}
      description={description}
      legend={legend}
      toolbar={
        <>
          {toolbar}
          {adjustments.length ? (
            <ToggleChip
              active={showAdjustments}
              onClick={() => setShowAdjustments((value) => !value)}
              color={ADJUSTMENT_COLOR}
            >
              LLM adjustment
            </ToggleChip>
          ) : null}
          <CoverageToggle value={coverage} onChange={setCoverage} />
        </>
      }
      footnote={footnote}
      height={height}
    >
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis
          dataKey="date"
          scale="band"
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
          content={
            <FanTooltip anchorRate={anchorRate} accent={accent} adjustmentByDate={adjustmentByDate} />
          }
        />

        {weekendBands(dates)}
        {visibleBands.map((band) => (
          <Area
            key={band.key}
            dataKey={band.key}
            activeDot={false}
            stroke="none"
            fill={SHADE_FILL[band.shade]}
            fillOpacity={SHADE_OPACITY[band.shade]}
            isAnimationActive={false}
            connectNulls
          />
        ))}

        {earlierOrigins
          .filter((origin) => origin !== anchorDate)
          .map((origin) => (
            <ReferenceLine
              key={`origin-${origin}`}
              x={origin}
              stroke="var(--muted-foreground)"
              strokeOpacity={0.5}
              strokeDasharray="2 4"
              strokeWidth={1}
            />
          ))}
        {anchorDate ? (
          <ReferenceLine
            x={anchorDate}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{
              value: anchorLabel,
              position: "insideTopLeft",
              fill: "var(--muted-foreground)",
              fontSize: 10,
            }}
          />
        ) : null}

        <Line
          dataKey="median"
          stroke={accent}
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
        <Line
          dataKey="actual"
          stroke="var(--foreground)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
        {showAdjustments ? (
          <Line
            dataKey="__adjustedRate"
            stroke="none"
            dot={filledMarker("diamond", ADJUSTMENT_COLOR)}
            isAnimationActive={false}
            connectNulls={false}
          />
        ) : null}
      </ComposedChart>
    </ChartFrame>
  );
}
