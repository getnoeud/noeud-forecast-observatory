"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { DatabaseZapIcon, PlugZapIcon, TriangleAlertIcon } from "lucide-react";

import { navItemFor } from "@/components/shell/nav";
import { RefreshButton } from "@/components/shell/refresh-button";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { StatusPill } from "@/components/obs/badges";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { DataSourceStatus } from "@/lib/server/db";

export function SiteHeader({
  status,
  projectRef,
}: {
  status: DataSourceStatus;
  projectRef?: string;
}) {
  const pathname = usePathname();
  const item = navItemFor(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/85 backdrop-blur-sm">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-1 h-4" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{item?.title ?? "Observatory"}</p>
          <p className="hidden truncate text-xs text-muted-foreground md:block">
            {item?.blurb}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {status.state === "ok" ? (
            <StatusPill
              tone="good"
              icon={<DatabaseZapIcon className="size-3" />}
              label={
                <span className="font-mono">
                  supabase
                  {projectRef ? ` · ${projectRef.slice(0, 6)}` : ""} · {status.latencyMs}ms
                </span>
              }
              className="hidden sm:inline-flex"
            />
          ) : status.state === "unconfigured" ? (
            <StatusPill
              tone="warning"
              icon={<PlugZapIcon className="size-3" />}
              label="Database not configured"
            />
          ) : (
            <StatusPill
              tone="critical"
              icon={<TriangleAlertIcon className="size-3" />}
              label="Database unreachable"
            />
          )}
          <RefreshButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
