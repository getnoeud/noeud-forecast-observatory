"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { formatNumber, formatPercent } from "@/lib/format"
import type { EvaluationPairSummary } from "@/lib/types"
import { useObservatoryStore } from "@/store/observatory-store"

type TableView = "leaderboard" | "direction" | "sentiment"

function pairCell(pair: string, horizon: number) {
  return (
    <Link
      className="font-semibold text-foreground hover:text-primary hover:underline"
      href={`/pairs/${pair}?horizon=${horizon}`}
    >
      {pair}
    </Link>
  )
}

function sortableHeader(label: string) {
  return function SortableHeader({
    column,
  }: {
    column: { getIsSorted: () => false | "asc" | "desc"; toggleSorting: (desc?: boolean) => void }
  }) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {label}
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    )
  }
}

const leaderboardColumns: ColumnDef<EvaluationPairSummary>[] = [
  {
    accessorKey: "currency_pair",
    header: "Pair",
    cell: ({ row }) => row.original.currency_pair,
    enableHiding: false,
  },
  {
    accessorKey: "matured_count",
    header: sortableHeader("Matured"),
    cell: ({ row }) => (
      <div className="tabular-nums">{formatNumber(row.original.matured_count, 0)}</div>
    ),
  },
  {
    accessorKey: "directional_hit_rate",
    header: sortableHeader("Hit Rate"),
    cell: ({ row }) => {
      const rate = row.original.directional_hit_rate
      const good = rate !== null && rate >= 55
      return (
        <Badge
          variant="outline"
          className="flex w-fit gap-1 px-1.5 text-muted-foreground [&_svg]:size-3"
        >
          {good ? (
            <TrendingUpIcon className="text-emerald-500 dark:text-emerald-400" />
          ) : (
            <TrendingDownIcon className="text-red-500 dark:text-red-400" />
          )}
          {formatPercent(rate)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "mae",
    header: sortableHeader("MAE"),
    cell: ({ row }) => (
      <div className="tabular-nums">{formatNumber(row.original.mae)}</div>
    ),
  },
  {
    accessorKey: "rmse",
    header: sortableHeader("RMSE"),
    cell: ({ row }) => (
      <div className="tabular-nums">{formatNumber(row.original.rmse)}</div>
    ),
  },
  {
    accessorKey: "bias",
    header: "Bias",
    cell: ({ row }) => (
      <div className="tabular-nums">{formatNumber(row.original.bias)}</div>
    ),
  },
  {
    accessorKey: "mean_absolute_percentage_error",
    header: "MAPE",
    cell: ({ row }) => (
      <div className="tabular-nums">
        {formatPercent(row.original.mean_absolute_percentage_error)}
      </div>
    ),
  },
  {
    accessorKey: "avg_sentiment_adjustment",
    header: "Sent. Adj.",
    cell: ({ row }) => (
      <div className="tabular-nums text-muted-foreground">
        {formatNumber(row.original.avg_sentiment_adjustment)}
      </div>
    ),
  },
]

const directionColumns: ColumnDef<EvaluationPairSummary>[] = [
  {
    accessorKey: "currency_pair",
    header: "Pair",
    cell: ({ row }) => row.original.currency_pair,
    enableHiding: false,
  },
  {
    accessorKey: "directional_hit_rate",
    header: sortableHeader("Hit Rate"),
    cell: ({ row }) => {
      const rate = row.original.directional_hit_rate
      return (
        <div className="flex items-center gap-2">
          <div className="w-16 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${Math.max(0, Math.min(100, rate ?? 0))}%` }}
            />
          </div>
          <span className="tabular-nums">{formatPercent(rate)}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "matured_count",
    header: sortableHeader("Signals"),
    cell: ({ row }) => (
      <span className="tabular-nums">{formatNumber(row.original.matured_count, 0)}</span>
    ),
  },
  {
    accessorKey: "bias",
    header: sortableHeader("Bias"),
    cell: ({ row }) => {
      const bias = row.original.bias
      const label =
        bias === null
          ? "--"
          : bias > 0
            ? "Over-predicting"
            : bias < 0
              ? "Under-predicting"
              : "Neutral"
      return (
        <div className="space-y-1">
          <div className="tabular-nums">{formatNumber(bias)}</div>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      )
    },
  },
  {
    accessorKey: "rmse",
    header: sortableHeader("RMSE"),
    cell: ({ row }) => (
      <span className="tabular-nums">{formatNumber(row.original.rmse)}</span>
    ),
  },
  {
    accessorKey: "mean_absolute_percentage_error",
    header: sortableHeader("MAPE"),
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatPercent(row.original.mean_absolute_percentage_error)}
      </span>
    ),
  },
]

const sentimentColumns: ColumnDef<EvaluationPairSummary>[] = [
  {
    accessorKey: "currency_pair",
    header: "Pair",
    cell: ({ row }) => row.original.currency_pair,
    enableHiding: false,
  },
  {
    accessorKey: "mae",
    header: sortableHeader("Adj. MAE"),
    cell: ({ row }) => (
      <span className="tabular-nums">{formatNumber(row.original.mae)}</span>
    ),
  },
  {
    accessorKey: "quant_mae",
    header: sortableHeader("Quant MAE"),
    cell: ({ row }) => (
      <span className="tabular-nums">{formatNumber(row.original.quant_mae)}</span>
    ),
  },
  {
    accessorKey: "adjusted_vs_quant_mae_delta",
    header: sortableHeader("Delta"),
    cell: ({ row }) => {
      const delta = row.original.adjusted_vs_quant_mae_delta
      const sentimentWins = delta !== null && delta < 0
      return (
        <div className="space-y-1">
          <div className="tabular-nums">{formatNumber(delta)}</div>
          <p className="text-xs text-muted-foreground">
            {delta === null ? "--" : sentimentWins ? "Adjusted wins" : "Quant wins"}
          </p>
        </div>
      )
    },
  },
  {
    accessorKey: "sentiment_improvement_rate",
    header: sortableHeader("Win Rate"),
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatPercent(row.original.sentiment_improvement_rate)}
      </span>
    ),
  },
  {
    accessorKey: "avg_sentiment_adjustment",
    header: sortableHeader("Avg Adj."),
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatNumber(row.original.avg_sentiment_adjustment)}
      </span>
    ),
  },
]

const columnsByView: Record<TableView, ColumnDef<EvaluationPairSummary>[]> = {
  leaderboard: leaderboardColumns,
  direction: directionColumns,
  sentiment: sentimentColumns,
}

export function DataTable({
  data,
}: {
  data: EvaluationPairSummary[]
}) {
  const horizon = useObservatoryStore((state) => state.horizon)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [view, setView] = React.useState<TableView>(
    ((searchParams.get("overviewTab") as TableView | null) ?? "leaderboard"),
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "mae", desc: false },
  ])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const columns = React.useMemo(() => {
    const withPairCell = (input: ColumnDef<EvaluationPairSummary>[]) =>
      input.map((column) =>
        "accessorKey" in column && column.accessorKey === "currency_pair"
          ? {
              ...column,
              cell: ({ row }: { row: { original: EvaluationPairSummary } }) =>
                pairCell(row.original.currency_pair, horizon),
            }
          : column,
      )

    return withPairCell(columnsByView[view])
  }, [horizon, view])

  const sortableColumnIds = React.useMemo(
    () =>
      columns.map((column) =>
        "id" in column && column.id
          ? String(column.id)
          : "accessorKey" in column && column.accessorKey
            ? String(column.accessorKey)
            : ""
      ),
    [columns]
  )

  const activeSorting = React.useMemo(
    () => sorting.filter((entry) => sortableColumnIds.includes(entry.id)),
    [sortableColumnIds, sorting]
  )

  React.useEffect(() => {
    const nextView = (searchParams.get("overviewTab") as TableView | null) ?? "leaderboard"
    if (nextView !== view) {
      setView(nextView)
    }
  }, [searchParams, view])

  React.useEffect(() => {
    setColumnVisibility({})
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    if (view === "direction") {
      setSorting([{ id: "directional_hit_rate", desc: true }])
      return
    }
    if (view === "sentiment") {
      setSorting([{ id: "sentiment_improvement_rate", desc: true }])
      return
    }
    setSorting([{ id: "mae", desc: false }])
  }, [view])

  const updateView = (nextView: TableView) => {
    setView(nextView)
    const params = new URLSearchParams(searchParams.toString())
    params.set("overviewTab", nextView)
    router.replace(`/?${params.toString()}`, { scroll: false })
  }

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: activeSorting,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <Tabs
      value={view}
      onValueChange={(value) => updateView(value as TableView)}
      className="flex w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select value={view} onValueChange={(value) => updateView(value as TableView)}>
          <SelectTrigger
            className="@4xl/main:hidden flex w-fit"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="leaderboard">Pair Leaderboard</SelectItem>
            <SelectItem value="direction">Direction Analysis</SelectItem>
            <SelectItem value="sentiment">Sentiment Impact</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="@4xl/main:flex hidden">
          <TabsTrigger value="leaderboard">Pair Leaderboard</TabsTrigger>
          <TabsTrigger value="direction" className="gap-1">
            Direction Analysis
            <Badge
              variant="secondary"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30"
            >
              {data.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment Impact</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  <ColumnsIcon />
                  <span className="hidden lg:inline">Customize Columns</span>
                  <span className="lg:hidden">Columns</span>
                  <ChevronDownIcon />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id.replace(/_/g, " ")}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <TabsContent
        value={view}
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No pair data available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {table.getRowModel().rows.length} visible row(s)
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
