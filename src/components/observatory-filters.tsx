"use client"

import * as React from "react"
import { CalendarDays, RotateCcw } from "lucide-react"

import { DateRangePicker } from "@/components/date-range-picker"
import { PairCombobox } from "@/components/pair-combobox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useObservatoryStore } from "@/store/observatory-store"

interface ObservatoryFiltersProps {
  supportedPairs: string[]
}

export function ObservatoryFilters({ supportedPairs }: ObservatoryFiltersProps) {
  const {
    horizon,
    pair,
    fromDate,
    toDate,
    setHorizon,
    setPair,
    setFromDate,
    setToDate,
    resetWindow,
  } = useObservatoryStore()

  React.useEffect(() => {
    if (pair !== "ALL" && !supportedPairs.includes(pair)) {
      setPair("ALL")
    }
  }, [pair, setPair, supportedPairs])

  return (
    <div className="flex flex-wrap items-end gap-4 px-4 lg:px-6">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Currency Pair</Label>
        <PairCombobox
          pairs={supportedPairs}
          value={pair}
          onValueChange={setPair}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Horizon</Label>
        <Select value={String(horizon)} onValueChange={(v) => setHorizon(Number(v))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="14">14 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="hidden h-8 md:block" />

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">
          <CalendarDays className="mr-1 inline h-3 w-3" />
          Evaluation Window
        </Label>
        <DateRangePicker
          fromDate={fromDate}
          toDate={toDate}
          onRangeChange={({ from, to }) => {
            if (from) setFromDate(from)
            if (to) setToDate(to)
          }}
        />
      </div>

      <Button variant="ghost" size="sm" onClick={resetWindow} className="gap-1.5 text-muted-foreground">
        <RotateCcw className="h-3.5 w-3.5" />
        Reset
      </Button>
    </div>
  )
}
