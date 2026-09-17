import { GitBranchIcon, ShieldQuestionIcon } from "lucide-react";

import {
  MonoTag,
  PairBadge,
  StatusPill,
} from "@/components/obs/badges";
import { DataSourceError } from "@/components/obs/db-error";
import { JsonViewer } from "@/components/obs/json-viewer";
import { PaginatedTable } from "@/components/obs/paginated-table";
import {
  EmptyState,
  KeyValueGrid,
  PageHeader,
  ReadingNote,
  SectionHeading,
  Stat,
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
  formatBytes,
  formatDate,
  formatDateTime,
  formatInteger,
  shortHash,
} from "@/lib/format";
import {
  getAllLatestVintages,
  getModelAliases,
  getModelArtifacts,
  getVintageLedger,
} from "@/lib/server/queries";
import { FORECAST_KIND_LABELS, type ChronosModelJson } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ModelsPage() {
  let ledger;
  let latest;
  let artifacts;
  let aliases;
  try {
    [ledger, latest, artifacts, aliases] = await Promise.all([
      getVintageLedger(120),
      getAllLatestVintages(),
      getModelArtifacts(),
      getModelAliases(),
    ]);
  } catch (error) {
    return (
      <>
        <PageHeader eyebrow="Lineage" title="Model Lineage" />
        <DataSourceError error={error} />
      </>
    );
  }

  const chronosVintage = latest.find((vintage) => vintage.kind === "weekly_chronos");
  const bootstrapVintage = latest.find((vintage) => vintage.kind === "daily_bootstrap");
  const chronos = chronosVintage?.model_json as ChronosModelJson | undefined;
  const recipe = bootstrapVintage?.model_json.recipe;

  const revisions = ledger.filter((vintage) => vintage.revision > 1).length;
  const reconstructed = ledger.filter(
    (vintage) => vintage.provenance === "reconstructed",
  ).length;
  const champion = aliases.find((alias) => alias.alias === "champion");

  return (
    <>
      <PageHeader
        eyebrow="Lineage"
        title="Model Lineage"
        description="What produced each forecast, how it is identified, and where it sits in the promotion state machine. A successful training run does not become the champion automatically — training, gate eligibility, registration, shadow and promotion are separate transitions with separate evidence."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Stored vintages"
          value={ledger.length}
          hint={`${revisions} revision${revisions === 1 ? "" : "s"} beyond the initial issuance · ${reconstructed} reconstructed`}
          accent="var(--chart-1)"
        />
        <StatTile
          label="Registered artifacts"
          value={artifacts.length}
          hint={
            artifacts.length
              ? "Artifact manifests with hashes, parameters and metrics"
              : "No artifact has been registered into the server-side registry yet"
          }
          accent="var(--chart-7)"
        />
        <StatTile
          label="Alias pointers"
          value={aliases.length}
          hint={
            champion
              ? `Champion: ${champion.model_family} approved by ${champion.approved_by}`
              : "No champion alias exists — the performance exit criterion is unmet"
          }
          accent="var(--chart-2)"
        />
        <StatTile
          label="Release stage"
          value="Shadow"
          hint="Forecasts are archived and evaluated; no approved customer publication path is enabled."
          accent="var(--warning)"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="gap-4">
          <CardContent className="space-y-4">
            <SectionHeading
              title="Weekly — Chronos-2 zero-shot"
              description="A pretrained time-series foundation model used without fine-tuning, with forward-only quantile calibration applied on top."
            />
            {chronos ? (
              <>
                <KeyValueGrid
                  columns={2}
                  items={[
                    { label: "Model id", value: chronos.model_id ?? "—" },
                    { label: "Upstream revision", value: shortHash(chronos.model_revision, 14) },
                    { label: "Weights sha256", value: shortHash(chronos.weights_sha256, 14) },
                    { label: "Weights size", value: formatBytes(chronos.weights_bytes) },
                    { label: "Context length", value: formatInteger(chronos.context_length) },
                    { label: "Horizons", value: formatInteger(chronos.horizons) },
                    { label: "Calibration", value: chronos.calibration ?? "—" },
                    {
                      label: "Calibrator sha256",
                      value: shortHash(chronos.calibrator_sha256, 14),
                    },
                    {
                      label: "Cross-learning",
                      value: chronos.cross_learning ? "enabled" : "disabled",
                    },
                    { label: "Runtime", value: `${chronos.runtime ?? "—"} · ${chronos.device ?? "—"}` },
                  ]}
                />
                <div className="flex flex-wrap gap-1.5">
                  {(chronos.quantiles ?? []).map((quantile) => (
                    <MonoTag key={quantile}>q{String(quantile).replace("0.", "").padEnd(2, "0")}</MonoTag>
                  ))}
                </div>
                <ReadingNote>
                  The runtime downloads the official weights only for Monday issuance and
                  verifies them against this hash before inference, so an upstream change cannot
                  silently alter a path. Cross-learning means the three pairs are forecast
                  jointly rather than independently.
                </ReadingNote>
              </>
            ) : (
              <EmptyState title="No Chronos vintage is currently pointed to" />
            )}
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardContent className="space-y-4">
            <SectionHeading
              title="Daily — block bootstrap"
              description="A non-parametric baseline re-issued every day. It resamples the pair's own recent returns rather than learning a model."
            />
            {recipe ? (
              <>
                <KeyValueGrid
                  columns={2}
                  items={[
                    { label: "Family", value: bootstrapVintage?.model_json.family ?? "—" },
                    { label: "Simulated paths", value: formatInteger(recipe.paths) },
                    { label: "Block length", value: `${recipe.block_days} days` },
                    { label: "Lookback", value: `${formatInteger(recipe.lookback_days)} days` },
                    { label: "Seed", value: String(recipe.seed) },
                    { label: "Origin", value: formatDate(bootstrapVintage?.origin) },
                  ]}
                />
                <ReadingNote>
                  Block bootstrap is the benchmark the Chronos release gate had to beat. On the
                  frozen holdout it did not: pinball loss was 0.064432 for Chronos-2 version 1
                  against 0.058403 for block bootstrap — 10.32% worse — despite a 0.58% better
                  median MAE. That is why this baseline is still issued daily.
                </ReadingNote>
              </>
            ) : (
              <EmptyState title="No bootstrap vintage is currently pointed to" />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionHeading
          title="Promotion state"
          description="Where the selected model sits between a training run and a live champion."
        />
        <Card>
          <CardContent className="space-y-5">
            <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Training run", state: "done" },
                { label: "Validation evidence", state: "done" },
                { label: "Candidate", state: "done" },
                { label: "Versioned gate", state: "failed" },
                { label: "Shadow", state: "current" },
                { label: "Champion", state: "blocked" },
              ].map((step, index) => (
                <li
                  key={step.label}
                  className="relative rounded-lg border p-3"
                  style={{
                    borderColor:
                      step.state === "failed"
                        ? "color-mix(in oklab, var(--critical) 40%, transparent)"
                        : step.state === "current"
                          ? "color-mix(in oklab, var(--warning) 45%, transparent)"
                          : undefined,
                  }}
                >
                  <span className="eyebrow">Step {index + 1}</span>
                  <p className="mt-0.5 text-sm font-medium">{step.label}</p>
                  <p className="mt-1 text-[0.68rem] text-muted-foreground">
                    {step.state === "done"
                      ? "complete"
                      : step.state === "failed"
                        ? "failed on the frozen holdout"
                        : step.state === "current"
                          ? "current position"
                          : "not reached"}
                  </p>
                </li>
              ))}
            </ol>

            <div className="grid gap-4 lg:grid-cols-3">
              <Stat
                label="Gate outcome (v1)"
                value={<StatusPill tone="critical" label="20 of 58 checks failed" />}
                mono={false}
              />
              <Stat
                label="Current reference"
                value={<MonoTag>research_reference (v2)</MonoTag>}
                mono={false}
              />
              <Stat
                label="Champion alias"
                value={
                  champion ? (
                    <MonoTag>{champion.model_artifact_id}</MonoTag>
                  ) : (
                    <StatusPill tone="neutral" label="none registered" />
                  )
                }
                mono={false}
              />
            </div>

            <ReadingNote>
              The gate is deliberately multi-dimensional — probabilistic skill, point accuracy,
              per-pair stability, horizon-cohort stability, calibration, bias, output validity,
              reproducibility and operations all pass or fail separately. One aggregate score
              would let a wide-but-covering interval or a strong short horizon hide a real
              failure. No scheduled training job, hyper-parameter ranking or tracking comparison
              is authorised to move an alias on its own.
            </ReadingNote>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionHeading
          title="Vintage ledger"
          description="Every stored forecast vintage. The ledger is append-only: a changed forecast is a new revision that names its parent, never an edit."
        />
        <Card>
          <CardContent className="overflow-x-auto">
            {ledger.length ? (
              <PaginatedTable
                pageSize={12}
                label="vintages"
                header={
                  <TableRow>
                    <TableHead>Pair</TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead className="text-right">Rev</TableHead>
                    <TableHead>Provenance</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Data as of</TableHead>
                    <TableHead>Input hash</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                }
                rows={ledger.map((vintage) => (
                    <TableRow key={vintage.forecast_id}>
                      <TableCell>
                        <PairBadge pair={vintage.pair} />
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {FORECAST_KIND_LABELS[vintage.kind]}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDate(vintage.origin)}
                      </TableCell>
                      <TableCell className="tnum text-right font-mono text-xs">
                        {vintage.revision}
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          tone={vintage.provenance === "issued" ? "good" : "warning"}
                          label={vintage.provenance}
                        />
                      </TableCell>
                      <TableCell className="tnum text-right font-mono text-xs">
                        {vintage.point_count ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {formatDateTime(vintage.issued_at)}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {formatDateTime(vintage.data_as_of)}
                      </TableCell>
                      <TableCell className="font-mono text-[0.68rem] text-muted-foreground">
                        {shortHash(vintage.input_sha256, 10)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {vintage.revision_reason}
                      </TableCell>
                    </TableRow>
                ))}
              />
            ) : (
              <EmptyState
                title="No vintages stored"
                icon={<GitBranchIcon className="size-5" />}
              />
            )}
          </CardContent>
        </Card>
        <ReadingNote>
          <strong>Reconstructed</strong> means the vintage was rebuilt for a past origin from the
          exact recorded inputs rather than issued live on that date. It is a legitimate,
          hash-verified path, but it is not evidence of live operational behaviour on that
          Monday, and the release review treats the two differently.
        </ReadingNote>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="gap-4">
          <CardContent className="space-y-4">
            <SectionHeading
              title="Registered artifacts"
              description="Server-side model registry entries with manifests, hashes and metrics."
            />
            {artifacts.length ? (
              <div className="space-y-3">
                {artifacts.map((artifact) => (
                  <div key={artifact.model_artifact_id} className="space-y-2 rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <MonoTag>{artifact.model_family}</MonoTag>
                      <MonoTag>{artifact.model_version}</MonoTag>
                      <MonoTag>{artifact.scope}</MonoTag>
                    </div>
                    <KeyValueGrid
                      columns={2}
                      items={[
                        { label: "Artifact sha256", value: shortHash(artifact.artifact_sha256, 14) },
                        { label: "Trained through", value: formatDate(artifact.trained_through) },
                        { label: "MLflow run", value: shortHash(artifact.mlflow_run_id, 14) },
                        { label: "Registered", value: formatDateTime(artifact.created_at) },
                      ]}
                    />
                    <JsonViewer label="Metrics" value={artifact.metrics} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No artifacts registered in this database"
                description="Experimental training and evaluation currently live in MLflow alongside the research repository. Registering an artifact here is part of promoting a model beyond shadow."
                icon={<ShieldQuestionIcon className="size-5" />}
              />
            )}
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardContent className="space-y-4">
            <SectionHeading
              title="Alias pointers"
              description="The only mutable pointers in the model ledger, each requiring a named approver and a gate report."
            />
            {aliases.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Family</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Alias</TableHead>
                    <TableHead>Approved by</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aliases.map((alias) => (
                    <TableRow key={`${alias.model_family}-${alias.scope}-${alias.alias}`}>
                      <TableCell className="font-mono text-xs">{alias.model_family}</TableCell>
                      <TableCell className="font-mono text-xs">{alias.scope}</TableCell>
                      <TableCell>
                        <MonoTag>{alias.alias}</MonoTag>
                      </TableCell>
                      <TableCell className="text-xs">{alias.approved_by}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(alias.updated_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                title="No alias has been set"
                description="A promotion record must name the approver, model and run id, gate-config hash, dataset hash, previous champion, rollback target and decision rationale. None exists yet, which is the correct state for a failed gate."
              />
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
