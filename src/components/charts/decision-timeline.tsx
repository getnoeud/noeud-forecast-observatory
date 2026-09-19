"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DECISION_COLORS } from "@/lib/intelligence";
import { formatDate, formatUsd, titleCase } from "@/lib/format";
import { PAIRS, type Pair } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartLegend } from "@/components/charts/frame";
import { cn } from "@/lib/utils";

export type TimelineCell = {
  day: string;
  pair: Pair;
  decision: string;
  publication_action: string;
  evidence_count: number;
  rejected_count: number;
  cost_usd: number;
};

/**
 * One column per day, one lane per pair. Reading across a lane shows how the
 * stance on a pair moved; reading down a column shows whether a day's news hit
 * all three pairs or only one.
 *
 * Each cell is a link into that day's full assessment, so the chart is the
 * navigation as well as the summary.
 */
export function DecisionTimeline({
  cells,
  selectedDay,
  onSelectDay,
  maxDays = 45,
}: {
  cells: TimelineCell[];
  selectedDay?: string;
  onSelectDay?: (day: string) => void;
  maxDays?: number;
}) {
  const days = React.useMemo(
    () => Array.from(new Set(cells.map((cell) => cell.day))).sort().slice(-maxDays),
    [cells, maxDays],
  );
  const index = React.useMemo(() => {
    const map = new Map<string, TimelineCell>();
    for (const cell of cells) map.set(`${cell.day}|${cell.pair}`, cell);
    return map;
  }, [cells]);

  const decisions = Array.from(new Set(cells.map((cell) => cell.decision)));

  return (
    <Card className="gap-4">
      <CardHeader className="gap-1.5">
        <CardTitle className="font-display text-sm font-semibold">
          Decision history
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          Every recorded day, one lane per pair. Select a cell to open that day&apos;s
          assessment.
        </CardDescription>
        <ChartLegend
          entries={[
            ...decisions.map((decision) => ({
              label: titleCase(decision),
              color: DECISION_COLORS[decision] ?? "var(--muted-foreground)",
              shape: "area" as const,
            })),
            { label: "No assessment", color: "var(--muted)", shape: "area" as const },
          ]}
        />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="overflow-x-auto pb-1">
          <div className="min-w-fit space-y-1">
            {PAIRS.map((pair) => (
              <div key={pair} className="flex items-center gap-2">
                <span className="w-16 shrink-0 font-mono text-[0.68rem] text-muted-foreground">
                  {pair}
                </span>
                <div className="flex gap-1">
                  {days.map((day) => {
                    const cell = index.get(`${day}|${pair}`);
                    const color = cell
                      ? (DECISION_COLORS[cell.decision] ?? "var(--muted-foreground)")
                      : "var(--muted)";
                    const isSelected = day === selectedDay;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => onSelectDay?.(day)}
                        aria-label={`${pair} on ${formatDate(day)}: ${cell ? cell.decision : "no assessment"}`}
                        title={
                          cell
                            ? `${formatDate(day)} · ${titleCase(cell.decision)} · ${cell.evidence_count} evidence · ${formatUsd(cell.cost_usd, 4)}`
                            : `${formatDate(day)} · no assessment`
                        }
                        className={cn(
                          "size-5 rounded-[3px] transition-all",
                          onSelectDay && "cursor-pointer hover:scale-110",
                          isSelected && "ring-2 ring-ring ring-offset-1 ring-offset-card",
                        )}
                        style={{ background: color, opacity: cell ? 1 : 0.4 }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1">
              <span className="w-16 shrink-0" />
              <div className="flex gap-1">
                {days.map((day, position) => (
                  <span
                    key={day}
                    className="w-5 shrink-0 text-center font-mono text-[0.58rem] text-muted-foreground"
                  >
                    {position === 0 ||
                    position === days.length - 1 ||
                    day.endsWith("-01") ||
                    position % 7 === 0
                      ? day.slice(8)
                      : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
          A grey cell means no assessment was recorded for that pair that day. Assessments run weekdays at 12:00, so Saturdays and Sundays are expected gaps; a grey weekday means a paused
          schedule, a failed run, or a day before the experiment started. Decisions are the
          model&apos;s recommendation only; none of them published anything.
        </p>
      </CardContent>
    </Card>
  );
}

/** URL-driven wrapper: clicking a cell navigates to that day's assessment. */
export function DecisionTimelineNav({
  cells,
  selectedDay,
}: {
  cells: TimelineCell[];
  selectedDay?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <DecisionTimeline
      cells={cells}
      selectedDay={selectedDay}
      onSelectDay={(day) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("date", day);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }}
    />
  );
}
