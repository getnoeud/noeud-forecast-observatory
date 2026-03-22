"use client";

import Link from "next/link";
import type { UseQueryResult } from "@tanstack/react-query";
import { ArrowUpDown, Calendar, Download, Info } from "lucide-react";
import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";

import { DataAvailabilityBanner } from "@/components/dashboard/data-availability-banner";
import { PaginatedDataTable } from "@/components/dashboard/paginated-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import type {
  WeeklyEvaluationPairSummary,
  WeeklyEvaluationReportResponse,
} from "@/lib/types";

function buildPairColumns(horizon: number): ColumnDef<WeeklyEvaluationPairSummary>[] {
  return [
    {
      accessorKey: "currency_pair",
      header: "Pair",
      cell: ({ row }) => (
        <Link
          href={`/pairs/${row.original.currency_pair}?horizon=${horizon}`}
          className="font-semibold text-foreground hover:text-primary hover:underline"
        >
          {row.original.currency_pair}
        </Link>
      ),
    },
    {
      accessorKey: "evaluation_count",
      header: "Evals",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {formatNumber(row.original.evaluation_count, 0)}
        </span>
      ),
    },
    {
      accessorKey: "directional_hit_rate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Hit Rate <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const rate = row.original.directional_hit_rate;
        return (
          <div className="flex items-center gap-2">
            <Progress value={rate ?? 0} className="h-1.5 w-16" />
            <span className="font-mono text-sm">{formatPercent(rate)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "mae",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          MAE <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{formatNumber(row.original.mae)}</span>
      ),
    },
    {
      accessorKey: "rmse",
      header: "RMSE",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{formatNumber(row.original.rmse)}</span>
      ),
    },
    {
      accessorKey: "mean_absolute_percentage_error",
      header: "MAPE",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {formatPercent(row.original.mean_absolute_percentage_error)}
        </span>
      ),
    },
    {
      accessorKey: "bias",
      header: "Bias",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.bias !== null && Math.abs(row.original.bias) < 0.01
              ? "default"
              : "secondary"
          }
          className="font-mono text-xs"
        >
          {formatNumber(row.original.bias)}
        </Badge>
      ),
    },
    {
      accessorKey: "adjusted_vs_quant_mae_delta",
      header: "Quant Delta",
      cell: ({ row }) => {
        const delta = row.original.adjusted_vs_quant_mae_delta;
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{formatNumber(delta)}</span>
            {delta !== null ? (
              delta < 0 ? (
                <Badge variant="default" className="text-[10px]">
                  Adjusted wins
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">
                  Quant wins
                </Badge>
              )
            ) : null}
          </div>
        );
      },
    },
  ];
}

const metricHelp = [
  {
    label: "MAE",
    description: "Average absolute forecast error. Lower is better and easiest to explain to stakeholders.",
  },
  {
    label: "RMSE",
    description: "Like MAE but punishes large misses more heavily. Useful for spotting unstable weeks.",
  },
  {
    label: "MAPE",
    description: "Average percentage error relative to the realized rate. Helpful for comparing across pairs.",
  },
  {
    label: "Bias",
    description: "Average signed error. Positive means we tended to overpredict, negative means underpredict.",
  },
  {
    label: "Quant MAE",
    description: "MAE for the quant-only baseline before sentiment adjustment.",
  },
  {
    label: "Quant Delta",
    description: "Adjusted MAE minus quant-only MAE. Negative means sentiment-adjusted forecasts beat quant-only.",
  },
];

type WeeklyReportDashboardProps = {
  horizon: number;
  currencyPair: string;
  weekStart?: string;
  query: UseQueryResult<WeeklyEvaluationReportResponse, Error>;
};

export function WeeklyReportDashboard({
  horizon,
  currencyPair,
  weekStart,
  query,
}: WeeklyReportDashboardProps) {
  const pairColumns = useMemo(() => buildPairColumns(horizon), [horizon]);
  const data =
    query.data ??
    ({
      week_start: weekStart ?? "",
      week_end: weekStart ?? "",
      horizon_days: horizon,
      available_pairs: currencyPair !== "ALL" ? [currencyPair] : [],
      selected_pairs: currencyPair !== "ALL" ? [currencyPair] : [],
      resolved_from_latest_data: false,
      overall: {
        evaluation_count: 0,
        directional_hit_rate: null,
        mae: null,
        rmse: null,
        bias: null,
        mean_absolute_percentage_error: null,
        avg_sentiment_adjustment: null,
        quant_mae: null,
        adjusted_vs_quant_mae_delta: null,
      },
      pairs: [],
      generated_at: new Date().toISOString(),
    } satisfies WeeklyEvaluationReportResponse);

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="mt-2 h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_FORECAST_API_BASE_URL?.trim() ||
    "http://127.0.0.1:8000";
  const selectedPairs = currencyPair !== "ALL" ? [currencyPair] : [];
  const selectedPairQuery = selectedPairs.map((pair) => `currency_pairs=${pair}`).join("&");
  const exportUrl =
    `${apiBase}/evaluation/export?report_type=weekly&horizon=${horizon}&week_start=${data.week_start}` +
    (selectedPairQuery ? `&${selectedPairQuery}` : "");

  const summaryCards = [
    {
      label: "Evaluations",
      value: formatNumber(data.overall.evaluation_count, 0),
    },
    {
      label: "Hit Rate",
      value: formatPercent(data.overall.directional_hit_rate),
      progress: data.overall.directional_hit_rate ?? undefined,
    },
    {
      label: "MAE",
      value: formatNumber(data.overall.mae),
    },
    {
      label: "RMSE",
      value: formatNumber(data.overall.rmse),
    },
  ];

  const isEmpty = data.overall.evaluation_count === 0;

  return (
    <div className="space-y-6">
      {query.isError ? (
        <DataAvailabilityBanner
          variant="error"
          title="Report data is temporarily unavailable"
          description="We could not load the weekly evaluation report just now. The report layout is still visible below with empty placeholders until the API responds again."
          action={{ label: "Retry", onClick: () => query.refetch() }}
        />
      ) : isEmpty ? (
        <DataAvailabilityBanner
          title="No report data for this filter window"
          description={
            weekStart
              ? "That week does not have matured evaluation rows yet. Try the latest week with data or switch to a different pair."
              : "No matured evaluation rows are available yet for this horizon."
          }
        />
      ) : null}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {data.resolved_from_latest_data && !weekStart
                  ? "Latest week with evaluation data"
                  : "Selected report week"}
              </div>
              <CardTitle className="text-2xl">
                {formatDate(data.week_start)} - {formatDate(data.week_end)}
              </CardTitle>
              <CardDescription>
                {horizon}-day horizon
                {selectedPairs.length > 0 ? ` | filtered to ${selectedPairs.join(", ")}` : ""}
                {data.available_pairs.length > 0
                  ? ` | ${data.available_pairs.length} pair${data.available_pairs.length === 1 ? "" : "s"} available`
                  : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(exportUrl, "_blank")}
                disabled={isEmpty || !data.week_start}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export CSV
              </Button>
              <Button variant="outline" disabled>
                Monthly reports soon
              </Button>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <div key={card.label} className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{card.value}</p>
                {card.progress !== undefined ? (
                  <Progress value={card.progress} className="mt-2 h-1.5" />
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bias</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xl font-bold">{formatNumber(data.overall.bias)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MAPE</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xl font-bold">
              {formatPercent(data.overall.mean_absolute_percentage_error)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quant MAE</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xl font-bold">{formatNumber(data.overall.quant_mae)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quant Delta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">
                {formatNumber(data.overall.adjusted_vs_quant_mae_delta)}
              </span>
              {data.overall.adjusted_vs_quant_mae_delta !== null ? (
                data.overall.adjusted_vs_quant_mae_delta < 0 ? (
                  <Badge variant="default" className="text-[10px]">
                    Adjusted wins
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    Quant wins
                  </Badge>
                )
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Metric Guide</CardTitle>
          </div>
          <CardDescription>
            Short definitions for the core report metrics so the page is readable without
            needing external context.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {metricHelp.map((item) => (
            <div key={item.label} className="rounded-lg border p-4">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pair Breakdown</CardTitle>
          <CardDescription>
            Pair-level weekly performance summary using the same paginated table pattern as
            the rest of the observatory.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <PaginatedDataTable
            columns={pairColumns}
            data={data.pairs}
            emptyMessage="No report rows for this filter window."
            defaultPageSize={10}
            pageSizeOptions={[10, 20, 30, 50]}
            initialSorting={[{ id: "mae", desc: false }]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
