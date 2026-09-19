import { BrainCircuitIcon, ExternalLinkIcon, ShieldAlertIcon } from "lucide-react";

import { DecisionTimelineNav } from "@/components/charts/decision-timeline";
import {
  CategoryBarChart,
  DecisionMixChart,
  EvidenceProfileChart,
  StageCostChart,
} from "@/components/charts/llm-charts";
import {
  DecisionBadge,
  MonoTag,
  PairBadge,
  PAIR_COLOR_VAR,
  StatusPill,
} from "@/components/obs/badges";
import { BankContextCard } from "@/components/obs/bank-context";
import { DataSourceError } from "@/components/obs/db-error";
import { EvidenceTable } from "@/components/obs/evidence-table";
import { JsonViewer, Prose } from "@/components/obs/json-viewer";
import { PaginatedTable } from "@/components/obs/paginated-table";
import { PairSwitcher } from "@/components/obs/pair-switcher";
import { HistoricalNotice, TimeTravel } from "@/components/obs/time-travel";
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
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import {
  assessmentAgeHours,
  callOf,
  costRows,
  countBy,
  decisionMix,
  evidenceProfile,
  isExpired,
  latencyRows,
  parseRejection,
  tokenRows,
  totalCost,
  totalLatency,
} from "@/lib/intelligence";
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatInteger,
  formatPercent,
  formatRate,
  formatRelative,
  formatUsd,
  hostnameOf,
  sentenceCase,
  shortHash,
  titleCase,
} from "@/lib/format";
import {
  getAssessmentDays,
  getAssessments,
  getAssessmentsForDay,
  getDecisionHistory,
} from "@/lib/server/queries";
import { isPair, PAIR_BASE_LABELS, PAIRS, type Pair } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function IntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{ pair?: string; date?: string }>;
}) {
  const params = await searchParams;
  const pair: Pair = isPair(params.pair) ? params.pair : "USDGHS";

  let days;
  let latest;
  let history;
  let decisionHistory;
  let selectedDay = "";
  try {
    [days, history, decisionHistory] = await Promise.all([
      getAssessmentDays(365),
      getAssessments(120),
      getDecisionHistory(1200),
    ]);
    const requested = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date! : "";
    selectedDay =
      (requested && days.some((day) => day.day === requested) ? requested : "") ||
      days[0]?.day ||
      "";
    latest = selectedDay ? await getAssessmentsForDay(selectedDay) : [];
  } catch (error) {
    return (
      <>
        <PageHeader eyebrow="Event intelligence" title="Event Intelligence" />
        <DataSourceError error={error} />
      </>
    );
  }

  const ordered = PAIRS.map((item) => latest.find((row) => row.pair === item)).filter(
    (row): row is NonNullable<typeof row> => Boolean(row),
  );
  const selected = ordered.find((row) => row.pair === pair) ?? null;
  const isViewingHistory = Boolean(selectedDay) && selectedDay !== days[0]?.day;

  if (!ordered.length) {
    return (
      <>
        <PageHeader
          eyebrow="Event intelligence"
          title="Event Intelligence"
          description="The two-call LLM layer that reads the news and proposes — never applies — a bounded adjustment to the published path."
        />
        {days.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <TimeTravel
              param="date"
              label="Assessment day"
              value={selectedDay}
              options={days.map((day) => ({
                value: day.day,
                label: formatDate(day.day),
                hint: `${day.assessments} assessment${day.assessments === 1 ? "" : "s"}`,
              }))}
            />
          </div>
        ) : null}
        <EmptyState
          title={
            days.length
              ? `No assessment was recorded on ${formatDate(selectedDay)}`
              : "No event assessments recorded yet"
          }
          description="Assessments appear once the daily flow has run its retrieval and analysis calls for at least one pair. Days with no row usually mean a paused schedule or a failed run — check the Operations page."
          icon={<BrainCircuitIcon className="size-5" />}
        />
        {decisionHistory.length ? (
          <DecisionTimelineNav
            cells={decisionHistory.map((row) => ({
              day: row.day,
              pair: row.pair,
              decision: row.decision,
              publication_action: row.publication_action,
              evidence_count: row.evidence_count,
              rejected_count: row.rejected_count,
              cost_usd: row.cost_usd,
            }))}
            selectedDay={selectedDay}
          />
        ) : null}
      </>
    );
  }

  const record = selected?.record;
  const assessment = record?.assessment;
  const evidence = record?.evidence ?? [];
  const retrieval = record ? callOf(record, "retrieval") : undefined;
  const analysis = record ? callOf(record, "analysis") : undefined;
  const config = (record?.config ?? {}) as Record<string, unknown>;

  const cycleCost = totalCost(ordered);
  const proposals = ordered.filter(
    (row) => row.record.assessment.decision === "review_adjustment",
  ).length;
  const totalEvidence = ordered.reduce((sum, row) => sum + row.record.evidence.length, 0);
  const totalRejected = ordered.reduce(
    (sum, row) => sum + row.record.rejected_evidence.length,
    0,
  );

  return (
    <>
      <PageHeader
        eyebrow="Event intelligence"
        title="Event Intelligence"
        description="A bounded two-call workflow runs once per pair each weekday at 12:00 Africa/Accra, after the morning forecasts are archived and the day's bank rate cards are collected: a time-limited news search, then a structured scorer that reads it alongside the forecast decision packet and the same-day bank quotes. Each assessment is valid midday to midday. Its output is evidence and a recommendation — never a published rate."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <TimeTravel
              param="date"
              label="Assessment day"
              value={selectedDay}
              options={days.map((day) => ({
                value: day.day,
                label: formatDate(day.day),
                hint: `${day.assessments} assessment${day.assessments === 1 ? "" : "s"}`,
              }))}
            />
            <PairSwitcher value={pair} />
          </div>
        }
      />

      {isViewingHistory ? (
        <HistoricalNotice>
          Showing the assessments recorded on <strong>{formatDate(selectedDay)}</strong>. These
          are exactly what the model concluded that day, with the evidence it had then — nothing
          is recomputed. Use <em>Latest</em> in the day selector to return to today.
        </HistoricalNotice>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Cycle cost"
          value={formatUsd(cycleCost, 3)}
          hint={`${ordered.length} pairs × 2 gateway calls · ≈${formatUsd(cycleCost * 22, 2)} a month at ~22 weekday cycles`}
          accent="var(--chart-1)"
        />
        <StatTile
          label="Adjustment proposals"
          value={proposals}
          unit={`of ${ordered.length}`}
          hint="A `review_adjustment` decision is a proposal for review. Publication stays a separate, explicitly approved step."
          accent="var(--serious)"
        />
        <StatTile
          label="Evidence admitted"
          value={totalEvidence}
          unit="items"
          hint={`${totalRejected} further item${totalRejected === 1 ? "" : "s"} rejected by the freshness and relevance gates`}
          accent="var(--chart-3)"
        />
        <StatTile
          label="Assessment age"
          value={
            selected ? `${assessmentAgeHours(selected).toFixed(1)}` : "—"
          }
          unit="hours"
          hint={
            selected ? (
              isExpired(selected) ? (
                <StatusPill tone="warning" label={`Expired ${formatRelative(selected.expires_at)}`} />
              ) : (
                <StatusPill tone="good" label={`Valid until ${formatDateTime(selected.expires_at)}`} />
              )
            ) : null
          }
          accent="var(--chart-7)"
        />
      </section>

      <DecisionTimelineNav
        cells={decisionHistory.map((row) => ({
          day: row.day,
          pair: row.pair,
          decision: row.decision,
          publication_action: row.publication_action,
          evidence_count: row.evidence_count,
          rejected_count: row.rejected_count,
          cost_usd: row.cost_usd,
        }))}
        selectedDay={selectedDay}
      />

      <section className="space-y-3">
        <SectionHeading
          title={`Decisions for ${formatDate(selectedDay)}`}
          description="One assessment per pair. Memory is filtered by pair and never merged across the three histories."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {ordered.map((row) => {
            const body = row.record.assessment;
            return (
              <Card key={row.assessment_id} className="gap-0 py-0">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <PairBadge pair={row.pair} />
                    <DecisionBadge decision={body.decision} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Stat label="Evidence" value={row.record.evidence.length} />
                    <Stat label="Strength" value={sentenceCase(body.evidence_strength)} mono={false} />
                    <Stat label="Persistence" value={sentenceCase(body.persistence)} mono={false} />
                  </div>
                  <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
                    {body.rationale}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                    <MonoTag>{row.record.publication_action}</MonoTag>
                    <MonoTag>{row.record.prompt_version}</MonoTag>
                    <span className="ml-auto text-[0.68rem] text-muted-foreground">
                      {formatUsd(
                        row.record.calls.reduce((sum, call) => sum + (call.cost_usd ?? 0), 0),
                        4,
                      )}{" "}
                      · {formatDuration(totalLatency(row))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <StageCostChart rows={costRows(ordered)} unit="usd" />
        <StageCostChart rows={latencyRows(ordered)} unit="seconds" />
        <StageCostChart rows={tokenRows(ordered)} unit="tokens" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <EvidenceProfileChart
          series={ordered.map((row) => ({
            name: row.pair,
            color: PAIR_COLOR_VAR[row.pair],
            rows: evidenceProfile(row.record.evidence),
          }))}
        />
        <DecisionMixChart rows={decisionMix(history)} />
      </section>

      {record && assessment && selected ? (
        <>
          <section className="space-y-4">
            <SectionHeading
              title={`${pair} — the reasoning`}
              description={`What the scorer concluded for ${PAIR_BASE_LABELS[pair]} against the cedi, and the evidence it weighed on both sides.`}
            />

            <Card>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <DecisionBadge decision={assessment.decision} />
                  <MonoTag>evidence: {sentenceCase(assessment.evidence_strength)}</MonoTag>
                  <MonoTag>persistence: {sentenceCase(assessment.persistence)}</MonoTag>
                  <MonoTag>assessed {formatDateTime(record.created_at)}</MonoTag>
                  <MonoTag>{shortHash(record.assessment_id, 12)}</MonoTag>
                </div>

                <Prose text={assessment.rationale} />

                <div className="grid gap-5 lg:grid-cols-2">
                  {assessment.counter_evidence?.length ? (
                    <div className="rounded-xl border border-dashed p-4">
                      <p className="eyebrow mb-2 flex items-center gap-1.5">
                        <ShieldAlertIcon className="size-3.5" />
                        Counter-evidence
                      </p>
                      <ul className="space-y-2">
                        {assessment.counter_evidence.map((item, index) => (
                          <li
                            key={index}
                            className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                          >
                            <span
                              aria-hidden
                              className="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--chart-1)]"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {assessment.watch_items?.length ? (
                    <div className="rounded-xl border border-dashed p-4">
                      <p className="eyebrow mb-2">What to watch next</p>
                      <ul className="space-y-2">
                        {assessment.watch_items.map((item, index) => (
                          <li
                            key={index}
                            className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                          >
                            <span
                              aria-hidden
                              className="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--warning)]"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <ReadingNote>
                  The scorer may return <MonoTag>hold</MonoTag>, <MonoTag>monitor</MonoTag> or{" "}
                  <MonoTag>review_adjustment</MonoTag>. Each proposed delta is a signed
                  percentage of the Monday median for one target date, capped at 5% absolute by
                  the implementation and only acted on above 1% by the shadow policy. Deltas on
                  duplicate, retrospective, or out-of-week dates are rejected before they reach
                  the ledger.
                </ReadingNote>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <div className="space-y-3">
              <SectionHeading
                title={`Evidence admitted (${evidence.length})`}
                description="Expand an item for the claimed transmission mechanism, the facts the model treated as established, and the uncertainties it flagged itself."
              />
              {evidence.length ? (
                <EvidenceTable evidence={evidence} citedIds={assessment.evidence_ids} />
              ) : (
                <EmptyState
                  title="No evidence admitted"
                  description="Every retrieved item fell outside the freshness or relevance gates."
                />
              )}
            </div>

            <div className="space-y-4">
              <CategoryBarChart
                title="By relevance"
                rows={countBy(evidence, (item) => item.relevance).map((entry) => ({
                  ...entry,
                  color:
                    entry.label === "high"
                      ? "var(--seq-500)"
                      : entry.label === "medium"
                        ? "var(--seq-400)"
                        : "var(--seq-300)",
                }))}
                height={150}
              />
              <CategoryBarChart
                title="By source type"
                rows={countBy(evidence, (item) => item.source_type)}
                color="var(--chart-7)"
                height={170}
              />
              <CategoryBarChart
                title="By event type"
                rows={countBy(evidence, (item) => item.event_type)}
                color="var(--chart-3)"
                height={180}
                footnote="Event types come from the retriever's constrained schema, so the mix is comparable between days."
              />
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card className="gap-4">
              <CardContent className="space-y-4">
                <SectionHeading
                  title={`Rejected evidence (${record.rejected_evidence.length})`}
                  description="Items the retriever returned that the deterministic gates refused before analysis."
                />
                {record.rejected_evidence.length ? (
                  <ul className="space-y-2.5">
                    {record.rejected_evidence.map((raw, index) => {
                      const { reason, url } = parseRejection(raw);
                      return (
                        <li key={index} className="flex flex-col gap-1 border-b pb-2.5 last:border-b-0">
                          <span className="font-mono text-[0.68rem] text-[var(--warning)]">
                            {reason}
                          </span>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                            >
                              {hostnameOf(url)}
                              <ExternalLinkIcon className="size-3" />
                            </a>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <EmptyState title="Nothing was rejected" />
                )}
                <ReadingNote>
                  <MonoTag>outside_news_window</MonoTag> means the item predates the hard
                  lookback;{" "}
                  <MonoTag>outside_priority_without_continuing_relevance</MonoTag> means it was
                  inside the lookback but outside the priority window and the model did not argue
                  that the event is still materially active.
                </ReadingNote>
              </CardContent>
            </Card>

            <Card className="gap-4">
              <CardContent className="space-y-4">
                <SectionHeading
                  title="Proposal and publication"
                  description="What the assessment proposed, and what the bounded policy actually did with it."
                />
                <div className="grid grid-cols-2 gap-4">
                  <Stat
                    label="Publication action"
                    value={<MonoTag>{record.publication_action}</MonoTag>}
                    mono={false}
                  />
                  <Stat
                    label="Proposed adjustments"
                    value={record.adjustment_preview.length}
                  />
                  <Stat label="Validation errors" value={record.validation_errors.length} />
                  <Stat label="Status" value={sentenceCase(record.status)} mono={false} />
                </div>

                {record.adjustment_preview.length ? (
                  <PaginatedTable
                    pageSize={10}
                    label="proposals"
                    header={
                      <TableRow>
                        <TableHead>Target date</TableHead>
                        <TableHead className="text-right">Delta</TableHead>
                        <TableHead>Evidence</TableHead>
                      </TableRow>
                    }
                    rows={record.adjustment_preview.map((proposal, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs">
                          {formatDate(proposal.target_date ?? null)}
                        </TableCell>
                        <TableCell className="tnum text-right font-mono text-xs font-semibold">
                          {formatPercent(proposal.delta_pct ?? null, 2, true)}
                        </TableCell>
                        <TableCell className="font-mono text-[0.68rem] text-muted-foreground">
                          {(proposal.evidence_ids ?? []).join(", ") || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  />
                ) : (
                  <div className="rounded-lg border border-dashed px-4 py-6 text-center">
                    <p className="text-sm font-medium">No adjustment proposed</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      The immutable base path is retained for all thirty target dates.
                    </p>
                  </div>
                )}

                {record.validation_errors.length ? (
                  <div className="rounded-lg border border-[var(--critical)]/30 p-3">
                    <p className="eyebrow mb-1.5 text-[var(--critical)]">Validation errors</p>
                    <ul className="space-y-1">
                      {record.validation_errors.map((error, index) => (
                        <li key={index} className="font-mono text-[0.68rem] text-muted-foreground">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="space-y-2 border-t pt-4">
                  <p className="eyebrow">Linked forecast vintages</p>
                  <KeyValueGrid
                    columns={2}
                    items={[
                      {
                        label: "Weekly Chronos",
                        value: shortHash(selected.weekly_forecast_id, 16),
                      },
                      {
                        label: "Daily bootstrap",
                        value: shortHash(selected.daily_forecast_id, 16),
                      },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card className="gap-4">
              <CardContent className="space-y-4">
                <SectionHeading
                  title="Gateway call audit"
                  description="Exactly what was requested, what answered, and what it cost."
                />
                <PaginatedTable
                  pageSize={10}
                  label="calls"
                  header={
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead className="text-right">Prompt</TableHead>
                      <TableHead className="text-right">Output</TableHead>
                      <TableHead className="text-right">Latency</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  }
                  rows={record.calls.map((call) => (
                        <TableRow key={call.response_id ?? call.stage}>
                          <TableCell className="text-xs font-medium">
                            {titleCase(call.stage)}
                            {call.cache_hit ? (
                              <MonoTag className="ml-2">cache hit</MonoTag>
                            ) : null}
                          </TableCell>
                          <TableCell className="font-mono text-[0.68rem] text-muted-foreground">
                            {call.returned_model ?? call.requested_model}
                          </TableCell>
                          <TableCell className="tnum text-right font-mono text-xs">
                            {formatInteger(call.prompt_tokens)}
                          </TableCell>
                          <TableCell className="tnum text-right font-mono text-xs">
                            {formatInteger(call.completion_tokens)}
                            <span className="text-muted-foreground">
                              {" "}
                              / {formatInteger(call.max_output_tokens)}
                            </span>
                          </TableCell>
                          <TableCell className="tnum text-right font-mono text-xs">
                            {formatDuration(call.latency_seconds)}
                          </TableCell>
                          <TableCell className="tnum text-right font-mono text-xs">
                            {formatUsd(call.cost_usd, 5)}
                          </TableCell>
                        </TableRow>
                  ))}
                />
                <ReadingNote>
                  <strong>Output allowance is a ceiling, not proof of headroom.</strong>{" "}
                  Length-stopped, tool-call-only and content-filtered responses are rejected even
                  when the remaining text parses, so a completion close to its maximum is worth
                  investigating rather than ignoring.
                </ReadingNote>
              </CardContent>
            </Card>

            <Card className="gap-4">
              <CardContent className="space-y-4">
                <SectionHeading
                  title="Run configuration"
                  description="The versioned knobs this assessment ran under."
                />
                <KeyValueGrid
                  columns={2}
                  items={[
                    { label: "Retrieval model", value: String(config.retrieval_model ?? "—") },
                    { label: "Analysis model", value: String(config.analysis_model ?? "—") },
                    { label: "Prompt version", value: record.prompt_version },
                    { label: "Search mode", value: String(config.retrieval_search_mode ?? "—") },
                    { label: "Max articles", value: String(config.retrieval_max_articles ?? "—") },
                    { label: "News lookback", value: `${config.news_lookback_days ?? "—"} days` },
                    { label: "Priority window", value: `${config.news_priority_days ?? "—"} days` },
                    { label: "Detail horizon", value: `${config.analysis_detail_horizon_days ?? "—"} days` },
                    {
                      label: "Summary checkpoints",
                      value: Array.isArray(config.analysis_summary_horizons)
                        ? (config.analysis_summary_horizons as number[]).join(" / ")
                        : "—",
                    },
                    { label: "Spot observations", value: String(config.spot_observations ?? "—") },
                    { label: "Memory limit", value: String(config.memory_limit ?? "—") },
                    { label: "Memory max age", value: `${config.memory_max_age_days ?? "—"} days` },
                  ]}
                />
                <div className="space-y-2 border-t pt-4">
                  <JsonViewer label="Full configuration" value={config} />
                  <JsonViewer label="Prompt snapshot" value={record.prompt_snapshot} />
                  <JsonViewer label="Decision context packet" value={record.context} />
                  <JsonViewer label="Complete assessment record" value={record} />
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3">
            <SectionHeading
              title="Decision context"
              description="The deterministic packet the scorer was given: recent spots, the two forecast views by target date, and nothing else."
            />
            <Card>
              <CardContent className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
                <div className="space-y-3">
                  <p className="eyebrow">Spot observations supplied</p>
                  <PaginatedTable
                    pageSize={10}
                    label="observations"
                    header={
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Available</TableHead>
                      </TableRow>
                    }
                    rows={record.context.spots.map((spot) => (
                      <TableRow key={spot.date}>
                        <TableCell className="text-xs">{formatDate(spot.date)}</TableCell>
                        <TableCell className="tnum text-right font-mono text-xs">
                          {formatRate(spot.rate)}
                        </TableCell>
                        <TableCell className="text-right text-[0.68rem] text-muted-foreground">
                          {formatRelative(spot.available_at, new Date(record.as_of).getTime())}
                        </TableCell>
                      </TableRow>
                    ))}
                  />
                  <ReadingNote>
                    Availability timestamps matter: a rate observed on a date is not necessarily
                    knowable on that date, and the packet is built point-in-time.
                  </ReadingNote>
                </div>

                <div className="space-y-3">
                  <p className="eyebrow">Forecast views by target date</p>
                  <PaginatedTable
                    pageSize={10}
                    label="target dates"
                    header={
                      <TableRow>
                        <TableHead>Target</TableHead>
                        <TableHead className="text-right">Weekly q50</TableHead>
                        <TableHead className="text-right">Daily q50</TableHead>
                        <TableHead className="text-right">Difference</TableHead>
                      </TableRow>
                    }
                    rows={record.context.weekly.points.map((weeklyPoint) => {
                      const dailyPoint = record.context.daily.points.find(
                        (point) => point.date === weeklyPoint.date,
                      );
                      const delta = dailyPoint
                        ? ((dailyPoint.q50 - weeklyPoint.q50) / weeklyPoint.q50) * 100
                        : null;
                      return (
                        <TableRow key={weeklyPoint.date}>
                          <TableCell className="text-xs">
                            {formatDate(weeklyPoint.date)}
                          </TableCell>
                          <TableCell className="tnum text-right font-mono text-xs">
                            {formatRate(weeklyPoint.q50)}
                          </TableCell>
                          <TableCell className="tnum text-right font-mono text-xs">
                            {dailyPoint ? formatRate(dailyPoint.q50) : "—"}
                          </TableCell>
                          <TableCell
                            className="tnum text-right font-mono text-xs"
                            style={{
                              color:
                                delta === null
                                  ? undefined
                                  : Math.abs(delta) > 1
                                    ? "var(--warning)"
                                    : undefined,
                            }}
                          >
                            {formatPercent(delta, 2, true)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  />
                  <ReadingNote>
                    Comparisons are computed by target date: Tuesday&apos;s bootstrap day 1
                    corresponds to Monday&apos;s day 2. These numbers are descriptive context,
                    not a trained shock detector or a probability of reversal.
                  </ReadingNote>
                </div>
              </CardContent>
            </Card>
            <BankContextCard record={record} />
          </section>
        </>
      ) : null}

      {retrieval || analysis ? (
        <section className="space-y-3">
          <SectionHeading
            title="Assessment ledger"
            description="Every recorded assessment, newest first. The ledger is append-only: a revised view is a new row, never an edit."
          />
          <Card>
            <CardContent>
              <PaginatedTable
                pageSize={12}
                label="assessments"
                header={
                  <TableRow>
                    <TableHead>Pair</TableHead>
                    <TableHead>Decision</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="text-right">Evidence</TableHead>
                    <TableHead className="text-right">Rejected</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Latency</TableHead>
                    <TableHead>Assessed</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                }
                rows={history.map((row) => (
                    <TableRow key={row.assessment_id}>
                      <TableCell>
                        <PairBadge pair={row.pair} />
                      </TableCell>
                      <TableCell>
                        <DecisionBadge decision={row.record.assessment.decision} />
                      </TableCell>
                      <TableCell>
                        <MonoTag>{row.record.publication_action}</MonoTag>
                      </TableCell>
                      <TableCell className="tnum text-right font-mono text-xs">
                        {row.record.evidence.length}
                      </TableCell>
                      <TableCell className="tnum text-right font-mono text-xs text-muted-foreground">
                        {row.record.rejected_evidence.length}
                      </TableCell>
                      <TableCell className="tnum text-right font-mono text-xs">
                        {formatUsd(
                          row.record.calls.reduce((sum, call) => sum + (call.cost_usd ?? 0), 0),
                          4,
                        )}
                      </TableCell>
                      <TableCell className="tnum text-right font-mono text-xs">
                        {formatDuration(totalLatency(row))}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(row.created_at)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {isExpired(row) ? (
                          <StatusPill tone="neutral" label="expired" />
                        ) : (
                          formatRelative(row.expires_at)
                        )}
                      </TableCell>
                    </TableRow>
                ))}
              />
            </CardContent>
          </Card>
        </section>
      ) : null}
    </>
  );
}
