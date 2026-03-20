"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatNumber, formatPercent } from "@/lib/format";
import type { EvaluationPairSummary } from "@/lib/types";

const chartConfig = {
  matured_count: {
    label: "Evaluations",
    color: "var(--chart-1)",
  },
  directional_hit_rate: {
    label: "Hit Rate",
    color: "var(--chart-2)",
  },
  sentiment_improvement_rate: {
    label: "Sentiment Win Rate",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const palette = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function OverviewInsightCharts({
  rows,
}: {
  rows: EvaluationPairSummary[];
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 px-4 lg:grid-cols-3 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Share by Pair</CardTitle>
          <CardDescription>
            Which pairs are contributing the most matured evaluation rows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `Currency Pair: ${String(value)}`}
                    valueFormatter={(value) => formatNumber(Number(value), 0)}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Pie
                data={rows}
                dataKey="matured_count"
                nameKey="currency_pair"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={4}
              >
                {rows.map((row, index) => (
                  <Cell
                    key={row.currency_pair}
                    fill={palette[index % palette.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Directional Accuracy by Pair</CardTitle>
          <CardDescription>
            Quick comparison of hit rate across the currently visible pairs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart data={rows} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="currency_pair" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[0, 100]}
                tickFormatter={(value) => `${Math.round(Number(value))}%`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `Currency Pair: ${String(value)}`}
                    valueFormatter={(value) => formatPercent(Number(value))}
                  />
                }
              />
              <Bar
                dataKey="directional_hit_rate"
                fill="var(--color-directional_hit_rate)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sentiment Lift by Pair</CardTitle>
          <CardDescription>
            How often sentiment-adjusted forecasts beat the quant-only baseline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart data={rows} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="currency_pair" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[0, 100]}
                tickFormatter={(value) => `${Math.round(Number(value))}%`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `Currency Pair: ${String(value)}`}
                    valueFormatter={(value) => formatPercent(Number(value))}
                  />
                }
              />
              <Bar
                dataKey="sentiment_improvement_rate"
                fill="var(--color-sentiment_improvement_rate)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
