"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import {
  AXIS_TICK,
  ChartFrame,
  GRID_PROPS,
  TooltipRow,
  TooltipShell,
} from "@/components/charts/frame";
import { PAIR_COLOR_VAR } from "@/components/obs/badges";
import { formatDate, formatInteger, formatPercent, formatRate, formatShortDate } from "@/lib/format";
import { PAIRS, type Pair } from "@/lib/types";

export type CohortRow = { label: string } & Partial<Record<Pair, number>> &
  Partial<Record<`${Pair}_n`, number>>;

const PAIR_LEGEND = PAIRS.map((pair) => ({
  label: pair,
  color: PAIR_COLOR_VAR[pair],
  shape: "area" as const,
}));

/** Mean absolute percentage error per horizon cohort, one bar group per cohort. */
export function ErrorByCohortChart({
  rows,
  height = 260,
  title = "Absolute error by horizon cohort",
  description = "Mean absolute percentage error of the median path, grouped the same way the release gate groups horizons.",
  unit = "%",
}: {
  rows: CohortRow[];
  height?: number;
  title?: string;
  description?: string;
  unit?: string;
}) {
  return (
    <ChartFrame
      title={title}
      description={description}
      legend={PAIR_LEGEND}
      height={height}
      footnote="Day 1–7, 8–14, 15–21 and 22–30 are the cohorts the model gate evaluates separately, so a long-horizon failure cannot be averaged away by short horizons."
    >
      <BarChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={48}
          tickFormatter={(value: number) => `${value.toFixed(2)}${unit}`}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as CohortRow;
            return (
              <TooltipShell title={row.label}>
                {PAIRS.map((pair) =>
                  row[pair] === undefined ? null : (
                    <TooltipRow
                      key={pair}
                      label={`${pair} (n=${formatInteger(row[`${pair}_n`])})`}
                      value={`${(row[pair] as number).toFixed(3)}${unit}`}
                      color={PAIR_COLOR_VAR[pair]}
                    />
                  ),
                )}
              </TooltipShell>
            );
          }}
        />
        {PAIRS.map((pair) => (
          <Bar
            key={pair}
            dataKey={pair}
            fill={PAIR_COLOR_VAR[pair]}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ChartFrame>
  );
}

/** Empirical coverage against the nominal 90% interval. */
export function CoverageChart({ rows, height = 240 }: { rows: CohortRow[]; height?: number }) {
  return (
    <ChartFrame
      title="Realised coverage of the 90% interval"
      description="Share of matured target dates whose observed rate fell inside q05–q95."
      legend={[
        ...PAIR_LEGEND,
        { label: "Nominal 90%", color: "var(--muted-foreground)", shape: "dash" },
      ]}
      height={height}
      footnote="Coverage far above 90% means the intervals are wider than they need to be; far below means they are overconfident. Both are gate failures even when the median looks accurate."
    >
      <BarChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <YAxis
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={44}
          tickFormatter={(value: number) => `${value}%`}
        />
        <ReferenceArea y1={80} y2={100} fill="var(--good)" fillOpacity={0.05} />
        <ReferenceLine
          y={90}
          stroke="var(--muted-foreground)"
          strokeDasharray="4 4"
          label={{ value: "90%", position: "right", fill: "var(--muted-foreground)", fontSize: 10 }}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as CohortRow;
            return (
              <TooltipShell title={row.label}>
                {PAIRS.map((pair) =>
                  row[pair] === undefined ? null : (
                    <TooltipRow
                      key={pair}
                      label={`${pair} (n=${formatInteger(row[`${pair}_n`])})`}
                      value={formatPercent(row[pair], 1)}
                      color={PAIR_COLOR_VAR[pair]}
                    />
                  ),
                )}
              </TooltipShell>
            );
          }}
        />
        {PAIRS.map((pair) => (
          <Bar
            key={pair}
            dataKey={pair}
            fill={PAIR_COLOR_VAR[pair]}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ChartFrame>
  );
}

export type RealisedRow = {
  target_date: string;
  horizon: number;
  pair: Pair;
  kind: string;
  q05: number;
  q50: number;
  q95: number;
  observed_rate: number;
  signed_error: number;
  absolute_percentage_error: number;
  inside_90: boolean;
};

/**
 * Signed error per matured target date, one bar per pair.
 *
 * Colour follows the pair, not the sign: several pairs mature on the same date,
 * so a sign-coloured bar would leave three identical labels with no way to tell
 * which currency each belongs to. Direction is read from the bar itself.
 */
export function RealisedErrorChart({
  rows,
  height = 260,
}: {
  rows: RealisedRow[];
  height?: number;
}) {
  const data = React.useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>();
    for (const row of rows) {
      const entry = byDate.get(row.target_date) ?? { target_date: row.target_date };
      entry[row.pair] = ((row.observed_rate - row.q50) / row.q50) * 100;
      entry[`${row.pair}_h`] = row.horizon;
      entry[`${row.pair}_in`] = row.inside_90 ? "yes" : "no";
      entry[`${row.pair}_obs`] = row.observed_rate;
      entry[`${row.pair}_med`] = row.q50;
      byDate.set(row.target_date, entry);
    }
    return Array.from(byDate.values()).sort((a, b) =>
      String(a.target_date).localeCompare(String(b.target_date)),
    );
  }, [rows]);

  return (
    <ChartFrame
      title="Realised error on matured target dates"
      description="Observed rate minus the forecast median, in percent. Above zero the cedi came in weaker than forecast."
      legend={PAIR_LEGEND}
      height={height}
      footnote="This is the observatory's own join of forecast points against canonical observations, so the first days of a live vintage are visible before the pipeline's audited evaluation ledger is written."
    >
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barGap={3}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis
          dataKey="target_date"
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          minTickGap={24}
          tickFormatter={(value: string) => formatShortDate(value)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={50}
          tickFormatter={(value: number) => `${value > 0 ? "+" : ""}${value.toFixed(2)}%`}
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <Tooltip
          cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as Record<string, number | string>;
            return (
              <TooltipShell title={formatDate(String(row.target_date))}>
                {PAIRS.map((pair) =>
                  row[pair] === undefined ? null : (
                    <React.Fragment key={pair}>
                      <TooltipRow
                        label={`${pair} · day ${row[`${pair}_h`]}`}
                        value={formatPercent(row[pair] as number, 3, true)}
                        color={PAIR_COLOR_VAR[pair]}
                        emphasis
                      />
                      <TooltipRow
                        label="observed / median"
                        value={`${formatRate(row[`${pair}_obs`] as number)} / ${formatRate(row[`${pair}_med`] as number)}`}
                      />
                      <TooltipRow label="inside 90%" value={String(row[`${pair}_in`])} />
                    </React.Fragment>
                  ),
                )}
              </TooltipShell>
            );
          }}
        />
        {PAIRS.map((pair) => (
          <Bar
            key={pair}
            dataKey={pair}
            fill={PAIR_COLOR_VAR[pair]}
            radius={[2, 2, 2, 2]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ChartFrame>
  );
}

/** Forecast median against the realised rate — points on the diagonal are exact. */
export function CalibrationScatter({
  rows,
  height = 280,
}: {
  rows: RealisedRow[];
  height?: number;
}) {
  const byPair = PAIRS.map((pair) => ({
    pair,
    data: rows
      .filter((row) => row.pair === pair)
      .map((row) => ({ x: row.q50, y: row.observed_rate, ...row })),
  })).filter((group) => group.data.length);

  const values = rows.flatMap((row) => [row.q50, row.observed_rate]);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const pad = (max - min) * 0.05 || 0.05;

  return (
    <ChartFrame
      title="Forecast median against realised rate"
      description="Every matured target date. Points on the diagonal were forecast exactly; distance from it is the error."
      legend={PAIRS.map((pair) => ({
        label: pair,
        color: PAIR_COLOR_VAR[pair],
        shape: "dot" as const,
      }))}
      height={height}
      footnote="The three pairs sit at different rate levels, so clustering by pair is expected; what matters is the spread around the diagonal within each cluster."
    >
      <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid {...GRID_PROPS} vertical />
        <XAxis
          type="number"
          dataKey="x"
          name="Forecast median"
          domain={[min - pad, max + pad]}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          tickFormatter={(value: number) => value.toFixed(1)}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="Observed"
          domain={[min - pad, max + pad]}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={50}
          tickFormatter={(value: number) => value.toFixed(1)}
        />
        <ZAxis range={[60, 60]} />
        <ReferenceLine
          segment={[
            { x: min - pad, y: min - pad },
            { x: max + pad, y: max + pad },
          ]}
          stroke="var(--muted-foreground)"
          strokeDasharray="4 4"
        />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as RealisedRow;
            return (
              <TooltipShell
                title={formatDate(row.target_date)}
                subtitle={`${row.pair} · day ${row.horizon}`}
              >
                <TooltipRow label="Median" value={formatRate(row.q50)} />
                <TooltipRow label="Observed" value={formatRate(row.observed_rate)} emphasis />
                <TooltipRow
                  label="Absolute error"
                  value={formatPercent(row.absolute_percentage_error, 2)}
                />
              </TooltipShell>
            );
          }}
        />
        {byPair.map((group) => (
          <Scatter
            key={group.pair}
            data={group.data}
            fill={PAIR_COLOR_VAR[group.pair]}
            isAnimationActive={false}
          />
        ))}
      </ScatterChart>
    </ChartFrame>
  );
}
