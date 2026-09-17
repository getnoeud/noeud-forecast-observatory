import { LineChartIcon } from "lucide-react";

import {
  DivergenceBarChart,
  ModelComparisonChart,
} from "@/components/charts/divergence-chart";
import { ForecastFanChart } from "@/components/charts/forecast-fan-chart";
import { TrackChart } from "@/components/charts/track-chart";
import {
  DriftChart,
  SkewChart,
  UncertaintyGrowthChart,
} from "@/components/charts/uncertainty-charts";
import {
  DecisionBadge,
  ModeBadge,
  MonoTag,
  PairBadge,
  StatusPill,
} from "@/components/obs/badges";
import { DataSourceError } from "@/components/obs/db-error";
import { HorizonTable } from "@/components/obs/horizon-table";
import { PairSwitcher } from "@/components/obs/pair-switcher";
import { HistoricalNotice, TimeTravel } from "@/components/obs/time-travel";
import {
  EmptyState,
  KeyValueGrid,
  PageHeader,
  ReadingNote,
  SectionHeading,
  StatTile,
} from "@/components/obs/primitives";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatBytes,
  formatDate,
  formatDateTime,
  formatInteger,
  formatPercent,
  formatRate,
  shortHash,
} from "@/lib/format";
import { getForecastModel } from "@/lib/server/forecast-view";
import { isPair, PAIR_BASE_LABELS, PAIR_LABELS, type Pair } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ForecastPage({
  searchParams,
}: {
  searchParams: Promise<{ pair?: string; origin?: string; dailyOrigin?: string }>;
}) {
  const params = await searchParams;
  const pair: Pair = isPair(params.pair) ? params.pair : "USDGHS";

  let model;
  try {
    model = await getForecastModel(pair, {
      weeklyOrigin: params.origin,
      dailyOrigin: params.dailyOrigin,
    });
  } catch (error) {
    return (
      <>
        <PageHeader eyebrow="Forward forecasting" title="Forward Forecast" />
        <DataSourceError error={error} />
      </>
    );
  }

  const {
    weekly,
    daily,
    latest,
    weeklySummary,
    dailySummary,
    weeklyFan,
    dailyFan,
    weeklyWidths,
    dailyWidths,
    divergence,
    publication,
    assessment,
    history,
    track,
    weeklyOptions,
    dailyOptions,
    isLatestWeekly,
  } = model;

  const observed = new Map(history.map((item) => [item.observed_on, item.rate]));
  const chronos = weekly?.vintage.model_json;
  const recipe = daily?.vintage.model_json?.recipe;
  const maturedCount = weekly
    ? weekly.points.filter((point) => observed.has(point.target_date)).length
    : 0;

  return (
    <>
      <PageHeader
        eyebrow="Forward forecasting"
        title={`${PAIR_LABELS[pair]} — next 30 days`}
        description={`The live probabilistic path for ${PAIR_BASE_LABELS[pair]} against the Ghana cedi. Every horizon carries nine quantiles; the chart shows the distribution, the table shows the numbers the API would serve.`}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <TimeTravel
              param="origin"
              label="Chronos origin"
              value={weekly?.vintage.origin ?? ""}
              options={weeklyOptions.map((option) => ({
                value: option.origin,
                label: formatDate(option.origin),
                hint: option.revision > 1 ? `rev ${option.revision}` : undefined,
              }))}
            />
            <PairSwitcher value={pair} />
          </div>
        }
      />

      {!isLatestWeekly ? (
        <HistoricalNotice>
          Showing the Chronos vintage issued from origin{" "}
          <strong>{formatDate(weekly?.vintage.origin)}</strong>, not the current one. Every
          number below — drift, interval width, the published path — belongs to that vintage.
          Use <em>Latest</em> in the origin selector to return to the live view.
        </HistoricalNotice>
      ) : null}

      {!weekly ? (
        <EmptyState
          title="No weekly Chronos vintage is pointed to for this pair"
          description="The latest-forecast pointer is empty. Issue a Monday vintage, or check the pipeline run ledger on the Operations page."
          icon={<LineChartIcon className="size-5" />}
        />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Latest observed"
              value={formatRate(latest?.rate)}
              hint={`${formatDate(latest?.observed_on)} · source ${latest?.source ?? "—"}`}
              accent="var(--foreground)"
            />
            <StatTile
              label="Day 30 median"
              value={formatRate(weeklySummary?.medianEnd)}
              hint={`Target ${formatDate(weeklySummary?.lastDate)}`}
              accent="var(--seq-400)"
            />
            <StatTile
              label="30-day drift vs spot"
              value={formatPercent(weeklySummary?.anchorDriftPct, 2, true)}
              trend={
                (weeklySummary?.anchorDriftPct ?? 0) > 0.05
                  ? "up"
                  : (weeklySummary?.anchorDriftPct ?? 0) < -0.05
                    ? "down"
                    : "flat"
              }
              hint={`90% range at day 30: ${formatPercent(weeklySummary?.downsidePct, 1, true)} to ${formatPercent(weeklySummary?.upsidePct, 1, true)}`}
              accent="var(--chart-2)"
            />
            <StatTile
              label="Interval growth"
              value={formatPercent(weeklySummary?.widthEnd, 1)}
              unit="at day 30"
              hint={`From ${formatPercent(weeklySummary?.widthStart, 1)} at day 1 — a ${((weeklySummary?.widthEnd ?? 0) / (weeklySummary?.widthStart || 1)).toFixed(1)}× widening`}
              accent="var(--chart-7)"
            />
          </section>

          <ForecastFanChart
            rows={weeklyFan}
            anchorDate={weekly.vintage.origin}
            anchorRate={latest?.rate ?? null}
            title={
              <span className="flex flex-wrap items-center gap-2">
                Weekly Chronos-2 path
                <MonoTag>origin {formatDate(weekly.vintage.origin)}</MonoTag>
                <MonoTag>rev {weekly.vintage.revision}</MonoTag>
                <StatusPill
                  tone={weekly.vintage.provenance === "issued" ? "good" : "warning"}
                  label={weekly.vintage.provenance}
                />
              </span>
            }
            description="Observed history to the left of the origin, then the full nine-quantile distribution for each of the next 30 calendar days. Shading darkens toward the median."
            footnote={`Issued ${formatDateTime(weekly.vintage.issued_at)} from data as of ${formatDateTime(weekly.vintage.data_as_of)}. ${maturedCount} of 30 target dates have already matured and are drawn on the observed line inside the fan.`}
            height={420}
          />

          <TrackChart
            rows={track}
            todayDate={latest?.observed_on ?? null}
            footnote={`Built from the ${weeklyOptions.length} stored Chronos vintage${weeklyOptions.length === 1 ? "" : "s"} and ${dailyOptions.length} bootstrap vintage${dailyOptions.length === 1 ? "" : "s"} for this pair. Where several vintages covered the same target date, the most recent origin is shown — the view a consumer reading the latest pointer would have had.`}
          />

          <section className="grid gap-4 xl:grid-cols-2">
            <UncertaintyGrowthChart rows={weeklyWidths} />
            {latest ? <DriftChart rows={weeklyWidths} anchorRate={latest.rate} /> : null}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <SkewChart rows={weeklyWidths} />
            <Card className="gap-4">
              <CardContent className="space-y-5">
                <SectionHeading
                  title="Model identity"
                  description="What produced this path, recorded on the vintage itself rather than inferred."
                />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="eyebrow">Weekly — Chronos-2 zero-shot</p>
                    <KeyValueGrid
                      columns={2}
                      items={[
                        { label: "Model", value: chronos?.model_id ?? "—" },
                        {
                          label: "Revision",
                          value: shortHash(chronos?.model_revision, 12),
                        },
                        { label: "Context length", value: formatInteger(chronos?.context_length) },
                        { label: "Calibration", value: chronos?.calibration ?? "—" },
                        {
                          label: "Cross-learning",
                          value: chronos?.cross_learning ? "enabled" : "disabled",
                        },
                        { label: "Weights", value: formatBytes(chronos?.weights_bytes) },
                        { label: "Runtime", value: `${chronos?.runtime ?? "—"} · ${chronos?.device ?? "—"}` },
                        {
                          label: "Weights sha256",
                          value: shortHash(chronos?.weights_sha256, 16),
                        },
                      ]}
                    />
                  </div>
                  {daily ? (
                    <div className="space-y-2 border-t pt-4">
                      <p className="eyebrow">Daily — block bootstrap</p>
                      <KeyValueGrid
                        columns={2}
                        items={[
                          { label: "Family", value: daily.vintage.model_json.family ?? "—" },
                          { label: "Paths", value: formatInteger(recipe?.paths) },
                          { label: "Block length", value: `${recipe?.block_days ?? "—"} days` },
                          { label: "Lookback", value: `${formatInteger(recipe?.lookback_days)} days` },
                          { label: "Seed", value: String(recipe?.seed ?? "—") },
                          { label: "Origin", value: formatDate(daily.vintage.origin) },
                        ]}
                      />
                    </div>
                  ) : null}
                </div>
                <ReadingNote>
                  The Chronos-2 weights are pinned by revision and SHA-256 and verified before
                  inference, so a path can be replayed exactly. Quantiles are calibrated per
                  horizon cohort at half strength — the reference configuration, which is{" "}
                  <strong>not</strong> a promoted champion.
                </ReadingNote>
              </CardContent>
            </Card>
          </section>

          {daily ? (
            <section className="space-y-4">
              <SectionHeading
                title="Two families, one calendar"
                description="The Monday Chronos vintage is frozen for the week; the bootstrap is re-issued daily. Comparing them by target date is how the pipeline detects drift between the two views."
              />
              <div className="grid gap-4 xl:grid-cols-2">
                <ModelComparisonChart rows={divergence} />
                <DivergenceBarChart rows={divergence} />
              </div>
            </section>
          ) : null}

          <section className="space-y-4">
            <SectionHeading
              title="The path in numbers"
              description="Both vintages, all thirty horizons. This is the shape the versioned API contract serves."
            />
            <Card className="gap-4">
              <CardContent>
                <Tabs defaultValue="weekly">
                  <TabsList>
                    <TabsTrigger value="weekly">Weekly Chronos-2</TabsTrigger>
                    <TabsTrigger value="daily" disabled={!daily}>
                      Daily bootstrap
                    </TabsTrigger>
                    <TabsTrigger value="published" disabled={!publication}>
                      Published path
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="weekly" className="pt-4">
                    <HorizonTable
                      points={weekly.points}
                      anchorRate={latest?.rate ?? null}
                      observed={observed}
                      published={publication?.points}
                    />
                  </TabsContent>

                  <TabsContent value="daily" className="pt-4">
                    {daily ? (
                      <HorizonTable
                        points={daily.points}
                        anchorRate={latest?.rate ?? null}
                        observed={observed}
                      />
                    ) : null}
                  </TabsContent>

                  <TabsContent value="published" className="space-y-4 pt-4">
                    {publication ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <PairBadge pair={publication.pair} />
                          <ModeBadge mode={publication.mode} />
                          <MonoTag>{publication.policy_version}</MonoTag>
                          <MonoTag>snapshot {shortHash(publication.snapshot_id, 12)}</MonoTag>
                          {assessment ? (
                            <DecisionBadge
                              decision={assessment.record.assessment.decision}
                            />
                          ) : null}
                        </div>
                        <ReadingNote>
                          The published snapshot restates the base q05/q50/q95 for every target
                          date and records the single rate the policy selected. The LLM never
                          shifts an interval; it can only move the selected point, and only when
                          the absolute delta exceeds 1%.
                        </ReadingNote>
                        <HorizonTable
                          points={weekly.points}
                          anchorRate={latest?.rate ?? null}
                          observed={observed}
                          published={publication.points}
                        />
                      </>
                    ) : null}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>

          {daily ? (
            <section className="grid gap-4 xl:grid-cols-2">
              <ForecastFanChart
                rows={dailyFan}
                anchorDate={daily.vintage.origin}
                anchorRate={latest?.rate ?? null}
                accent="var(--chart-2)"
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    Daily bootstrap path
                    <MonoTag>origin {formatDate(daily.vintage.origin)}</MonoTag>
                  </span>
                }
                description="1,000 block-bootstrap paths resampled in seven-day blocks from the trailing three years of returns."
                height={320}
              />
              <UncertaintyGrowthChart rows={dailyWidths} accent="var(--chart-2)" height={320} />
            </section>
          ) : null}

          {dailySummary ? (
            <ReadingNote>
              Bootstrap day 30 median {formatRate(dailySummary.medianEnd)} against Chronos{" "}
              {formatRate(weeklySummary?.medianEnd)} — a difference of{" "}
              {formatPercent(
                weeklySummary
                  ? ((dailySummary.medianEnd - weeklySummary.medianEnd) /
                      weeklySummary.medianEnd) *
                      100
                  : null,
                2,
                true,
              )}
              . The two paths cover different origin dates, so the last common target date is the
              only fair place to compare terminal levels.
            </ReadingNote>
          ) : null}
        </>
      )}
    </>
  );
}
