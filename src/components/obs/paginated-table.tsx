"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHeader } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Pagination for tables whose rows are built on the server.
 *
 * Rows arrive already rendered so each page keeps its rich cells — badges,
 * links, colour-coded numbers — without re-implementing them as a column
 * config. Only the visible page is mounted.
 */
export function PaginatedTable({
  header,
  rows,
  pageSize = 15,
  label = "rows",
  className,
  emptyMessage = "Nothing to show.",
}: {
  header: React.ReactNode;
  rows: React.ReactNode[];
  pageSize?: number;
  label?: string;
  className?: string;
  emptyMessage?: string;
}) {
  const [page, setPage] = React.useState(0);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const start = current * pageSize;
  const visible = rows.slice(start, start + pageSize);

  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>{header}</TableHeader>
          <TableBody>{visible}</TableBody>
        </Table>
      </div>

      {rows.length > pageSize ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <p className="tnum text-xs text-muted-foreground">
            {start + 1}–{Math.min(start + pageSize, rows.length)} of {rows.length} {label}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeftIcon className="size-3.5" />
              Prev
            </Button>
            <span className="tnum px-1 font-mono text-xs text-muted-foreground">
              {current + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2"
              disabled={current >= pageCount - 1}
              onClick={() => setPage(current + 1)}
            >
              Next
              <ChevronRightIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
