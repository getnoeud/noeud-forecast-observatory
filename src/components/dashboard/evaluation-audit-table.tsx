"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CheckCircle2, XCircle } from "lucide-react";

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
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import type { ForecastEvaluationItem } from "@/lib/types";

const columns: ColumnDef<ForecastEvaluationItem>[] = [
  {
    accessorKey: "forecast_date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Forecast Date <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {formatDate(row.original.forecast_date)}
      </span>
    ),
  },
  {
    accessorKey: "target_date",
    header: "Target",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {formatDate(row.original.target_date)}
      </span>
    ),
  },
  {
    accessorKey: "predicted_rate",
    header: "Predicted",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {formatNumber(row.original.predicted_rate, 4)}
      </span>
    ),
  },
  {
    accessorKey: "actual_rate",
    header: "Actual",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {formatNumber(row.original.actual_rate, 4)}
      </span>
    ),
  },
  {
    accessorKey: "absolute_error",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Abs Error <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {formatNumber(row.original.absolute_error)}
      </span>
    ),
  },
  {
    accessorKey: "absolute_percentage_error",
    header: "APE",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {formatPercent(row.original.absolute_percentage_error)}
      </span>
    ),
  },
  {
    accessorKey: "direction_correct",
    header: "Direction",
    cell: ({ row }) => {
      const correct = row.original.direction_correct;
      if (correct === null) {
        return <span className="text-muted-foreground">--</span>;
      }
      return correct ? (
        <Badge variant="default" className="gap-1 text-[10px]">
          <CheckCircle2 className="h-3 w-3" /> Hit
        </Badge>
      ) : (
        <Badge variant="secondary" className="gap-1 text-[10px]">
          <XCircle className="h-3 w-3" /> Miss
        </Badge>
      );
    },
  },
  {
    accessorKey: "sentiment_beats_quant",
    header: "Sent. Beats",
    cell: ({ row }) => {
      const beats = row.original.sentiment_beats_quant;
      if (beats === null) {
        return <span className="text-muted-foreground">--</span>;
      }
      return beats ? (
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Yes
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">No</span>
      );
    },
  },
  {
    accessorKey: "model_version",
    header: "Model",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.model_family ?? row.original.model_version}
      </span>
    ),
  },
];

export function EvaluationAuditTable({ rows }: { rows: ForecastEvaluationItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Forecast Audit Trail</CardTitle>
        <CardDescription>
          Every forecast issuance is individually reviewable after the market
          resolves it.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <PaginatedDataTable
          columns={columns}
          data={rows}
          emptyMessage="No audit data available."
          defaultPageSize={15}
          pageSizeOptions={[10, 15, 25, 50]}
          initialSorting={[{ id: "forecast_date", desc: true }]}
        />
      </CardContent>
    </Card>
  );
}
