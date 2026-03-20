"use client";

import {
  Line,
  LineChart,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatNumber } from "@/lib/format";
import type { PredictionHistoryItem } from "@/lib/types";

const chartConfig = {
  current_rate: {
    label: "Current Rate",
    color: "var(--chart-1)",
  },
  predicted_rate: {
    label: "Predicted Path",
    color: "var(--chart-2)",
  },
  confidence_lower: {
    label: "Lower Bound",
    color: "var(--chart-4)",
  },
  confidence_upper: {
    label: "Upper Bound",
    color: "var(--chart-4)",
  },
  day_1_rate: {
    label: "D1 Forecast",
    color: "var(--chart-3)",
  },
  final_rate: {
    label: "Final Forecast",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function buildLatestForecastPath(latest: PredictionHistoryItem | undefined) {
  if (!latest?.daily_forecasts) {
    return [];
  }

  const dayKeys = Object.keys(latest.daily_forecasts).sort(
    (a, b) => Number(a) - Number(b),
  );

  return dayKeys.map((dayKey) => {
    const point = latest.daily_forecasts?.[dayKey];
    return {
      day: `D${dayKey}`,
      current_rate: latest.current_rate,
      predicted_rate: point?.predicted_rate ?? null,
      confidence_lower: point?.confidence_lower ?? null,
      confidence_upper: point?.confidence_upper ?? null,
    };
  });
}

function getDayRate(
  prediction: PredictionHistoryItem,
  day: string,
): number | null {
  return prediction.daily_forecasts?.[day]?.predicted_rate ?? null;
}

function buildIssuanceTrend(predictions: PredictionHistoryItem[]) {
  return predictions
    .slice()
    .reverse()
    .map((prediction) => ({
      forecast_date: prediction.forecast_date,
      current_rate: prediction.current_rate,
      day_1_rate: getDayRate(prediction, "1"),
      final_rate: prediction.predicted_rate,
    }));
}

export function ForecastIssuanceMonitor({
  predictions,
}: {
  predictions: PredictionHistoryItem[];
}) {
  const latest = predictions[0];
  const latestPath = buildLatestForecastPath(latest);
  const issuanceTrend = buildIssuanceTrend(predictions);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Latest Forecast Path</CardTitle>
          <CardDescription>
            Day-by-day path from the most recent forecast issuance, anchored
            against the current rate at issuance time.
          </CardDescription>
          <div className="text-xs text-muted-foreground">
            Release: {latest?.model_version ?? "--"} · Family:{" "}
            {latest?.model_family ?? "--"}
          </div>
        </CardHeader>
        <CardContent>
          {latestPath.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              No daily forecast path is stored for the latest issuance yet.
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart
                data={latestPath}
                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => formatNumber(Number(value), 4)}
                  className="text-xs"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => `Forecast Step: ${String(label)}`}
                      valueFormatter={(value) => formatNumber(Number(value), 4)}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="current_rate"
                  stroke="var(--color-current_rate)"
                  strokeDasharray="4 4"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="predicted_rate"
                  stroke="var(--color-predicted_rate)"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="confidence_lower"
                  stroke="var(--color-confidence_lower)"
                  strokeDasharray="3 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="confidence_upper"
                  stroke="var(--color-confidence_upper)"
                  strokeDasharray="3 3"
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prediction vs Current Rate Across Issuances</CardTitle>
          <CardDescription>
            Compare the issued current rate, the day-1 forecast, and the final
            horizon output across recent forecast dates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {issuanceTrend.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              No forecast issuance history available yet.
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart
                data={issuanceTrend}
                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="forecast_date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => formatDate(String(value))}
                  minTickGap={24}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => formatNumber(Number(value), 4)}
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
                  dataKey="current_rate"
                  stroke="var(--color-current_rate)"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="day_1_rate"
                  stroke="var(--color-day_1_rate)"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="final_rate"
                  stroke="var(--color-final_rate)"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Forecast Issuances</CardTitle>
          <CardDescription>
            Recent forecast runs stored by the API, including current rate,
            day-1 path, and final horizon output.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Forecast Date</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Day 1</TableHead>
                  <TableHead>Final</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead>Release</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No stored prediction issuances yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  predictions.map((prediction) => (
                    <TableRow key={prediction.public_id ?? `${prediction.forecast_date}-${prediction.target_date}`}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(prediction.forecast_date)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatDate(prediction.target_date)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatNumber(prediction.current_rate, 4)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatNumber(getDayRate(prediction, "1"), 4)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatNumber(prediction.predicted_rate, 4)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatNumber(prediction.sentiment_score, 2)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {prediction.model_version ?? prediction.model_family ?? "--"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

