"use client";

import * as React from "react";
import { ResponsiveContainer } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type LegendEntry = {
  label: string;
  color?: string;
  /** "line" | "area" | "dot" | "dash" — drawn as a swatch, plus the label. */
  shape?: "line" | "area" | "dot" | "dash";
};

/** The legend is always present for two or more series; never colour alone. */
export function ChartLegend({ entries }: { entries: LegendEntry[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {entries.map((entry) => (
        <li key={entry.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            aria-hidden
            className={cn(
              "inline-block shrink-0",
              entry.shape === "dot" && "size-2 rounded-full",
              entry.shape === "area" && "h-2.5 w-3.5 rounded-[2px]",
              (entry.shape === "line" || !entry.shape) && "h-0.5 w-4 rounded-full",
              entry.shape === "dash" && "h-0.5 w-4 rounded-full opacity-70",
            )}
            style={{
              background: entry.color ?? "var(--muted-foreground)",
              backgroundImage:
                entry.shape === "dash"
                  ? `repeating-linear-gradient(90deg, ${entry.color ?? "var(--muted-foreground)"} 0 4px, transparent 4px 7px)`
                  : undefined,
            }}
          />
          {entry.label}
        </li>
      ))}
    </ul>
  );
}

export function ChartFrame({
  title,
  description,
  legend,
  toolbar,
  footnote,
  height = 300,
  children,
  className,
  contentClassName,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  legend?: LegendEntry[];
  toolbar?: React.ReactNode;
  footnote?: React.ReactNode;
  height?: number;
  children: React.ReactElement;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("gap-4 overflow-hidden", className)}>
      <CardHeader className="gap-1.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="font-display text-sm font-semibold">{title}</CardTitle>
            {description ? (
              <CardDescription className="max-w-2xl text-xs leading-relaxed">
                {description}
              </CardDescription>
            ) : null}
          </div>
          {toolbar ? <div className="flex items-center gap-2">{toolbar}</div> : null}
        </div>
        {legend?.length ? <ChartLegend entries={legend} /> : null}
      </CardHeader>
      <CardContent className={cn("pb-2", contentClassName)}>
        <div style={{ height }} className="w-full [&_.recharts-surface]:overflow-visible">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </CardContent>
      {footnote ? (
        <CardContent className="pt-0">
          <p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
            {footnote}
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
}

/* --------------------------------------------------------------- tooltips */

export function TooltipShell({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-44 rounded-lg border bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <p className="font-medium text-popover-foreground">{title}</p>
      {subtitle ? <p className="mb-1.5 text-muted-foreground">{subtitle}</p> : null}
      <div className="mt-1.5 space-y-1">{children}</div>
    </div>
  );
}

export function TooltipRow({
  label,
  value,
  color,
  emphasis,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  color?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {color ? (
          <span
            aria-hidden
            className="inline-block size-2 shrink-0 rounded-[2px]"
            style={{ background: color }}
          />
        ) : null}
        {label}
      </span>
      <span className={cn("font-mono tnum", emphasis && "font-semibold")}>{value}</span>
    </div>
  );
}

export const AXIS_TICK = {
  fontSize: 11,
  fill: "var(--muted-foreground)",
} as const;

export const GRID_PROPS = {
  stroke: "var(--grid)",
  strokeDasharray: "0",
  vertical: false,
} as const;
