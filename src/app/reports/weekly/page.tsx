"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { WeeklyReportDashboard } from "@/components/dashboard/weekly-report-dashboard"
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

function WeeklyReportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const horizon = Number(searchParams.get("horizon") ?? "7")

  const setHorizon = (nextHorizon: number) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set("horizon", String(nextHorizon))
    router.push(`/reports/weekly?${nextParams.toString()}`)
  }

  return (
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Performance Reports</h1>
          <p className="text-sm text-muted-foreground">
            Weekly report view for the {horizon}-day horizon. Monthly exports
            are the next step.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Horizon</span>
          <Select value={String(horizon)} onValueChange={(value) => setHorizon(Number(value))}>
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
      <WeeklyReportDashboard horizon={horizon} />
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
