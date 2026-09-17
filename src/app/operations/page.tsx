import { ServerCogIcon } from "lucide-react";

import { MonoTag, RunStateBadge, StatusPill } from "@/components/obs/badges";
import { DataSourceError } from "@/components/obs/db-error";
import { JsonViewer } from "@/components/obs/json-viewer";
import { PaginatedTable } from "@/components/obs/paginated-table";
import {
  EmptyState,
  KeyValueGrid,
  PageHeader,
  ReadingNote,
  SectionHeading,
  StatTile,
} from "@/components/obs/primitives";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDateTime,
  formatDuration,
  formatInteger,
  formatRelative,
  shortHash,
} from "@/lib/format";
import {
  getEventJobs,
  getInventory,
  getPipelineRuns,
  getProviderRollup,
  getRetrievalJobs,
} from "@/lib/server/queries";
import type { LeaseJob } from "@/lib/types";

export const dynamic = "force-dynamic";

function LeaseTable({ jobs, label }: { jobs: LeaseJob[]; label: string }) {
  if (!jobs.length) {
    return <EmptyState title={`No ${label.toLowerCase()} recorded`} />;
  }
  const header = (
    <TableRow>
      <TableHead>Key</TableHead>
      <TableHead>State</TableHead>
      <TableHead className="text-right">Attempts</TableHead>
      <TableHead>Claimed</TableHead>
      <TableHead>Lease expiry</TableHead>
      <TableHead>Error</TableHead>
    </TableRow>
  );
  const rows = jobs.map((job) => (
            <TableRow key={job.key}>
              <TableCell className="font-mono text-[0.68rem] text-muted-foreground">
                {shortHash(job.key, 14)}
              </TableCell>
              <TableCell>
                <RunStateBadge state={job.state} />
              </TableCell>
              <TableCell className="tnum text-right font-mono text-xs">
                {job.attempt_count}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDateTime(job.claimed_at)}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatRelative(job.lease_expires_at)}
              </TableCell>
              <TableCell className="text-xs">
                {job.error_code ? (
                  <StatusPill tone="critical" label={job.error_code} />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
  ));
  return <PaginatedTable header={header} rows={rows} pageSize={8} label="claims" />;
}

export default async function OperationsPage() {
  let runs;
  let eventJobs;
  let retrievalJobs;
  let rollup;
  let inventory;
  try {
    [runs, eventJobs, retrievalJobs, rollup, inventory] = await Promise.all([
      getPipelineRuns(40),
      getEventJobs(40),
      getRetrievalJobs(40),
      getProviderRollup(),
      getInventory(),
    ]);
  } catch (error) {
    return (
      <>
        <PageHeader eyebrow="Operations" title="Operations" />
        <DataSourceError error={error} />
      </>
    );
  }

  const latest = runs[0] ?? null;
  const succeeded = runs.filter((run) => run.state === "succeeded").length;
  const failed = runs.filter((run) => run.state === "failed").length;
  const durations = runs
    .filter((run) => run.completed_at)
    .map(
      (run) =>
        (new Date(run.completed_at as string).getTime() - new Date(run.started_at).getTime()) /
        1000,
    );
  const meanDuration = durations.length
    ? durations.reduce((sum, value) => sum + value, 0) / durations.length
    : null;
  const totalRows = inventory.reduce((sum, row) => sum + row.rows, 0);
  const ingestedRows = rollup.reduce((sum, row) => sum + row.rows_written, 0);

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Operations"
        description="The dependency-ordered daily flow and the leases that keep it exactly-once. One flow ingests, issues the Monday branch when due, assesses events, and materialises the shadow publication — so no downstream step relies on a guessed time gap."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Last cycle"
          value={latest ? formatRelative(latest.completed_at ?? latest.started_at) : "—"}
          hint={
            latest ? (
              <span className="flex flex-wrap items-center gap-1.5">
                <RunStateBadge state={latest.state} />
                <MonoTag>{latest.deployment_name}</MonoTag>
              </span>
            ) : (
              "No pipeline run recorded"
            )
          }
          accent="var(--chart-1)"
        />
        <StatTile
          label="Recorded runs"
          value={runs.length}
          hint={`${succeeded} succeeded · ${failed} failed`}
          accent={failed ? "var(--critical)" : "var(--good)"}
        />
        <StatTile
          label="Mean cycle duration"
          value={formatDuration(meanDuration)}
          hint="Wall clock from first task start to flow completion"
          accent="var(--chart-7)"
        />
        <StatTile
          label="Rows under management"
          value={formatInteger(totalRows)}
          hint={`${formatInteger(ingestedRows)} written by provider ingestion across ${formatInteger(rollup.reduce((sum, row) => sum + row.runs, 0))} runs`}
          accent="var(--chart-3)"
        />
      </section>

      <section className="space-y-3">
        <SectionHeading
          title="Pipeline runs"
          description="Expand a run's result summary to see exactly what each task produced."
        />
        {runs.length ? (
          <div className="space-y-3">
            {runs.map((run) => (
              <Card key={run.pipeline_run_id} className="gap-3">
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <RunStateBadge state={run.state} />
                    <MonoTag>{run.deployment_name}</MonoTag>
                    {run.deployment_version ? (
                      <MonoTag>v{run.deployment_version}</MonoTag>
                    ) : null}
                    {run.error_code ? (
                      <StatusPill tone="critical" label={run.error_code} />
                    ) : null}
                    <span className="ml-auto font-mono text-[0.68rem] text-muted-foreground">
                      {shortHash(run.run_key, 16)}
                    </span>
                  </div>
                  <KeyValueGrid
                    columns={4}
                    items={[
                      { label: "Scheduled for", value: formatDateTime(run.scheduled_for) },
                      { label: "Started", value: formatDateTime(run.started_at) },
                      { label: "Completed", value: formatDateTime(run.completed_at) },
                      {
                        label: "Duration",
                        value: run.completed_at
                          ? formatDuration(
                              (new Date(run.completed_at).getTime() -
                                new Date(run.started_at).getTime()) /
                                1000,
                            )
                          : "running",
                      },
                    ]}
                  />
                  <JsonViewer label="Task result summary" value={run.result_summary} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No pipeline runs recorded"
            description="Prefect schedules stay paused until a manual database write/read cycle passes its acceptance checks."
            icon={<ServerCogIcon className="size-5" />}
          />
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="gap-4">
          <CardContent className="space-y-4">
            <SectionHeading
              title="Event assessment leases"
              description="One lease per pair per context hash. A claim that expires without finishing can be retried; a finished claim cannot be re-run into a duplicate assessment."
            />
            <LeaseTable jobs={eventJobs} label="Event jobs" />
          </CardContent>
        </Card>
        <Card className="gap-4">
          <CardContent className="space-y-4">
            <SectionHeading
              title="Retrieval leases"
              description="The same mechanism for the paid news-search call, keyed by request hash so an identical request is never bought twice."
            />
            <LeaseTable jobs={retrievalJobs} label="Retrieval jobs" />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="gap-4">
          <CardContent className="space-y-4">
            <SectionHeading
              title="Provider ingestion"
              description="Every call made against the FX provider, grouped by request kind."
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kind</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Runs</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                  <TableHead>Latest</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rollup.map((row) => (
                  <TableRow key={`${row.request_kind}-${row.status}`}>
                    <TableCell className="font-mono text-xs">{row.request_kind}</TableCell>
                    <TableCell>
                      <RunStateBadge state={row.status} />
                    </TableCell>
                    <TableCell className="tnum text-right font-mono text-xs">
                      {formatInteger(row.runs)}
                    </TableCell>
                    <TableCell className="tnum text-right font-mono text-xs">
                      {formatInteger(row.rows_written)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(row.last_started)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ReadingNote>
              A <MonoTag>backfill</MonoTag> run reconstructed a single historical date;{" "}
              <MonoTag>latest</MonoTag> is the daily call; <MonoTag>historical</MonoTag> repairs
              a date the schedule missed. The ingestion task repairs gaps before appending the
              latest snapshot, so continuity is restored before any model runs.
            </ReadingNote>
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardContent className="space-y-4">
            <SectionHeading
              title="Schema inventory"
              description="Live row counts for every table in the private noeud_forecast schema."
            />
            <PaginatedTable
              pageSize={10}
              label="tables"
              header={
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                </TableRow>
              }
              rows={inventory.map((row) => (
                <TableRow key={row.table_name}>
                  <TableCell className="font-mono text-xs">{row.table_name}</TableCell>
                  <TableCell className="tnum text-right font-mono text-xs">
                    {row.rows ? (
                      formatInteger(row.rows)
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            />
            <ReadingNote>
              Every evidence ledger rejects <MonoTag>UPDATE</MonoTag> and{" "}
              <MonoTag>DELETE</MonoTag>. Only leases, run status, approved model aliases and
              validated latest pointers are mutable — so a count that goes down is itself a
              signal that something is wrong.
            </ReadingNote>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
