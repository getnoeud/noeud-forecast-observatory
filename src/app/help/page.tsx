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
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const metrics = [
  {
    title: "Directional Hit Rate",
    description:
      "Shows how often the model got the move direction right relative to the issuance current rate. This is the fastest practical confidence signal for daily operational review.",
  },
  {
    title: "MAE and RMSE",
    description:
      "MAE keeps the day-to-day error story readable, while RMSE makes larger misses show up more clearly. Using both helps us separate steady drift from sharper misses.",
  },
  {
    title: "Bias",
    description:
      "Bias tells us if the model is systematically over-predicting or under-predicting. This is especially useful when hit rate looks acceptable but the price level still drifts.",
  },
  {
    title: "Sentiment Lift",
    description:
      "This compares the adjusted forecast against the quant-only baseline so we can see when sentiment is adding value instead of just adding movement.",
  },
];

export default function HelpPage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Observatory Help
              </h1>
              <p className="text-sm text-muted-foreground">
                Why the evaluation pipeline is shaped this way, what the charts
                mean, and how to read the dashboard without guessing.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Evaluation Lifecycle</CardTitle>
                <CardDescription>
                  Forecasts are issued daily, but evaluation rows only appear
                  after the target date matures against real market data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>1. Daily forecast flow writes new issuances into <code>predictions</code>.</p>
                <p>2. Daily price ingestion updates <code>raw_price_data</code>.</p>
                <p>3. Evaluation flow waits until the target date matures.</p>
                <p>4. If the target date lands on a non-trading day, the next available market day is used and stored as <code>resolved_actual_date</code>.</p>
                <p>5. Matured rows are written into <code>forecast_evaluations</code>, and the observatory reads from those rows for performance tracking.</p>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {metrics.map((metric) => (
                <Card key={metric.title}>
                  <CardHeader>
                    <CardTitle>{metric.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {metric.description}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            <Card>
              <CardHeader>
                <CardTitle>How To Read The Main Views</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p><strong>Rolling Performance:</strong> use this to spot whether the live error trend is tightening or widening over time.</p>
                <p><strong>Pair Leaderboard:</strong> use this when deciding where the model is dependable enough for beta-facing visibility.</p>
                <p><strong>Forecast Path:</strong> use this on the pair review page to inspect daily issuance curves, not just matured outcomes.</p>
                <p><strong>Sentiment:</strong> use this to see whether sentiment is genuinely improving error versus the quant-only baseline.</p>
                <p><strong>Audit Trail:</strong> use this when you need row-level proof of what was predicted, what actually happened, and how far off it was.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
