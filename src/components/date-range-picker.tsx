"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function toDateOrUndefined(value?: string) {
  return value ? new Date(value) : undefined;
}

type DateRangePickerProps = {
  fromDate?: string;
  toDate?: string;
  onRangeChange: (range: { from?: string; to?: string }) => void;
};

const presetOptions = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 60 days", days: 60 },
  { label: "Last 90 days", days: 90 },
];

export function DateRangePicker({
  fromDate,
  toDate,
  onRangeChange,
}: DateRangePickerProps) {
  const from = toDateOrUndefined(fromDate);
  const to = toDateOrUndefined(toDate);
  const [open, setOpen] = React.useState(false);

  const range = React.useMemo<DateRange | undefined>(
    () => ({
      from,
      to,
    }),
    [from, to],
  );

  const label =
    from && to
      ? `${format(from, "PPP")} - ${format(to, "PPP")}`
      : from
        ? `${format(from, "PPP")} - ...`
        : "Pick a date range";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[320px] justify-start text-left font-normal",
            !from && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col gap-3 p-3">
          <div className="flex flex-wrap gap-2 border-b pb-3">
            {presetOptions.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  const end = new Date();
                  const start = addDays(end, -(preset.days - 1));
                  onRangeChange({
                    from: start.toISOString().slice(0, 10),
                    to: end.toISOString().slice(0, 10),
                  });
                  setOpen(false);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={range}
            onSelect={(selected) => {
              onRangeChange({
                from: selected?.from?.toISOString().slice(0, 10),
                to: selected?.to?.toISOString().slice(0, 10),
              });
            }}
            numberOfMonths={2}
            defaultMonth={from ?? addDays(new Date(), -30)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
