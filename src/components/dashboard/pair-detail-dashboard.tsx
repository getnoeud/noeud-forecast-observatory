"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Crosshair,
  TrendingDown,
  Waves,
  XCircle,
  Zap,
} from "lucide-react";

import { ActualVsPredictedChart } from "@/components/dashboard/actual-vs-predicted-chart";
import { DataAvailabilityBanner } from "@/components/dashboard/data-availability-banner";
import { ErrorDistributionChart } from "@/components/dashboard/error-distribution-chart";
import { EvaluationAuditTable } from "@/components/dashboard/evaluation-audit-table";
import { ForecastIssuanceMonitor } from "@/components/dashboard/forecast-issuance-monitor";
import { SentimentImpactChart } from "@/components/dashboard/sentiment-impact-chart";
import { SentimentRecordsTable } from "@/components/dashboard/sentiment-records-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber, formatPercent } from "@/lib/format";
import {
  useEvaluationHistory,
  usePredictionHistory,
  useSentimentHistory,
} from "@/hooks/use-observatory";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export function PairDetailDashboard({
  currencyPair,
  horizon,
  fromDate,
  toDate,
}: {
  currencyPair: string;
  horizon: number;
  fromDate?: string;
  toDate?: string;
}) {
  const historyQuery = useEvaluationHistory({
    currencyPair,
    horizon,
    fromDate,
    toDate,
    limit: 250,
  });
  const sentimentQuery = useSentimentHistory(currencyPair, 60, true);
  const predictionQuery = usePredictionHistory({
    currencyPair,
    horizon,
    limit: 60,
  });
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab =
    (searchParams.get("tab") as "charts" | "issuances" | "sentiment" | "audit" | null) ??
    "charts";

  const setActiveTab = (
    nextTab: "charts" | "issuances" | "sentiment" | "audit",
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (historyQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[350px] w-full rounded-lg" />
      </div>
    );
  }
  const rows = historyQuery.data?.evaluations ?? [];

  const total = rows.length;
  const hits = rows.filter((r) => r.direction_correct === true).length;
  const hitRate = total > 0 ? (hits / total) * 100 : null;
  const mae = total > 0 ? rows.reduce((s, r) => s + r.absolute_error, 0) / total : null;
  const bias = total > 0 ? rows.reduce((s, r) => s + r.signed_error, 0) / total : null;
  const sentimentBeats = rows.filter(
    (r) => r.sentiment_beats_quant === true,
  ).length;
  const sentimentRate = total > 0 ? (sentimentBeats / total) * 100 : null;

  const kpis = [
    {
      label: "Matured Rows",
      value: String(total),
      icon: Waves,
    },
    {
      label: "Hit Rate",
      value: formatPercent(hitRate),
      icon: Crosshair,
      trend:
        hitRate === null ? undefined : hitRate >= 55 ? ("up" as const) : ("down" as const),
      progress: hitRate ?? undefined,
    },
    {
      label: "MAE",
      value: formatNumber(mae),
      icon: TrendingDown,
      trend: mae === null ? undefined : mae < 0.05 ? ("up" as const) : ("down" as const),
    },
    {
      label: "Sentiment Wins",
      value: formatPercent(sentimentRate),
      icon: Zap,
      trend:
        sentimentRate === null
          ? undefined
          : sentimentRate > 50
            ? ("up" as const)
            : ("down" as const),
      progress: sentimentRate ?? undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {historyQuery.isError ? (
        <DataAvailabilityBanner
          variant="error"
          title="Pair evaluation data is temporarily unavailable"
          description="We could not load matured evaluation rows just now. Forecast issuance and sentiment tabs may still have data, and the layout below is staying visible so the page does not collapse."
          action={{ label: "Retry", onClick: () => historyQuery.refetch() }}
        />
      ) : total === 0 ? (
        <DataAvailabilityBanner
          title={`No matured ${horizon}d evaluations yet for ${currencyPair}`}
          description="Recent forecasts may already exist, but they have not matured into evaluation rows yet. The cards and tabs below will fill in automatically as the market resolves those forecasts."
        />
      ) : null}
      {/* KPIs */}
      <motion.div
        {...fadeIn}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{kpi.value}</span>
                {kpi.trend === "up" && (
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                )}
                {kpi.trend === "down" && (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
              </div>
              {kpi.progress !== undefined && (
                <Progress value={kpi.progress} className="mt-2 h-1.5" />
              )}
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Bias + quick stats */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline">Bias: {formatNumber(bias)}</Badge>
        <Badge
          variant={
            hitRate === null ? "outline" : hitRate >= 55 ? "default" : "secondary"
          }
        >
          {hitRate === null ? (
            <>Waiting for matured data</>
          ) : hitRate >= 55 ? (
            <>
              <CheckCircle2 className="mr-1 h-3 w-3" /> Model has edge
            </>
          ) : (
            <>
              <XCircle className="mr-1 h-3 w-3" /> Below threshold
            </>
          )}
        </Badge>
      </div>

      <Separator />

      {/* Tabbed content */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "charts" | "issuances" | "sentiment" | "audit")
        }
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="issuances">Forecast Path</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-1">
            <ActualVsPredictedChart rows={rows} />
            <ErrorDistributionChart rows={rows} />
          </div>
        </TabsContent>

        <TabsContent value="issuances" className="space-y-6">
          {predictionQuery.isLoading ? (
            <Skeleton className="h-[360px] w-full rounded-lg" />
          ) : (
            <ForecastIssuanceMonitor
              predictions={predictionQuery.data?.predictions ?? []}
            />
          )}
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-6">
          <SentimentImpactChart
            rows={rows}
            sentiment={sentimentQuery.data?.sentiments ?? []}
          />
          <SentimentRecordsTable sentiments={sentimentQuery.data?.sentiments ?? []} />
        </TabsContent>

        <TabsContent value="audit">
          <EvaluationAuditTable rows={rows} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
