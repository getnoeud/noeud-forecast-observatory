"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type InlineSelectOption = {
  value: string;
  label: string;
  hint?: string;
};

/**
 * A small, styled dropdown for compact controls (page size, a day picker)
 * that still need the app's own trigger/popup chrome rather than a bare
 * native `<select>`.
 */
export function InlineSelect({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  triggerClassName,
  contentClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  options: InlineSelectOption[];
  ariaLabel: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (typeof next === "string") onChange(next);
      }}
      items={options.map((option) => ({ value: option.value, label: option.label }))}
    >
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className={cn(
          "h-7 gap-1 rounded-md border-transparent bg-muted/60 px-2 font-mono text-xs hover:bg-muted",
          triggerClassName,
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className={cn("min-w-[9rem]", contentClassName)}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="font-mono text-xs">
            <span className="flex-1">{option.label}</span>
            {option.hint ? (
              <span className="text-[0.68rem] text-muted-foreground">{option.hint}</span>
            ) : null}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
