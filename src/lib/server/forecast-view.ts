import "server-only";

import { cache } from "react";

import {
  getAllLatestPublications,
  getCommercialComparisons,
  getLatestAssessmentPerPair,
  getObservations,
  getPairVintages,
  getPublicationHistory,
  getRealizedPoints,
  type RealizedPoint as RealizedPointRow,
} from "@/lib/server/queries";
import {
  alignByTargetDate,
  buildFanRows,
  buildPublishedWalkForward,
  buildTrackRows,
  buildWidthRows,
  walkForwardWindow,
  summarisePath,
  type DivergenceRow,
  type FanRow,
  type PathSummary,
  type TrackRow,
  type WidthRow,
} from "@/lib/analytics";
import type {
  EventAssessmentRow,
  ForecastKind,
  ForecastPath,
  ForecastPoint,
  Observation,
  Pair,
  PublishedPoint,
  PublishedSnapshot,
} from "@/lib/types";

export type VintageOption = {
  forecast_id: string;
  kind: ForecastKind;
  origin: string;
  revision: number;
  issued_at: string;
  provenance: string;
};

export type ForecastModel = {
  pair: Pair;
  history: Observation[];
  latest: Observation | null;
  weekly: ForecastPath | null;
  daily: ForecastPath | null;
  /** Every stored origin, newest first, so a past vintage can be re-opened. */
  weeklyOptions: VintageOption[];
  dailyOptions: VintageOption[];
  isLatestWeekly: boolean;
  publication: PublishedSnapshot | null;
  assessment: EventAssessmentRow | null;
  weeklySummary: PathSummary | null;
  dailySummary: PathSummary | null;
  weeklyFan: FanRow[];
  dailyFan: FanRow[];
  /**
   * Every stored bootstrap origin merged into one continuous path: a past
   * date keeps whichever vintage most recently forecast it (its immediate
   * one-day-ahead call, typically) instead of dropping out of view the moment
   * a newer vintage's forward window moves past it.
   */
  dailyWalkForwardFan: FanRow[];
  dailyWalkForwardPoints: (ForecastPoint & { origin: string })[];
  /**
   * The same merge for the weekly Chronos vintages, as of the selected origin:
   * last week's frozen path stays on the chart after Monday's new vintage
   * arrives, and the new one takes over from its own start date.
   */
  weeklyWalkForwardFan: FanRow[];
  weeklyWalkForwardPoints: (ForecastPoint & { origin: string })[];
  /**
   * Every stored publication snapshot for this pair merged by target date, so a
   * date keeps the most recently published row for it even though each snapshot
   * only covers 30 days from its own base vintage's origin. This is what the
   * "Published" column in the path tables reads from.
   */
  publishedWalkForward: PublishedPoint[];
  /** Dates where the LLM's proposed delta was actually selected, for the chart overlay. */
  adjustments: { date: string; rate: number; base: number; deltaPct: number }[];
  /** Origins of the weekly vintages contributing to the walk-forward, oldest first. */
  weeklyOrigins: string[];
  weeklyWidths: WidthRow[];
  dailyWidths: WidthRow[];
  divergence: DivergenceRow[];
  track: TrackRow[];
  realized: RealizedPointRow[];
  /** Cross-bank mean transfer-selling rate by publication date (commercial basis). */
  bankMeans: BankMeanPoint[];
};

export type BankMeanPoint = {
  date: string;
  mean: number;
  median: number;
  min: number;
  max: number;
  bankCount: number;
  eligible: boolean;
};

function toOption(path: ForecastPath): VintageOption {
  return {
    forecast_id: path.vintage.forecast_id,
    kind: path.vintage.kind,
    origin: path.vintage.origin,
    revision: path.vintage.revision,
    issued_at: path.vintage.issued_at,
    provenance: path.vintage.provenance,
  };
}

export const getForecastModel = cache(
  async (
    pair: Pair,
    options: { historyDays?: number; weeklyOrigin?: string; dailyOrigin?: string } = {},
  ): Promise<ForecastModel> => {
    const historyDays = options.historyDays ?? 120;

    const [paths, observations, publications, publicationHistory, assessments, realized, comparisons] =
      await Promise.all([
        getPairVintages(pair, 45),
        getObservations(pair, Math.max(historyDays, 180)),
        getAllLatestPublications(),
        getPublicationHistory(pair, 90),
        getLatestAssessmentPerPair(),
        getRealizedPoints(4000),
        // Bank quotes are a newer table; a read failure there must not take the
        // forecast page down with it.
        getCommercialComparisons(2000).catch(() => []),
      ]);

    const byKind = (kind: ForecastKind) =>
      paths
        .filter((path) => path.vintage.kind === kind)
        .sort(
          (a, b) =>
            b.vintage.origin.localeCompare(a.vintage.origin) ||
            b.vintage.revision - a.vintage.revision,
        );

    const weeklyPaths = byKind("weekly_chronos");
    const dailyPaths = byKind("daily_bootstrap");

    const pick = (candidates: ForecastPath[], origin?: string) =>
      (origin ? candidates.find((path) => path.vintage.origin === origin) : undefined) ??
      candidates[0] ??
      null;

    const weekly = pick(weeklyPaths, options.weeklyOrigin);
    const daily = pick(dailyPaths, options.dailyOrigin);

    const historyStart = observations.slice(-historyDays)[0]?.observed_on ?? null;
    const dailyWalkForwardPoints = walkForwardWindow(
      dailyPaths.map((path) => ({ origin: path.vintage.origin, points: path.points })),
      { since: historyStart },
    );
    const weeklyWalkForwardPoints = walkForwardWindow(
      weeklyPaths.map((path) => ({ origin: path.vintage.origin, points: path.points })),
      { asOf: weekly?.vintage.origin ?? null, since: historyStart },
    );
    const weeklyOrigins = Array.from(new Set(weeklyWalkForwardPoints.map((point) => point.origin)))
      .sort();

    // Each midday run creates a new snapshot covering only 30 days from its own
    // base vintage; merge every stored one so a date keeps whatever was most
    // recently published for it, the same rule the forecast walk-forward uses.
    const publishedWalkForward = buildPublishedWalkForward(
      publicationHistory.map((snapshot) => ({
        createdAt: snapshot.created_at,
        points: snapshot.points,
      })),
    );
    const adjustments = publishedWalkForward
      .filter((point) => point.selection === "event_candidate")
      .map((point) => ({
        date: point.target_date,
        rate: point.selected_rate,
        base: point.base_q50,
        deltaPct: point.adjustment_delta_pct ?? ((point.selected_rate - point.base_q50) / point.base_q50) * 100,
      }));

    const window = observations.slice(-historyDays);
    const latest = observations[observations.length - 1] ?? null;
    const series = window.map((item) => ({
      observed_on: item.observed_on,
      rate: item.rate,
    }));
    const anchorRate = weekly
      ? (observations.find((item) => item.observed_on === weekly.vintage.origin)?.rate ??
        latest?.rate ??
        null)
      : (latest?.rate ?? null);

    return {
      pair,
      history: window,
      latest,
      weekly,
      daily,
      weeklyOptions: weeklyPaths.map(toOption),
      dailyOptions: dailyPaths.map(toOption),
      isLatestWeekly: !weekly || weekly.vintage.forecast_id === weeklyPaths[0]?.vintage.forecast_id,
      publication: publications.find((item) => item.pair === pair) ?? null,
      assessment: assessments.find((item) => item.pair === pair) ?? null,
      weeklySummary: summarisePath(weekly?.points ?? [], anchorRate),
      dailySummary: summarisePath(daily?.points ?? [], latest?.rate ?? null),
      weeklyFan: buildFanRows(series, weekly?.points ?? [], weekly?.vintage.origin ?? null),
      dailyFan: buildFanRows(series, daily?.points ?? [], daily?.vintage.origin ?? null),
      dailyWalkForwardFan: buildFanRows(series, dailyWalkForwardPoints),
      dailyWalkForwardPoints,
      // Pin the fan to the observed rate at the origin only when no earlier
      // vintage already forecast that date — otherwise the pin would overwrite a
      // genuine prediction with a degenerate one.
      weeklyWalkForwardFan: buildFanRows(
        series,
        weeklyWalkForwardPoints,
        weekly && !weeklyWalkForwardPoints.some((point) => point.target_date === weekly.vintage.origin)
          ? weekly.vintage.origin
          : null,
      ),
      weeklyWalkForwardPoints,
      weeklyOrigins,
      publishedWalkForward,
      adjustments,
      weeklyWidths: buildWidthRows(weekly?.points ?? []),
      dailyWidths: buildWidthRows(daily?.points ?? []),
      divergence: alignByTargetDate(weekly?.points ?? [], daily?.points ?? []),
      track: buildTrackRows(
        series,
        paths.map((path) => ({
          kind: path.vintage.kind,
          origin: path.vintage.origin,
          points: path.points,
        })),
      ),
      realized: realized.filter((row) => row.pair === pair),
      bankMeans: comparisons
        .filter((row) => row.pair === pair)
        .map((row) => ({
          date: row.observed_on,
          mean: row.mean_transfer_selling_rate,
          median: row.median_transfer_selling_rate,
          min: row.min_transfer_selling_rate,
          max: row.max_transfer_selling_rate,
          bankCount: row.bank_count,
          eligible: row.benchmark_eligible,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  },
);

export type { RealizedPointRow as RealizedPoint };
