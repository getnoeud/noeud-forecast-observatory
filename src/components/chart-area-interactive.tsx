"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
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
import type { EvaluationDailyPoint } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/format";

const SERIES_COLORS = {
  mae: "#93c5fd",
  rmse: "#3b82f6",
  direction: "#60a5fa",
} as const;

const chartConfig = {
  mae: {
    label: "MAE",
    color: SERIES_COLORS.mae,
  },
  rmse: {
    label: "RMSE",
    color: SERIES_COLORS.rmse,
  },
  directional_hit_rate: {
    label: "Hit Rate",
    color: SERIES_COLORS.direction,
  },
} satisfies ChartConfig;

type ChartMode = "error" | "direction";

export function ChartAreaInteractive({
  data,
  mode,
  onModeChange,
}: {
  data: EvaluationDailyPoint[];
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
}) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("30d");
    }
  }, [isMobile]);

  const filteredData = React.useMemo(() => {
    if (data.length === 0) return data;
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
    const lastDate = new Date(sorted[sorted.length - 1].date);
    let daysToSubtract = 90;
    if (timeRange === "30d") daysToSubtract = 30;
    else if (timeRange === "7d") daysToSubtract = 7;
    const startDate = new Date(lastDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return sorted
      .filter((item) => new Date(item.date) >= startDate)
      .map((item) => ({
        ...item,
        mae:
          item.mae === null || item.mae === undefined ? null : Number(item.mae),
        rmse:
          item.rmse === null || item.rmse === undefined
            ? null
            : Number(item.rmse),
        directional_hit_rate:
          item.directional_hit_rate === null ||
          item.directional_hit_rate === undefined
            ? null
            : Number(item.directional_hit_rate),
      }));
  }, [data, timeRange]);

  const hasErrorSeries = React.useMemo(
    () => filteredData.some((item) => item.mae !== null || item.rmse !== null),
    [filteredData],
  );

  const hasDirectionSeries = React.useMemo(
    () => filteredData.some((item) => item.directional_hit_rate !== null),
    [filteredData],
  );

  const errorDomain = React.useMemo(() => {
    const values = filteredData.flatMap((item) =>
      [item.mae, item.rmse].filter(
        (value): value is number => value !== null && value !== undefined,
      ),
    );

    if (values.length === 0) {
      return [0, 1] as [number, number];
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 0.001);
    const lowerPadding = Math.max(range * 0.08, min * 0.35, 0.002);
    const upperPadding = Math.max(range * 0.12, max * 0.08, 0.01);

    return [Math.max(0, min - lowerPadding), max + upperPadding] as [
      number,
      number,
    ];
  }, [filteredData]);

  React.useEffect(() => {
    if (mode !== "error") {
      return;
    }

    /* console.info("[RollingPerformance:error]", {
      timeRange,
      points: filteredData.length,
      errorDomain,
      series: filteredData.map((item) => ({
        date: item.date,
        mae: item.mae,
        rmse: item.rmse,
      })),
    }); */
  }, [errorDomain, filteredData, mode, timeRange]);

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Rolling Performance</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            {mode === "error"
              ? "Daily MAE and RMSE trend by resolved actual date"
              : "Daily directional hit rate over time"}
          </span>
          <span className="@[540px]/card:hidden">
            {mode === "error" ? "MAE & RMSE trend" : "Hit rate trend"}
          </span>
        </CardDescription>
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <ToggleGroup
            value={[mode]}
            onValueChange={(v) => {
              const nextMode = Array.isArray(v) ? v[0] : undefined;
              if (nextMode) onModeChange(nextMode as ChartMode);
            }}
            variant="outline"
            className="@[600px]/card:flex hidden"
          >
            <ToggleGroupItem value="error" className="h-8 px-2.5">
              Error
            </ToggleGroupItem>
            <ToggleGroupItem value="direction" className="h-8 px-2.5">
              Hit Rate
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            value={[timeRange]}
            onValueChange={(v) => {
              const nextRange = Array.isArray(v) ? v[0] : undefined;
              if (nextRange) setTimeRange(nextRange);
            }}
            variant="outline"
            className="@[767px]/card:flex hidden"
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
            value={timeRange}
            onValueChange={(value) => {
              if (value) setTimeRange(value);
            }}
          >
            <SelectTrigger
              className="@[767px]/card:hidden flex w-40"
              aria-label="Select a value"
            >
              <SelectValue placeholder="90 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                90 days
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {filteredData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No daily evaluation series yet for this filter window.
          </div>
        ) : mode === "error" && !hasErrorSeries ? (
          <div className="flex h-[250px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Daily MAE/RMSE values are not available for this filter window yet.
          </div>
        ) : mode === "direction" && !hasDirectionSeries ? (
          <div className="flex h-[250px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Daily directional hit-rate values are not available for this filter
            window yet.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <LineChart
              accessibilityLayer
              data={filteredData}
              margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-GB", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={56}
                domain={
                  mode === "direction"
                    ? ([0, 100] as [number, number])
                    : errorDomain
                }
                tickFormatter={(value) =>
                  mode === "direction"
                    ? `${Math.round(Number(value))}%`
                    : formatNumber(Number(value), 4)
                }
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-GB", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }
                    valueFormatter={(value, name) => {
                      const num =
                        typeof value === "number" ? value : Number(value ?? 0);
                      return name === "directional_hit_rate"
                        ? formatPercent(num)
                        : formatNumber(num, 4);
                    }}
                    indicator="line"
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                hide={mode !== "error"}
                dataKey="rmse"
                type="monotone"
                name="RMSE"
                stroke={SERIES_COLORS.rmse}
                strokeWidth={4}
                dot={{ r: 3.5, fill: SERIES_COLORS.rmse, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                isAnimationActive
                animationDuration={800}
                connectNulls
              />
              <Line
                hide={mode !== "error"}
                dataKey="mae"
                type="monotone"
                name="MAE"
                stroke={SERIES_COLORS.mae}
                strokeWidth={4}
                strokeDasharray="4 4"
                dot={{ r: 3.5, fill: SERIES_COLORS.mae, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                isAnimationActive
                animationDuration={800}
                connectNulls
              />
              <Line
                hide={mode !== "direction"}
                dataKey="directional_hit_rate"
                type="monotone"
                name="Directional Hit Rate"
                stroke={SERIES_COLORS.direction}
                strokeWidth={3}
                dot={{ r: 2.5, fill: SERIES_COLORS.direction }}
                activeDot={{ r: 4 }}
                isAnimationActive
                animationDuration={800}
                connectNulls
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
