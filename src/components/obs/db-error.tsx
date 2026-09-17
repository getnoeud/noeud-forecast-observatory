import { DatabaseIcon, TriangleAlertIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { DatabaseNotConfiguredError } from "@/lib/server/db";

/**
 * Every page renders through this. A failed Supabase read is shown as a failed
 * read — the observatory never substitutes fixture data for live rows, because
 * a dashboard that silently mixes the two is worse than one that is down.
 */
export function DataSourceError({ error }: { error: unknown }) {
  const unconfigured = error instanceof DatabaseNotConfiguredError;
  const message = error instanceof Error ? error.message : String(error);

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-start gap-3 py-8">
        <div className="flex items-center gap-2 text-[var(--critical)]">
          {unconfigured ? (
            <DatabaseIcon className="size-4" />
          ) : (
            <TriangleAlertIcon className="size-4" />
          )}
          <p className="text-sm font-medium">
            {unconfigured
              ? "The observatory has no database connection configured"
              : "Could not read the noeud_forecast schema"}
          </p>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {unconfigured ? (
            <>
              Set <code className="font-mono text-xs">OBSERVATORY_DATABASE_URL</code> to the
              Supabase session-pooler URI for this project and restart the dev server. The
              private <code className="font-mono text-xs">noeud_forecast</code> schema is
              deliberately absent from the Data API, so the observatory reads it server-side
              over PostgreSQL rather than through PostgREST.
            </>
          ) : (
            <>
              No fallback data is shown. Check that the pooler host is reachable, that the
              login still has <code className="font-mono text-xs">usage</code> on the schema,
              and that the project is not paused.
            </>
          )}
        </p>
        <pre className="max-w-full overflow-x-auto rounded-lg border bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
          {message}
        </pre>
      </CardContent>
    </Card>
  );
}
