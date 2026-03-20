"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import type { EvaluationDailyPoint } from "@/lib/types"
import { formatNumber, formatPercent } from "@/lib/format"

const chartConfig = {
  mae: {
    label: "MAE",
    color: "var(--chart-1)",
  },
  rmse: {
    label: "RMSE",
    color: "var(--chart-2)",
  },
  directional_hit_rate: {
    label: "Hit Rate",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

type ChartMode = "error" | "direction"

export function ChartAreaInteractive({
  data,
  mode,
  onModeChange,
}: {
  data: EvaluationDailyPoint[]
  mode: ChartMode
  onModeChange: (mode: ChartMode) => void
}) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("30d")
    }
  }, [isMobile])

  const filteredData = React.useMemo(() => {
    if (data.length === 0) return data
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date))
    const lastDate = new Date(sorted[sorted.length - 1].date)
    let daysToSubtract = 90
    if (timeRange === "30d") daysToSubtract = 30
    else if (timeRange === "7d") daysToSubtract = 7
    const startDate = new Date(lastDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return sorted
      .filter((item) => new Date(item.date) >= startDate)
      .map((item) => ({
        ...item,
        mae:
          item.mae === null || item.mae === undefined ? null : Number(item.mae),
        rmse:
          item.rmse === null || item.rmse === undefined ? null : Number(item.rmse),
        directional_hit_rate:
          item.directional_hit_rate === null || item.directional_hit_rate === undefined
            ? null
            : Number(item.directional_hit_rate),
      }))
  }, [data, timeRange])

  const hasErrorSeries = React.useMemo(
    () => filteredData.some((item) => item.mae !== null || item.rmse !== null),
    [filteredData]
  )

  const hasDirectionSeries = React.useMemo(
    () => filteredData.some((item) => item.directional_hit_rate !== null),
    [filteredData]
  )

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
              const nextMode = Array.isArray(v) ? v[0] : undefined
              if (nextMode) onModeChange(nextMode as ChartMode)
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
              const nextRange = Array.isArray(v) ? v[0] : undefined
              if (nextRange) setTimeRange(nextRange)
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
              if (value) setTimeRange(value)
            }}
          >
            <SelectTrigger
              className="@[767px]/card:hidden flex w-40"
              aria-label="Select a value"
            >
              <SelectValue placeholder="90 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">90 days</SelectItem>
              <SelectItem value="30d" className="rounded-lg">30 days</SelectItem>
              <SelectItem value="7d" className="rounded-lg">7 days</SelectItem>
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
            Daily directional hit-rate values are not available for this filter window yet.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <LineChart data={filteredData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-GB", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={56}
                domain={mode === "direction" ? [0, 100] : ["auto", "auto"]}
                tickFormatter={(value) =>
                  mode === "direction"
                    ? `${Math.round(Number(value))}%`
                    : formatNumber(Number(value), 3)
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
                      const num = typeof value === "number" ? value : Number(value ?? 0)
                      return name === "directional_hit_rate"
                        ? formatPercent(num)
                        : formatNumber(num, 4)
                    }}
                    indicator="line"
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              {mode === "error" ? (
                <>
                  <Line
                    dataKey="rmse"
                    type="monotone"
                    name="RMSE"
                    stroke="var(--color-rmse)"
                    strokeWidth={3}
                    dot={{ r: 2.5, fill: "var(--color-rmse)" }}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                  <Line
                    dataKey="mae"
                    type="monotone"
                    name="MAE"
                    stroke="var(--color-mae)"
                    strokeWidth={3}
                    strokeDasharray="4 4"
                    dot={{ r: 2.5, fill: "var(--color-mae)" }}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                </>
              ) : (
                <Line
                  dataKey="directional_hit_rate"
                  type="monotone"
                  name="Directional Hit Rate"
                  stroke="var(--color-directional_hit_rate)"
                  strokeWidth={3}
                  dot={{ r: 2.5, fill: "var(--color-directional_hit_rate)" }}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              )}
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
