"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function SettingsPage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
              <p className="text-sm text-muted-foreground">
                Lightweight observatory preferences for the beta phase.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Theme and Layout</CardTitle>
                  <CardDescription>
                    Theme switching is available from the header toggle. Sidebar
                    collapse is remembered locally by the shell.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Use the header sun/moon control to switch themes.</p>
                  <p>
                    Pair review navigation now remembers the last pair and
                    horizon you opened.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Beta Defaults</CardTitle>
                  <CardDescription>
                    These defaults are deliberate so the ML team sees the
                    7-day live horizon first while 30-day stays more clearly in
                    evaluation mode.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Default live horizon: 7 days</p>
                  <p>Evaluation window preset: last 60 days</p>
                  <p>Reports page default: weekly export</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
