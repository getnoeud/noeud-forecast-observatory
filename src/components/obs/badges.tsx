import * as React from "react";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  CircleDotIcon,
  EyeIcon,
  PauseCircleIcon,
  XCircleIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { sentenceCase, titleCase } from "@/lib/format";
import type { Pair } from "@/lib/types";

export const PAIR_COLOR_VAR: Record<Pair, string> = {
  USDGHS: "var(--pair-usdghs)",
  EURGHS: "var(--pair-eurghs)",
  GBPGHS: "var(--pair-gbpghs)",
};

export function PairDot({ pair, className }: { pair: Pair; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-[2px]", className)}
      style={{ background: PAIR_COLOR_VAR[pair] }}
    />
  );
}

export function PairBadge({ pair, className }: { pair: Pair; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 font-mono text-[0.7rem] font-medium",
        className,
      )}
    >
      <PairDot pair={pair} />
      {pair}
    </span>
  );
}

/**
 * Status is carried by icon + label, never by colour alone — these four steps
 * are reserved and never reused as a series colour.
 */
export function StatusPill({
  tone,
  label,
  icon,
  className,
}: {
  tone: "good" | "warning" | "serious" | "critical" | "neutral";
  label: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  const color =
    tone === "neutral" ? "var(--muted-foreground)" : `var(--${tone})`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[0.7rem] font-medium whitespace-nowrap",
        className,
      )}
      style={{ borderColor: `color-mix(in oklab, ${color} 35%, transparent)`, color }}
    >
      {icon}
      {label}
    </span>
  );
}

const DECISION_META: Record<
  string,
  { tone: "good" | "warning" | "serious" | "critical" | "neutral"; label: string; icon: React.ReactNode }
> = {
  hold: { tone: "good", label: "Hold", icon: <CheckCircle2Icon className="size-3" /> },
  monitor: { tone: "warning", label: "Monitor", icon: <EyeIcon className="size-3" /> },
  review_adjustment: {
    tone: "serious",
    label: "Review adjustment",
    icon: <AlertTriangleIcon className="size-3" />,
  },
};

export function DecisionBadge({ decision }: { decision: string }) {
  const meta = DECISION_META[decision] ?? {
    tone: "neutral" as const,
    label: titleCase(decision),
    icon: <CircleDashedIcon className="size-3" />,
  };
  return <StatusPill tone={meta.tone} label={meta.label} icon={meta.icon} />;
}

const RUN_STATE_META: Record<
  string,
  { tone: "good" | "warning" | "serious" | "critical" | "neutral"; icon: React.ReactNode }
> = {
  succeeded: { tone: "good", icon: <CheckCircle2Icon className="size-3" /> },
  finished: { tone: "good", icon: <CheckCircle2Icon className="size-3" /> },
  running: { tone: "warning", icon: <CircleDotIcon className="size-3" /> },
  failed: { tone: "critical", icon: <XCircleIcon className="size-3" /> },
  cancelled: { tone: "neutral", icon: <PauseCircleIcon className="size-3" /> },
};

export function RunStateBadge({ state }: { state: string }) {
  const meta = RUN_STATE_META[state] ?? {
    tone: "neutral" as const,
    icon: <CircleDashedIcon className="size-3" />,
  };
  return <StatusPill tone={meta.tone} label={titleCase(state)} icon={meta.icon} />;
}

export function ModeBadge({ mode }: { mode: string }) {
  return mode === "approved" ? (
    <StatusPill tone="good" label="Approved" icon={<CheckCircle2Icon className="size-3" />} />
  ) : (
    <StatusPill tone="warning" label="Shadow" icon={<EyeIcon className="size-3" />} />
  );
}

export function RelevanceBadge({ relevance }: { relevance: string }) {
  const variant =
    relevance === "high" ? "default" : relevance === "medium" ? "secondary" : "outline";
  return (
    <Badge variant={variant} className="font-mono text-[0.65rem]">
      {relevance}
    </Badge>
  );
}

/**
 * Evidence sentiment is stated from the cedi's point of view, so the label
 * always spells out the direction rather than relying on a colour.
 */
export function SentimentBadge({ sentiment }: { sentiment: string }) {
  const meta: Record<string, { tone: Parameters<typeof StatusPill>[0]["tone"]; label: string }> = {
    cedi_negative: { tone: "critical", label: "Cedi negative" },
    cedi_positive: { tone: "good", label: "Cedi positive" },
    mixed: { tone: "warning", label: "Mixed" },
    neutral: { tone: "neutral", label: "Neutral" },
  };
  const entry = meta[sentiment] ?? { tone: "neutral" as const, label: sentenceCase(sentiment) };
  return <StatusPill tone={entry.tone} label={entry.label} />;
}

export function VerificationBadge({
  status,
  errorCode,
}: {
  status?: string;
  errorCode?: string | null;
}) {
  if (status === "verified") {
    return (
      <StatusPill tone="good" label="Verified" icon={<CheckCircle2Icon className="size-3" />} />
    );
  }
  if (status === "failed") {
    return <StatusPill tone="critical" label="Failed" icon={<XCircleIcon className="size-3" />} />;
  }
  return (
    <StatusPill
      tone="neutral"
      label={errorCode ? sentenceCase(errorCode) : "Skipped"}
      icon={<CircleDashedIcon className="size-3" />}
    />
  );
}

export function SelectionBadge({ selection }: { selection: string }) {
  return selection === "event_candidate" ? (
    <StatusPill tone="serious" label="Event candidate" icon={<AlertTriangleIcon className="size-3" />} />
  ) : (
    <StatusPill tone="neutral" label="Base" icon={<CircleDashedIcon className="size-3" />} />
  );
}

export function MonoTag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border bg-muted/60 px-1.5 py-0.5 font-mono text-[0.68rem] text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
