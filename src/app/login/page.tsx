import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RadarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const HIGHLIGHTS = [
  "30-day probabilistic paths for three GHS pairs",
  "Event-intelligence evidence and its bounded decision",
  "Model lineage, gate state, and the running accuracy tally",
];

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : "/";
  const error = typeof params.error === "string" ? params.error : undefined;

  const cookieStore = await cookies();
  if (await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value)) {
    redirect(nextPath);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="blueprint pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_72%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.07] blur-3xl"
        style={{ background: "var(--chart-1)" }}
      />

      <div className="relative z-10 w-full max-w-sm space-y-7">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl border bg-card text-[var(--chart-1)]">
            <RadarIcon className="size-6" />
          </div>
          <div className="space-y-1.5">
            <p className="eyebrow">Noeud FX Forecast Intelligence</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Forecast Observatory
            </h1>
            <p className="mx-auto max-w-[19rem] text-sm leading-relaxed text-muted-foreground">
              Internal monitoring surface for the live forecasting experiment.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-4">
            <form action="/auth/login" method="post" className="space-y-4">
              <input type="hidden" name="next" value={nextPath} />
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">
                  Shared observatory key
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••"
                  className="h-10"
                  required
                  autoFocus
                />
              </div>
              {error === "invalid" ? (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                >
                  That key did not match the configured observatory secret.
                </p>
              ) : null}
              <Button type="submit" className="h-10 w-full font-medium">
                Enter the observatory
              </Button>
            </form>
          </CardContent>
        </Card>

        <ul className="space-y-1.5">
          {HIGHLIGHTS.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
            >
              <span
                aria-hidden
                className="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--chart-1)]"
              />
              {item}
            </li>
          ))}
        </ul>

        <p className="text-center text-[0.7rem] text-muted-foreground/60">
          Internal use only · shared-secret access · read-only
        </p>
      </div>
    </main>
  );
}
