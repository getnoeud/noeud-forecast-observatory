"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <RefreshCwIcon className={cn("size-3.5", pending && "animate-spin")} />
      <span className="hidden sm:inline">{pending ? "Refreshing" : "Refresh"}</span>
    </Button>
  );
}
