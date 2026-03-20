"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface PairComboboxProps {
  pairs: string[]
  value: string
  onValueChange: (value: string) => void
  includeAll?: boolean
}

export function PairCombobox({
  pairs,
  value,
  onValueChange,
  includeAll = true,
}: PairComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const allPairs = [
    ...(includeAll ? [{ value: "ALL", label: "All available pairs" }] : []),
    ...pairs.map((p) => ({ value: p, label: p })),
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[220px] justify-between"
        >
          {value === "ALL" ? "All pairs" : value}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0">
        <Command>
          <CommandInput placeholder="Search pairs..." />
          <CommandList>
            <CommandEmpty>No pair found.</CommandEmpty>
            <CommandGroup>
              {allPairs.map((pair) => (
                <CommandItem
                  key={pair.value}
                  value={pair.value}
                  onSelect={() => {
                    onValueChange(pair.value === value ? "ALL" : pair.value)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === pair.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {pair.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
