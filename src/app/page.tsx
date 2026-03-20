"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { OverviewInsightCharts } from "@/components/dashboard/overview-insight-charts";
import { ObservatoryFilters } from "@/components/observatory-filters";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEvaluationOverview } from "@/hooks/use-observatory";
import { useObservatoryStore } from "@/store/observatory-store";

export default function Page() {
  const { horizon, pair, fromDate, toDate, comparisonMode, setComparisonMode } =
    useObservatoryStore();

  const query = useEvaluationOverview({
    horizon,
    fromDate,
    toDate,
    currencyPairs: pair === "ALL" ? undefined : [pair],
  });

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {query.isLoading ? (
                <>
                  <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-[140px] rounded-xl" />
                    ))}
                  </div>
                  <div className="px-4 lg:px-6">
                    <Skeleton className="h-[320px] rounded-xl" />
                  </div>
                  <div className="px-4 lg:px-6">
                    <Skeleton className="h-[400px] rounded-xl" />
                  </div>
                </>
              ) : query.isError || !query.data ? (
                <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 lg:px-6">
                  <p className="text-lg font-medium">
                    Could not load observatory data
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Check that the FastAPI service is reachable and evaluation
                    endpoints are returning data.
                  </p>
                  <button
                    onClick={() => query.refetch()}
                    className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <ObservatoryFilters
                    supportedPairs={query.data.supported_pairs}
                  />
                  <SectionCards kpis={query.data.kpis} />
                  <div className="px-4 lg:px-6">
                    <ChartAreaInteractive
                      data={query.data.daily_series}
                      mode={comparisonMode}
                      onModeChange={setComparisonMode}
                    />
                  </div>
                  <OverviewInsightCharts rows={query.data.pair_leaderboard} />
                  <DataTable data={query.data.pair_leaderboard} />
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
