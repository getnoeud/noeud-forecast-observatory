"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PAIR_COLOR_VAR } from "@/components/obs/badges";
import { cn } from "@/lib/utils";
import { PAIRS, type Pair } from "@/lib/types";

/**
 * Pair selection lives in the URL so a view can be linked to and so the server
 * component re-renders with the right data instead of shipping all three.
 */
export function PairSwitcher({ value }: { value: Pair }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  const select = (pair: Pair) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pair", pair);
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  };

  return (
    <div
      role="tablist"
      aria-label="Currency pair"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border bg-card p-0.5",
        pending && "opacity-70",
      )}
    >
      {PAIRS.map((pair) => {
        const active = pair === value;
        return (
          <button
            key={pair}
            role="tab"
            aria-selected={active}
            onClick={() => select(pair)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-xs font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span
              aria-hidden
              className="inline-block size-2 rounded-[2px]"
              style={{
                background: PAIR_COLOR_VAR[pair],
                opacity: active ? 1 : 0.45,
              }}
            />
            {pair}
          </button>
        );
      })}
    </div>
  );
}

/** Generic segmented control used for window/range selection. */
export function SegmentedParam({
  param,
  value,
  options,
  label,
}: {
  param: string;
  value: string;
  options: { value: string; label: string }[];
  label: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  const select = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(param, next);
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  };

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border bg-card p-0.5",
        pending && "opacity-70",
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          aria-pressed={option.value === value}
          onClick={() => select(option.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            option.value === value
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
