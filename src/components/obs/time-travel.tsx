"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TimeOption = { value: string; label: string; hint?: string };

/**
 * Move between stored snapshots — a forecast origin, an assessment day.
 *
 * Options are newest-first, so "previous" walks back in time. The selection
 * lives in the URL, which makes any historical view linkable and lets the
 * server render exactly that state instead of shipping every snapshot.
 */
export function TimeTravel({
  param,
  value,
  options,
  label,
  className,
}: {
  param: string;
  value: string;
  options: TimeOption[];
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const isNewest = index === 0;

  const go = (next: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === null) params.delete(param);
    else params.set(param, next);
    const query = params.toString();
    startTransition(() =>
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }),
    );
  };

  if (options.length <= 1) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="rounded-md border bg-card px-2 py-1 font-mono text-xs">
          {options[0]?.label ?? "—"}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-lg border bg-card p-1",
        pending && "opacity-70",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label={`Older ${label.toLowerCase()}`}
        disabled={index >= options.length - 1}
        onClick={() => go(options[index + 1]?.value)}
      >
        <ChevronLeftIcon className="size-3.5" />
      </Button>

      <label className="sr-only" htmlFor={`time-travel-${param}`}>
        {label}
      </label>
      <select
        id={`time-travel-${param}`}
        value={options[index]?.value ?? ""}
        onChange={(event) => go(event.target.value)}
        className="h-7 max-w-52 cursor-pointer truncate rounded-md bg-transparent px-1.5 font-mono text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.hint ? ` · ${option.hint}` : ""}
          </option>
        ))}
      </select>

      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label={`Newer ${label.toLowerCase()}`}
        disabled={index === 0}
        onClick={() => go(options[index - 1]?.value)}
      >
        <ChevronRightIcon className="size-3.5" />
      </Button>

      {!isNewest ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={() => go(null)}
        >
          <RotateCcwIcon className="size-3" />
          Latest
        </Button>
      ) : null}
    </div>
  );
}

/** Badge shown when the page is displaying a historical snapshot. */
export function HistoricalNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-[var(--warning)]/35 bg-[var(--warning)]/5 px-3 py-2">
      <span
        aria-hidden
        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--warning)]"
      />
      <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
