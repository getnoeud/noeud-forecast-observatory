import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 border-b pb-5 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1.5">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-[1.7rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionHeading({
  title,
  description,
  actions,
  id,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/**
 * A single headline number. Used where a chart would be overkill — one value,
 * its unit, and the one comparison that makes it readable.
 */
export function StatTile({
  label,
  value,
  unit,
  hint,
  accent,
  trend,
  className,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  hint?: React.ReactNode;
  accent?: string;
  trend?: "up" | "down" | "flat";
  className?: string;
}) {
  return (
    <Card className={cn("relative gap-0 overflow-hidden py-0", className)}>
      {accent ? (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ background: accent }}
        />
      ) : null}
      <CardContent className="flex flex-col gap-1.5 px-4 py-3.5">
        <p className="eyebrow">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="tnum font-display text-[1.6rem] leading-none font-semibold">
            {value}
          </span>
          {unit ? (
            <span className="text-sm font-medium text-muted-foreground">{unit}</span>
          ) : null}
          {trend ? (
            <span
              aria-hidden
              className={cn(
                "text-sm leading-none",
                trend === "up" && "text-[var(--chart-8)]",
                trend === "down" && "text-[var(--chart-3)]",
                trend === "flat" && "text-muted-foreground",
              )}
            >
              {trend === "up" ? "▲" : trend === "down" ? "▼" : "■"}
            </span>
          ) : null}
        </div>
        {hint ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Label/value row used inside detail cards. Values are mono + tabular. */
export function Stat({
  label,
  value,
  hint,
  mono = true,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium", mono && "font-mono tnum")}>{value}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? <div className="mb-3 text-muted-foreground">{icon}</div> : null}
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

/** Short explanatory note attached under a chart or table. */
export function ReadingNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-l-2 border-border pl-3 text-xs leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

export function KeyValueGrid({
  items,
  columns = 3,
}: {
  items: { label: string; value: React.ReactNode; hint?: React.ReactNode }[];
  columns?: 2 | 3 | 4;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-4",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-2 lg:grid-cols-4",
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="font-mono text-sm font-medium tnum break-all">{item.value}</dd>
          {item.hint ? (
            <dd className="text-xs text-muted-foreground">{item.hint}</dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
