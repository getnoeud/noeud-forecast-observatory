"use client"

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"

import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  viewportClassName,
  ...props
}: ScrollAreaPrimitive.Root.Props & { viewportClassName?: string }) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className={cn(
          "size-full overscroll-contain rounded-[inherit] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          viewportClassName
        )}
      >
        <ScrollAreaPrimitive.Content>{children}</ScrollAreaPrimitive.Content>
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        className="flex w-1.5 touch-none justify-center rounded bg-transparent p-px opacity-0 transition-opacity delay-300 select-none data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[scrolling]:opacity-100 data-[scrolling]:delay-0"
      >
        <ScrollAreaPrimitive.Thumb className="w-full rounded bg-border" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Scrollbar
        orientation="horizontal"
        className="flex h-1.5 touch-none flex-col rounded bg-transparent p-px opacity-0 transition-opacity delay-300 select-none data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[scrolling]:opacity-100 data-[scrolling]:delay-0"
      >
        <ScrollAreaPrimitive.Thumb className="h-full rounded bg-border" />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  )
}

export { ScrollArea }
