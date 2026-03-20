"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
import type { ForecastEvaluationItem, SentimentResponse } from "@/lib/types";

const chartConfig = {
  sentiment_score: {
    label: "Sentiment Score",
    color: "var(--chart-3)",
  },
  sentiment_adjustment: {
    label: "Adjustment",
    color: "var(--chart-2)",
  },
  absolute_error: {
    label: "Absolute Error",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function SentimentImpactChart({
  rows,
  sentiment,
}: {
  rows: ForecastEvaluationItem[];
  sentiment: SentimentResponse[];
}) {
  const sentimentByDate = new Map(sentiment.map((entry) => [entry.date, entry.sentiment_score]));
  const chartData = rows
    .slice()
    .reverse()
    .map((row) => ({
      date: row.forecast_date,
      sentiment_score: sentimentByDate.get(row.forecast_date) ?? row.sentiment_score ?? 0,
      sentiment_adjustment: Math.abs(row.sentiment_adjustment ?? 0),
      absolute_error: row.absolute_error,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Overlay</CardTitle>
        <CardDescription>
          Compare sentiment intensity, adjustment size, and realized absolute error
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
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
              tickFormatter={(v) => formatNumber(v, 3)}
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
            <Bar dataKey="sentiment_score" fill="var(--color-sentiment_score)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="sentiment_adjustment" fill="var(--color-sentiment_adjustment)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="absolute_error" fill="var(--color-absolute_error)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
