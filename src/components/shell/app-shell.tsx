"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/shell/app-sidebar";
import { SiteHeader } from "@/components/shell/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { DataSourceStatus } from "@/lib/server/db";

/** Rendered once in the root layout so sidebar state survives navigation. */
const BARE_ROUTES = ["/login"];

export function AppShell({
  children,
  status,
  projectRef,
}: {
  children: React.ReactNode;
  status: DataSourceStatus;
  projectRef?: string;
}) {
  const pathname = usePathname();
  if (BARE_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "15.5rem",
          "--header-height": "3.25rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <SiteHeader status={status} projectRef={projectRef} />
        <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
