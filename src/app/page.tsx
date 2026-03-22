"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataAvailabilityBanner } from "@/components/dashboard/data-availability-banner";
import { DataTable } from "@/components/data-table";
import { OverviewInsightCharts } from "@/components/dashboard/overview-insight-charts";
import { ObservatoryFilters } from "@/components/observatory-filters";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEvaluationOverview } from "@/hooks/use-observatory";
import type { EvaluationOverviewResponse } from "@/lib/types";
import { useObservatoryStore } from "@/store/observatory-store";

function buildEmptyOverviewData(
  horizon: number,
  pair: string,
  fromDate?: string,
  toDate?: string,
): EvaluationOverviewResponse {
  return {
    horizon_days: horizon,
    from_date: fromDate ?? null,
    to_date: toDate ?? null,
    supported_pairs: [],
    selected_pairs: pair === "ALL" ? [] : [pair],
    kpis: {
      matured_count: 0,
      directional_hit_rate: null,
      mae: null,
      rmse: null,
      bias: null,
      mean_absolute_percentage_error: null,
      avg_sentiment_adjustment: null,
      quant_mae: null,
      adjusted_vs_quant_mae_delta: null,
      sentiment_improvement_rate: null,
    },
    pair_leaderboard: [],
    daily_series: [],
  };
}

export default function Page() {
  const { horizon, pair, fromDate, toDate, comparisonMode, setComparisonMode } =
    useObservatoryStore();

  const query = useEvaluationOverview({
    horizon,
    fromDate,
    toDate,
    currencyPairs: pair === "ALL" ? undefined : [pair],
  });
  const overviewData = query.data ?? buildEmptyOverviewData(horizon, pair, fromDate, toDate);
  const hasEmptyOverview =
    overviewData.kpis.matured_count === 0 &&
    overviewData.pair_leaderboard.length === 0 &&
    overviewData.daily_series.length === 0;

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
              ) : (
                <>
                  {query.isError ? (
                    <DataAvailabilityBanner
                      variant="error"
                      title="Observatory data is temporarily unavailable"
                      description="We could not reach the evaluation API just now. The page shell is still here, but the cards and charts below are showing empty placeholders until the service comes back."
                      action={{ label: "Retry", onClick: () => query.refetch() }}
                    />
                  ) : hasEmptyOverview ? (
                    <DataAvailabilityBanner
                      title="No matured evaluation data yet"
                      description="Forecasts exist, but none have matured into evaluation rows for this filter window yet. The dashboard will fill in automatically as forecasts resolve against actual market data."
                    />
                  ) : null}
                  <ObservatoryFilters
                    supportedPairs={overviewData.supported_pairs}
                  />
                  <SectionCards kpis={overviewData.kpis} />
                  <div className="px-4 lg:px-6">
                    <ChartAreaInteractive
                      data={overviewData.daily_series}
                      mode={comparisonMode}
                      onModeChange={setComparisonMode}
                    />
                  </div>
                  <OverviewInsightCharts rows={overviewData.pair_leaderboard} />
                  <DataTable data={overviewData.pair_leaderboard} />
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
