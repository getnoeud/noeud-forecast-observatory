import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ActivityIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : "/";
  const error = typeof params.error === "string" ? params.error : undefined;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (await verifySessionToken(token)) {
    redirect(nextPath);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Africa continent silhouette — positioned bottom-right, subtle */}
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-[600px] w-[500px] opacity-[0.03] dark:opacity-[0.06]">
        <svg
          viewBox="0 0 500 600"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          className="h-full w-full"
        >
          <path d="M248 2c4 2 10 4 14 8 6 6 8 14 16 18 6 4 14 2 20 6 8 6 6 18 12 26 4 6 12 8 16 14 6 8 4 18 8 26 4 8 12 14 14 22 2 10-4 18-2 28 2 8 8 14 8 22 0 10-6 18-6 28 0 8 4 16 2 24-2 10-10 16-12 26-2 8 0 18-4 26s-12 12-16 20c-4 10 0 20-2 30-2 8-8 14-12 22-4 10-4 20-10 28-4 8-14 10-18 18-6 10-4 22-10 30-4 6-12 10-18 14-6 6-10 14-18 18-6 4-14 4-20 8-8 6-12 14-20 18-6 4-14 4-20 8-8 6-10 16-18 22-6 4-14 6-20 10-8 4-14 10-22 12-8 2-16-2-24 0-8 0-16 4-24 4-6 0-14-2-20 0-8 2-14 8-22 8-6 0-12-4-18-4-8 0-16 4-22 2-8-2-14-8-22-8-6 0-14 4-20 2-8-2-14-8-20-12-6-4-10-10-16-14-4-4-12-4-16-8-6-4-8-12-14-16-4-6-12-8-14-14-4-6-2-14-4-22-2-6-6-10-6-18 0-6 4-12 4-18 0-8-4-14-4-22s4-14 4-22c0-6-4-12-2-18 2-8 8-14 10-20 2-8 0-16 4-24 2-8 10-12 12-20 2-6 0-14 4-20 4-8 12-12 16-18 4-8 4-18 10-24 4-6 12-8 18-12 4-4 8-10 14-12 6-4 14-2 20-4 8-4 12-10 20-12 6-2 12 0 18-2 8-2 14-8 22-8z" />
        </svg>
      </div>

      {/* Subtle dot grid pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.05]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="dots"
              x="0"
              y="0"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Gradient vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_70%)]" />

      <div className="relative z-10 w-full max-w-sm space-y-8">
        {/* Logo & branding */}
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-primary text-primary-foreground shadow-sm">
            <ActivityIcon className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Noeud Observatory
            </h1>
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
              Validate production forecasts against realized FX market data.
            </p>
          </div>
        </div>

        {/* Login card */}
        <Card className="shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-base">Sign in</CardTitle>
            <CardDescription className="text-sm">
              Enter the shared observatory key to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/auth/login" method="post" className="space-y-4">
              <input type="hidden" name="next" value={nextPath} />
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">
                  Shared password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter the observatory key"
                  className="h-10"
                  required
                  autoFocus
                />
              </div>
              {error === "invalid" && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  That password did not match the configured observatory key.
                </div>
              )}
              <Button type="submit" className="h-10 w-full font-medium">
                Enter dashboard
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/50">
          Noeud Forecast Observatory - Internal use only
        </p>
      </div>
    </main>
  );
}

