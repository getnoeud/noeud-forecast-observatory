"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ForecastEvaluationItem } from "@/lib/types";

const chartConfig = {
  count: {
    label: "Forecasts",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function buildHistogram(rows: ForecastEvaluationItem[], bins = 12) {
  const errors = rows.map((r) => r.signed_error);
  const min = Math.min(...errors);
  const max = Math.max(...errors);
  const range = max - min || 1;
  const binWidth = range / bins;

  const buckets = Array.from({ length: bins }, (_, i) => ({
    binStart: min + i * binWidth,
    binEnd: min + (i + 1) * binWidth,
    label: (min + (i + 0.5) * binWidth).toFixed(3),
    count: 0,
  }));

  for (const err of errors) {
    const idx = Math.min(Math.floor((err - min) / binWidth), bins - 1);
    buckets[idx].count++;
  }

  return buckets;
}

export function ErrorDistributionChart({
  rows,
}: {
  rows: ForecastEvaluationItem[];
}) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Distribution</CardTitle>
          <CardDescription>No matured errors available yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const histogram = buildHistogram(rows);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Distribution</CardTitle>
        <CardDescription>
          Distribution of signed prediction errors - positive means
          over-predicted, negative means under-predicted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <BarChart
            data={histogram}
            margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              className="stroke-border"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const item = payload?.[0]?.payload as
                      | { binStart?: number; binEnd?: number }
                      | undefined
                    if (
                      item?.binStart === undefined ||
                      item?.binEnd === undefined
                    ) {
                      return "Signed Error Range"
                    }
                    return `Signed error from ${item.binStart.toFixed(4)} to ${item.binEnd.toFixed(4)}`
                  }}
                  valueFormatter={(value) => `${Number(value)} forecasts`}
                />
              }
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {histogram.map((entry, index) => {
                const midpoint = (entry.binStart + entry.binEnd) / 2;
                return (
                  <Cell
                    key={index}
                    fill={
                      midpoint > 0
                        ? "var(--chart-2)"
                        : midpoint < 0
                          ? "var(--chart-3)"
                          : "var(--chart-1)"
                    }
                    fillOpacity={0.85}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
