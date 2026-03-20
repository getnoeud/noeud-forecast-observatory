"use client"

import { Suspense, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { PairDetailDashboard } from "@/components/dashboard/pair-detail-dashboard"
import { PairCombobox } from "@/components/pair-combobox"
import { SiteHeader } from "@/components/site-header"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useEvaluationOverview } from "@/hooks/use-observatory"

function PairContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pair = (params.pair as string).toUpperCase()
  const horizon = Number(searchParams.get("horizon") ?? "7")
  const fromDate = searchParams.get("from") ?? undefined
  const toDate = searchParams.get("to") ?? undefined
  const overviewQuery = useEvaluationOverview({
    horizon,
    fromDate,
    toDate,
  })

  useEffect(() => {
    window.localStorage.setItem(
      "observatory:lastPairReview",
      JSON.stringify({ pair, horizon }),
    )
  }, [horizon, pair])

  const updateRoute = (nextPair: string, nextHorizon: number) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set("horizon", String(nextHorizon))
    router.push(`/pairs/${nextPair}?${nextParams.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{pair} Performance Review</h1>
          <p className="text-sm text-muted-foreground">{horizon}-day horizon evaluation</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Currency Pair</span>
            <PairCombobox
              pairs={overviewQuery.data?.supported_pairs ?? [pair]}
              value={pair}
              includeAll={false}
              onValueChange={(value) => updateRoute(value, horizon)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Horizon</span>
            <Select
              value={String(horizon)}
              onValueChange={(value) => updateRoute(pair, Number(value))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <PairDetailDashboard
        currencyPair={pair}
        horizon={horizon}
        fromDate={fromDate}
        toDate={toDate}
      />
    </div>
  )
}

export default function PairPage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <Suspense fallback={
              <div className="flex flex-col gap-4 px-4 py-6 lg:px-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-[400px] rounded-xl" />
              </div>
            }>
              <PairContent />
            </Suspense>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
