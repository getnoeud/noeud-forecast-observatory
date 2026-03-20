"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpDown, Calendar, Download, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { EmptyState } from "@/components/dashboard/empty-state";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import { useWeeklyEvaluationReport } from "@/hooks/use-observatory";
import type { WeeklyEvaluationPairSummary } from "@/lib/types";

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
    cell: ({ row }) => <span className="font-mono text-sm">{formatNumber(row.original.evaluation_count, 0)}</span>,
  },
  {
    accessorKey: "directional_hit_rate",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Hit Rate <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const rate = row.original.directional_hit_rate;
      return (
        <div className="flex items-center gap-2">
          <Progress value={rate ?? 0} className="h-1.5 w-12" />
          <span className="font-mono text-sm">{formatPercent(rate)}</span>
          {rate !== null && (rate >= 55 ? (
            <TrendingUp className="h-3 w-3 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "mae",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        MAE <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-mono text-sm">{formatNumber(row.original.mae)}</span>,
  },
  {
    accessorKey: "rmse",
    header: "RMSE",
    cell: ({ row }) => <span className="font-mono text-sm">{formatNumber(row.original.rmse)}</span>,
  },
  {
    accessorKey: "bias",
    header: "Bias",
    cell: ({ row }) => (
      <Badge variant={row.original.bias !== null && Math.abs(row.original.bias) < 0.01 ? "default" : "secondary"} className="font-mono text-xs">
        {formatNumber(row.original.bias)}
      </Badge>
    ),
  },
  {
    accessorKey: "adjusted_vs_quant_mae_delta",
    header: "Quant Delta",
    cell: ({ row }) => {
      const delta = row.original.adjusted_vs_quant_mae_delta;
      return <span className="font-mono text-sm">{formatNumber(delta)}</span>;
    },
  },
  ];
}

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export function WeeklyReportDashboard({ horizon }: { horizon: number }) {
  const query = useWeeklyEvaluationReport({ horizon });
  const [sorting, setSorting] = useState<SortingState>([{ id: "mae", desc: false }]);
  const pairColumns = buildPairColumns(horizon);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: query.data?.pairs ?? [],
    columns: pairColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="mt-2 h-10 w-full" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <EmptyState
        variant="error"
        title="Could not load weekly report"
        description="Check the evaluation API and available data window."
        action={{ label: "Retry", onClick: () => query.refetch() }}
      />
    );
  }

  const { data } = query;
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_FORECAST_API_BASE_URL?.trim() ||
    "http://127.0.0.1:8000";
  const hitRate = data.overall.directional_hit_rate;

  const summaryCards = [
    { label: "Evaluations", value: formatNumber(data.overall.evaluation_count, 0) },
    { label: "Hit Rate", value: formatPercent(hitRate), progress: hitRate ?? undefined },
    { label: "MAE", value: formatNumber(data.overall.mae) },
    { label: "RMSE", value: formatNumber(data.overall.rmse) },
  ];

  return (
    <div className="space-y-6">
      {/* Week Header */}
      <motion.div {...fadeIn}>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Latest completed week
                </div>
                <CardTitle className="mt-1 text-2xl">
                  {formatDate(data.week_start)} - {formatDate(data.week_end)}
                </CardTitle>
                <CardDescription className="mt-1">
                  {horizon}-day horizon - {data.pairs.length} pair{data.pairs.length !== 1 ? "s" : ""} evaluated
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => window.open(`${apiBase}/evaluation/export?report_type=weekly&horizon=${horizon}`, "_blank")}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export Weekly CSV
              </Button>
              <Button variant="outline" disabled>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Monthly export soon
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {summaryCards.map((card) => (
                <div key={card.label} className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">{card.value}</p>
                  {card.progress !== undefined && (
                    <Progress value={card.progress} className="mt-2 h-1.5" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Extended metrics */}
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
            <span className="text-xl font-bold">{formatPercent(data.overall.mean_absolute_percentage_error)}</span>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Quant Delta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{formatNumber(data.overall.adjusted_vs_quant_mae_delta)}</span>
              {data.overall.adjusted_vs_quant_mae_delta !== null && (
                data.overall.adjusted_vs_quant_mae_delta < 0 ? (
                  <Badge variant="default" className="text-[10px]">Adjusted wins</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">Quant wins</Badge>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Pair Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pair Breakdown</CardTitle>
          <CardDescription>Performance of each currency pair during this week</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={pairColumns.length} className="h-24 text-center text-muted-foreground">
                    No pair data for this week.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

