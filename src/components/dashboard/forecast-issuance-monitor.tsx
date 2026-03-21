"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import { PaginatedDataTable } from "@/components/dashboard/paginated-data-table";
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

function getDayRate(
  prediction: PredictionHistoryItem,
  day: string,
): number | null {
  return prediction.daily_forecasts?.[day]?.predicted_rate ?? null;
}

function getLatestPredictionWithStoredPath(
  predictions: PredictionHistoryItem[],
): PredictionHistoryItem | undefined {
  return predictions.find(
    (prediction) =>
      prediction.daily_forecasts &&
      Object.keys(prediction.daily_forecasts).length > 0,
  );
}

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

const issuanceColumns: ColumnDef<PredictionHistoryItem>[] = [
  {
    accessorKey: "forecast_date",
    header: "Forecast Date",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {formatDate(row.original.forecast_date)}
      </span>
    ),
  },
  {
    accessorKey: "target_date",
    header: "Target Date",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {formatDate(row.original.target_date)}
      </span>
    ),
  },
  {
    accessorKey: "current_rate",
    header: "Current",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {formatNumber(row.original.current_rate, 4)}
      </span>
    ),
  },
  {
    id: "day_1_rate",
    header: "Day 1",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {formatNumber(getDayRate(row.original, "1"), 4)}
      </span>
    ),
  },
  {
    accessorKey: "predicted_rate",
    header: "Final",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {formatNumber(row.original.predicted_rate, 4)}
      </span>
    ),
  },
  {
    accessorKey: "sentiment_score",
    header: "Sentiment",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {formatNumber(row.original.sentiment_score, 2)}
      </span>
    ),
  },
  {
    accessorKey: "model_version",
    header: "Release",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.model_version ?? row.original.model_family ?? "--"}
      </span>
    ),
  },
];

export function ForecastIssuanceMonitor({
  predictions,
}: {
  predictions: PredictionHistoryItem[];
}) {
  const latestWithStoredPath = getLatestPredictionWithStoredPath(predictions);
  const latestPath = buildLatestForecastPath(latestWithStoredPath);
  const issuanceTrend = buildIssuanceTrend(predictions);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Latest Forecast Path</CardTitle>
          <CardDescription>
            Day-by-day path from the most recent forecast issuance that has
            stored daily forecast steps, anchored against the current rate at
            issuance time.
          </CardDescription>
          <div className="text-xs text-muted-foreground">
            Release: {latestWithStoredPath?.model_version ?? "--"} | Family:{" "}
            {latestWithStoredPath?.model_family ?? "--"}
          </div>
        </CardHeader>
        <CardContent>
          {latestPath.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              No stored daily forecast path exists in the current prediction
              history window yet.
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart
                data={latestPath}
                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
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
                      labelFormatter={(label) =>
                        `Forecast Step: ${String(label)}`
                      }
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
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
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
          <PaginatedDataTable
            columns={issuanceColumns}
            data={predictions}
            emptyMessage="No stored prediction issuances yet."
            defaultPageSize={10}
            pageSizeOptions={[10, 20, 30, 50]}
            initialSorting={[{ id: "forecast_date", desc: true }]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
