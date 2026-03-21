"use client"

import { Suspense, useMemo, useState } from "react"
import { format, startOfWeek } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { WeeklyReportDashboard } from "@/components/dashboard/weekly-report-dashboard"
import { PairCombobox } from "@/components/pair-combobox"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useWeeklyEvaluationReport } from "@/hooks/use-observatory"
import { cn } from "@/lib/utils"

function ReportWeekPicker({
  weekStart,
  onWeekChange,
}: {
  weekStart?: string
  onWeekChange: (weekStart?: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selectedDate = useMemo(
    () => (weekStart ? new Date(`${weekStart}T00:00:00`) : undefined),
    [weekStart]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !weekStart && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {weekStart ? `Week of ${format(selectedDate!, "PPP")}` : "Latest week with data"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              onWeekChange(undefined)
              setOpen(false)
            }}
          >
            Use latest week with data
          </Button>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) {
                onWeekChange(undefined)
              } else {
                const monday = startOfWeek(date, { weekStartsOn: 1 })
                onWeekChange(monday.toISOString().slice(0, 10))
              }
              setOpen(false)
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function WeeklyReportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const horizon = Number(searchParams.get("horizon") ?? "7")
  const selectedPair: string = searchParams.get("pair") ?? "ALL"
  const weekStart: string | undefined = searchParams.get("week_start") ?? undefined

  const reportQuery = useWeeklyEvaluationReport({
    horizon,
    weekStart,
    currencyPairs: selectedPair !== "ALL" ? [selectedPair] : undefined,
  })
  const availablePairs = reportQuery.data?.available_pairs ?? []

  const setFilter = (updates: Record<string, string | null | undefined>) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        nextParams.delete(key)
      } else {
        nextParams.set(key, value)
      }
    })
    router.push(`/reports/weekly?${nextParams.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Performance Reports</h1>
          <p className="text-sm text-muted-foreground">
            Review the latest week with evaluation data or jump to a specific report
            week for the {horizon}-day horizon.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Horizon</span>
            <Select
              value={String(horizon)}
              onValueChange={(value) =>
                setFilter({ horizon: value, week_start: weekStart, pair: selectedPair })
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Currency pair</span>
            <PairCombobox
              pairs={availablePairs}
              value={selectedPair}
              onValueChange={(value) =>
                setFilter({
                  horizon: String(horizon),
                  week_start: weekStart,
                  pair: value === "ALL" ? undefined : value,
                })
              }
              includeAll
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Report week</span>
            <ReportWeekPicker
              weekStart={weekStart}
              onWeekChange={(value) =>
                setFilter({
                  horizon: String(horizon),
                  week_start: value,
                  pair: selectedPair === "ALL" ? undefined : selectedPair,
                })
              }
            />
          </div>
        </div>
      </div>

      <WeeklyReportDashboard
        horizon={horizon}
        currencyPair={selectedPair}
        weekStart={weekStart}
        query={reportQuery}
      />
    </div>
  )
}

export default function WeeklyReportPage() {
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
              <WeeklyReportContent />
            </Suspense>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
