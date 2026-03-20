"use client"

import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { EvaluationOverviewKpis } from "@/lib/types"
import { formatNumber, formatPercent } from "@/lib/format"

export function SectionCards({ kpis }: { kpis: EvaluationOverviewKpis }) {
  const hitRate = kpis.directional_hit_rate
  const hitGood = hitRate !== null && hitRate >= 55
  const maeLow = kpis.mae !== null && kpis.mae < 0.05
  const sentimentDelta = kpis.adjusted_vs_quant_mae_delta
  const sentimentWins = sentimentDelta !== null && sentimentDelta < 0

  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Matured Forecasts</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {formatNumber(kpis.matured_count, 0)}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              evaluated
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total predictions resolved against market
          </div>
          <div className="text-muted-foreground">
            Bias: {formatNumber(kpis.bias)} - MAPE: {formatPercent(kpis.mean_absolute_percentage_error)}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Directional Hit Rate</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {formatPercent(hitRate)}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              {hitGood ? (
                <><TrendingUpIcon className="size-3" /> above 55%</>
              ) : (
                <><TrendingDownIcon className="size-3" /> below 55%</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {hitGood ? "Model has directional edge" : "Needs investigation"}
            {hitGood ? <TrendingUpIcon className="size-4" /> : <TrendingDownIcon className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Correct direction predictions vs total
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Mean Absolute Error</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {formatNumber(kpis.mae)}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              {maeLow ? (
                <><TrendingUpIcon className="size-3" /> low</>
              ) : (
                <><TrendingDownIcon className="size-3" /> high</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            RMSE: {formatNumber(kpis.rmse)}
            {maeLow ? <TrendingUpIcon className="size-4" /> : <TrendingDownIcon className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Average prediction error magnitude
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Sentiment Improvement</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {formatPercent(kpis.sentiment_improvement_rate)}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              {sentimentWins ? (
                <><TrendingUpIcon className="size-3" /> adjusted wins</>
              ) : (
                <><TrendingDownIcon className="size-3" /> quant wins</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Delta: {formatNumber(sentimentDelta)}
            {sentimentWins ? <TrendingUpIcon className="size-4" /> : <TrendingDownIcon className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Rate at which sentiment-adjusted beats quant-only
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

