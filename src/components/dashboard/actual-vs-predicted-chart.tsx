"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatDate, formatNumber } from "@/lib/format";
import type { ForecastEvaluationItem } from "@/lib/types";

const chartConfig = {
  actual_rate: {
    label: "Actual",
    color: "var(--chart-1)",
  },
  predicted_rate: {
    label: "Adjusted",
    color: "var(--chart-2)",
  },
  quant_forecast: {
    label: "Quant",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function ActualVsPredictedChart({ rows }: { rows: ForecastEvaluationItem[] }) {
  const chartData = rows
    .slice()
    .reverse()
    .map((row) => ({
      date: row.resolved_actual_date,
      predicted_rate: row.predicted_rate,
      actual_rate: row.actual_rate,
      quant_forecast: row.quant_forecast,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Predicted vs Actual</CardTitle>
        <CardDescription>
          Final-day forecast compared against realized rates for matured rows
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No matured forecast rows yet for predicted-vs-actual comparison.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
                }}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) => formatNumber(v, 4)}
                className="text-xs"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => formatDate(String(label))}
                    valueFormatter={(value) => formatNumber(Number(value), 4)}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="actual_rate"
                stroke="var(--color-actual_rate)"
                strokeWidth={2.5}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="predicted_rate"
                stroke="var(--color-predicted_rate)"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="quant_forecast"
                stroke="var(--color-quant_forecast)"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
