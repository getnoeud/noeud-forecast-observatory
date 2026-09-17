"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
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
import { formatDuration, formatInteger, formatUsd, titleCase } from "@/lib/format";

const RETRIEVAL = "var(--chart-1)";
const ANALYSIS = "var(--chart-7)";

export type StageRow = {
  pair: string;
  retrieval: number;
  analysis: number;
  total: number;
};

/** Gateway spend per pair, split by the two calls each assessment makes. */
export function StageCostChart({
  rows,
  height = 240,
  unit = "usd",
}: {
  rows: StageRow[];
  height?: number;
  unit?: "usd" | "seconds" | "tokens";
}) {
  const formatValue = (value: number | undefined) =>
    unit === "usd"
      ? formatUsd(value, 4)
      : unit === "seconds"
        ? formatDuration(value)
        : formatInteger(value);

  const title =
    unit === "usd"
      ? "Gateway cost per assessment"
      : unit === "seconds"
        ? "Call latency per assessment"
        : "Token usage per assessment";

  const description =
    unit === "usd"
      ? "Reported OpenRouter cost for the two calls that make up one pair's daily assessment."
      : unit === "seconds"
        ? "Wall-clock latency of the bounded news search and the structured analysis call."
        : "Prompt plus completion tokens reported by the gateway for each stage.";

  return (
    <ChartFrame
      title={title}
      description={description}
      legend={[
        { label: "Retrieval (Perplexity search)", color: RETRIEVAL, shape: "area" },
        { label: "Analysis (structured scorer)", color: ANALYSIS, shape: "area" },
      ]}
      height={height}
      footnote="One full daily cycle is three pairs × two calls = six gateway calls. Costs are what the gateway reported, not an estimate."
    >
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} vertical horizontal={false} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          tickFormatter={(value: number) =>
            unit === "usd" ? `$${value.toFixed(3)}` : unit === "seconds" ? `${value.toFixed(0)}s` : `${(value / 1000).toFixed(0)}k`
          }
        />
        <YAxis
          type="category"
          dataKey="pair"
          tickLine={false}
          axisLine={false}
          tick={{ ...AXIS_TICK, fontFamily: "var(--font-mono)" }}
          width={72}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as StageRow;
            return (
              <TooltipShell title={row.pair}>
                <TooltipRow label="Retrieval" value={formatValue(row.retrieval)} color={RETRIEVAL} />
                <TooltipRow label="Analysis" value={formatValue(row.analysis)} color={ANALYSIS} />
                <TooltipRow label="Total" value={formatValue(row.total)} emphasis />
              </TooltipShell>
            );
          }}
        />
        <Bar
          dataKey="retrieval"
          stackId="stage"
          fill={RETRIEVAL}
          isAnimationActive={false}
          radius={[3, 0, 0, 3]}
        />
        <Bar
          dataKey="analysis"
          stackId="stage"
          fill={ANALYSIS}
          isAnimationActive={false}
          radius={[0, 3, 3, 0]}
        />
      </BarChart>
    </ChartFrame>
  );
}

export type CategoryRow = { label: string; count: number; color?: string };

/** Horizontal counts — used for evidence relevance, source type, event type. */
export function CategoryBarChart({
  rows,
  title,
  description,
  footnote,
  color = "var(--chart-1)",
  height = 200,
}: {
  rows: CategoryRow[];
  title: string;
  description?: string;
  footnote?: string;
  color?: string;
  height?: number;
}) {
  return (
    <ChartFrame title={title} description={description} footnote={footnote} height={height}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} vertical horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tick={AXIS_TICK} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={132}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as CategoryRow;
            return (
              <TooltipShell title={titleCase(row.label)}>
                <TooltipRow label="Evidence items" value={formatInteger(row.count)} emphasis />
              </TooltipShell>
            );
          }}
        />
        <Bar dataKey="count" radius={[0, 3, 3, 0]} isAnimationActive={false} barSize={18}>
          {rows.map((row) => (
            <Cell key={row.label} fill={row.color ?? color} />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

export type EvidenceProfileRow = { axis: string; value: number };

/**
 * A compact profile of how one assessment's evidence was composed. Each axis is
 * a count, so the shape is comparable between pairs on the same day.
 */
export function EvidenceProfileChart({
  series,
  height = 260,
}: {
  series: { name: string; color: string; rows: EvidenceProfileRow[] }[];
  height?: number;
}) {
  const axes = series[0]?.rows.map((row) => row.axis) ?? [];
  const data = axes.map((axis) => {
    const row: Record<string, string | number> = { axis };
    for (const entry of series) {
      row[entry.name] = entry.rows.find((item) => item.axis === axis)?.value ?? 0;
    }
    return row;
  });

  return (
    <ChartFrame
      title="Evidence composition by pair"
      description="How many items of each kind the retriever returned and the scorer accepted for today's assessment."
      legend={series.map((entry) => ({ label: entry.name, color: entry.color, shape: "line" }))}
      height={height}
      footnote="Accepted items are the ones inside the freshness window with a usable mechanism; rejected items are listed in full under the evidence table."
    >
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="var(--grid)" />
        <PolarAngleAxis dataKey="axis" tick={{ ...AXIS_TICK, fontSize: 10 }} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as Record<string, string | number>;
            return (
              <TooltipShell title={String(row.axis)}>
                {series.map((entry) => (
                  <TooltipRow
                    key={entry.name}
                    label={entry.name}
                    value={formatInteger(Number(row[entry.name]))}
                    color={entry.color}
                  />
                ))}
              </TooltipShell>
            );
          }}
        />
        {series.map((entry) => (
          <Radar
            key={entry.name}
            dataKey={entry.name}
            stroke={entry.color}
            fill={entry.color}
            fillOpacity={0.1}
            strokeWidth={2}
            isAnimationActive={false}
          />
        ))}
      </RadarChart>
    </ChartFrame>
  );
}

/** Decision mix across recent assessments. */
export function DecisionMixChart({
  rows,
  height = 200,
}: {
  rows: CategoryRow[];
  height?: number;
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return (
    <ChartFrame
      title="Decision mix"
      description={`How the ${total} recorded assessments resolved.`}
      legend={rows.map((row) => ({ label: row.label, color: row.color, shape: "area" as const }))}
      height={height}
      footnote="`review_adjustment` is only ever a proposal. Publication remains a separate, explicitly approved step."
    >
      <PieChart>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as CategoryRow;
            return (
              <TooltipShell title={row.label}>
                <TooltipRow label="Assessments" value={formatInteger(row.count)} emphasis />
                <TooltipRow
                  label="Share"
                  value={`${((row.count / total) * 100).toFixed(0)}%`}
                />
              </TooltipShell>
            );
          }}
        />
        <Pie
          data={rows}
          dataKey="count"
          nameKey="label"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
          stroke="var(--card)"
          strokeWidth={2}
          isAnimationActive={false}
        >
          {rows.map((row) => (
            <Cell key={row.label} fill={row.color ?? "var(--chart-1)"} />
          ))}
        </Pie>
      </PieChart>
    </ChartFrame>
  );
}
