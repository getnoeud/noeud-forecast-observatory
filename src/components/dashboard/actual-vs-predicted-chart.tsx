"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDate, formatNumber } from "@/lib/format";
import type { PredictionHistoryItem } from "@/lib/types";

const chartConfig = {
  actual_rate: {
    label: "Actual",
    color: "var(--chart-1)",
  },
  quant_path: {
    label: "Quant Path",
    color: "var(--chart-2)",
  },
  adjusted_path: {
    label: "Adjusted Path",
    color: "var(--chart-3)",
  },
  confidence_lower: {
    label: "Lower Bound",
    color: "var(--chart-4)",
  },
  confidence_upper: {
    label: "Upper Bound",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

type TimeRange = "7d" | "30d" | "90d";

const RANGE_DAYS: Record<TimeRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function parseUtcDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function toDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function addUtcDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function hasStoredPath(prediction: PredictionHistoryItem): boolean {
  return Boolean(
    prediction.daily_forecasts &&
      Object.keys(prediction.daily_forecasts).length > 0,
  );
}

function sortPredictionsByDateDesc(predictions: PredictionHistoryItem[]) {
  return [...predictions].sort((a, b) =>
    b.forecast_date.localeCompare(a.forecast_date),
  );
}

export function ActualVsPredictedChart({
  predictions,
  isLoading = false,
}: {
  predictions: PredictionHistoryItem[];
  isLoading?: boolean;
}) {
  const [timeRange, setTimeRange] = React.useState<TimeRange>("30d");
  const predictionsWithPath = React.useMemo(
    () => sortPredictionsByDateDesc(predictions).filter(hasStoredPath),
    [predictions],
  );

  const filteredPredictions = React.useMemo(() => {
    if (predictionsWithPath.length === 0) {
      return [];
    }

    const latest = parseUtcDate(predictionsWithPath[0].forecast_date);
    const cutoff = addUtcDays(latest, -RANGE_DAYS[timeRange]);

    return predictionsWithPath.filter(
      (prediction) => parseUtcDate(prediction.forecast_date) >= cutoff,
    );
  }, [predictionsWithPath, timeRange]);

  const [selectedForecastDate, setSelectedForecastDate] = React.useState<
    string | undefined
  >(undefined);

  React.useEffect(() => {
    if (filteredPredictions.length === 0) {
      setSelectedForecastDate(undefined);
      return;
    }

    const stillValid = filteredPredictions.some(
      (prediction) => prediction.forecast_date === selectedForecastDate,
    );

    if (!stillValid) {
      setSelectedForecastDate(filteredPredictions[0].forecast_date);
    }
  }, [filteredPredictions, selectedForecastDate]);

  const selectedPrediction = React.useMemo(
    () =>
      filteredPredictions.find(
        (prediction) => prediction.forecast_date === selectedForecastDate,
      ),
    [filteredPredictions, selectedForecastDate],
  );

  const chartData = React.useMemo(() => {
    if (!selectedPrediction?.daily_forecasts) {
      return [];
    }

    const issueDate = parseUtcDate(selectedPrediction.forecast_date);
    const dayKeys = Object.keys(selectedPrediction.daily_forecasts).sort(
      (a, b) => Number(a) - Number(b),
    );

    const points = [
      {
        label: "Issued",
        date: selectedPrediction.forecast_date,
        actual_rate: selectedPrediction.current_rate,
        quant_path: selectedPrediction.current_rate,
        adjusted_path: selectedPrediction.current_rate,
        confidence_lower: selectedPrediction.current_rate,
        confidence_upper: selectedPrediction.current_rate,
        actual_observed_date: selectedPrediction.forecast_date,
      },
    ];

    dayKeys.forEach((dayKey) => {
      const dayNumber = Number(dayKey);
      const stepDate = toDateKey(addUtcDays(issueDate, dayNumber));
      const quantPoint = selectedPrediction.daily_forecasts?.[dayKey];
      const adjustedPoint =
        selectedPrediction.adjusted_daily_forecasts?.[dayKey] ?? quantPoint;
      const actualPoint = selectedPrediction.actual_daily_path?.[dayKey];

      points.push({
        label: `D${dayNumber}`,
        date: stepDate,
        actual_rate: actualPoint?.actual_rate ?? null,
        quant_path: quantPoint?.predicted_rate ?? null,
        adjusted_path: adjustedPoint?.predicted_rate ?? null,
        confidence_lower: adjustedPoint?.confidence_lower ?? null,
        confidence_upper: adjustedPoint?.confidence_upper ?? null,
        actual_observed_date: actualPoint?.actual_date ?? null,
      });
    });

    return points;
  }, [selectedPrediction]);

  const realizedStepCount = React.useMemo(
    () => chartData.filter((point) => point.actual_rate !== null).length - 1,
    [chartData],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle>Rolling Forecast Path vs Actual</CardTitle>
            <CardDescription>
              Shows one selected forecast issuance, fills in realized prices as
              later market days arrive, and keeps the remaining horizon visible
              as the stored forecast path.
            </CardDescription>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                Actuals are resolved from observed raw market closes for each
                step, using the next available market day when the target lands
                on a non-trading date.
              </p>
              <p>
                The quant line is the stored baseline path, the adjusted line is
                the sentiment-adjusted path, and the actual line fills in as
                realized market prices become available.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ToggleGroup
              value={[timeRange]}
              onValueChange={(value) => {
                const next = Array.isArray(value) ? value[0] : undefined;
                if (next) {
                  setTimeRange(next as TimeRange);
                }
              }}
              variant="outline"
            >
              <ToggleGroupItem value="90d" className="h-8 px-2.5">
                90 days
              </ToggleGroupItem>
              <ToggleGroupItem value="30d" className="h-8 px-2.5">
                30 days
              </ToggleGroupItem>
              <ToggleGroupItem value="7d" className="h-8 px-2.5">
                7 days
              </ToggleGroupItem>
            </ToggleGroup>

            <Select
              value={selectedForecastDate}
              onValueChange={setSelectedForecastDate}
              disabled={filteredPredictions.length === 0}
            >
              <SelectTrigger className="min-w-[220px]">
                <SelectValue placeholder="Select forecast issuance" />
              </SelectTrigger>
              <SelectContent>
                {filteredPredictions.map((prediction) => (
                  <SelectItem
                    key={prediction.forecast_date}
                    value={prediction.forecast_date}
                  >
                    {formatDate(prediction.forecast_date)} | {prediction.horizon_days}d
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[340px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Loading forecast path history...
          </div>
        ) : filteredPredictions.length === 0 ? (
          <div className="flex h-[340px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No stored forecast paths are available for this pair and horizon yet.
          </div>
        ) : chartData.length === 0 || !selectedPrediction ? (
          <div className="flex h-[340px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No chartable forecast path is available for the selected issuance.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Selected issuance
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formatDate(selectedPrediction.forecast_date)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Horizon target date
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formatDate(selectedPrediction.target_date)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Realized steps filled
                </p>
                <p className="mt-1 text-sm font-medium">
                  {Math.max(0, realizedStepCount)} / {selectedPrediction.horizon_days}
                </p>
              </div>
            </div>

            <ChartContainer config={chartConfig} className="h-[340px] w-full">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 12, left: 12, bottom: 0 }}
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
                  tickFormatter={(value) => formatNumber(Number(value), 4)}
                  className="text-xs"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => {
                        const point = payload?.[0]?.payload as
                          | {
                              label?: string;
                              date?: string;
                              actual_observed_date?: string | null;
                            }
                          | undefined;
                        if (!point) {
                          return "--";
                        }
                        const resolvedText =
                          point.actual_observed_date &&
                          point.actual_observed_date !== point.date
                            ? ` | actual used ${formatDate(point.actual_observed_date)}`
                            : "";
                        return `${point.label ?? "--"} | ${formatDate(point.date)}${resolvedText}`;
                      }}
                      valueFormatter={(value) => formatNumber(Number(value), 4)}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="actual_rate"
                  stroke="var(--color-actual_rate)"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="quant_path"
                  stroke="var(--color-quant_path)"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="adjusted_path"
                  stroke="var(--color-adjusted_path)"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="confidence_lower"
                  stroke="var(--color-confidence_lower)"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="confidence_upper"
                  stroke="var(--color-confidence_upper)"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
