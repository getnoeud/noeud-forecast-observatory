"use client";

import * as React from "react";
import { ChevronRightIcon } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

/**
 * Raw record inspector. Every number on the intelligence page comes from one of
 * these documents, so the documents themselves stay one click away.
 */
export function JsonViewer({
  value,
  label,
  maxHeight = 380,
  defaultOpen = false,
}: {
  value: unknown;
  label: string;
  maxHeight?: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const text = React.useMemo(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }, [value]);

  return (
    <div className="rounded-lg border">
      <button
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        aria-expanded={open}
      >
        <ChevronRightIcon
          className={cn("size-3.5 transition-transform", open && "rotate-90")}
        />
        {label}
        <span className="ml-auto font-mono text-[0.68rem]">
          {(text.length / 1024).toFixed(1)} KB
        </span>
      </button>
      {open ? (
        <ScrollArea style={{ maxHeight }} className="border-t">
          <pre className="px-3 py-2 font-mono text-[0.68rem] leading-relaxed whitespace-pre-wrap">
            {text}
          </pre>
        </ScrollArea>
      ) : null}
    </div>
  );
}

/** Long model-authored prose rendered as paragraphs rather than one wall. */
export function Prose({ text, className }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  return (
    <div className={cn("space-y-3", className)}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="text-sm leading-relaxed text-muted-foreground">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
