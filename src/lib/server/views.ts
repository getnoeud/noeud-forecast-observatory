import "server-only";

import { cache } from "react";

import {
  getAllLatestPublications,
  getAllLatestVintages,
  getAllSeries,
  getCommercialComparisons,
  getCoverage,
  getLatestAssessmentPerPair,
  getLatestObservations,
  getPipelineRuns,
  getPairVintages,
  getPointsFor,
  getPublicationHistory,
  getPublicationSummaries,
  type CommercialComparison,
  type CoverageRow,
  type PublicationSummary,
} from "@/lib/server/queries";
import {
  buildPublishedWalkForward,
  summarisePath,
  walkForwardWindow,
  type PathSummary,
} from "@/lib/analytics";
import {
  PAIRS,
  type EventAssessmentRow,
  type ForecastKind,
  type ForecastPoint,
  type ForecastPath,
  type Observation,
  type Pair,
  type PipelineRun,
  type PublishedSnapshot,
} from "@/lib/types";

export type MiniRow = {
  date: string;
  actual: number | null;
  /** The sparkline draws the 50% band: at this size the 90% band swamps the axis. */
  floor: number | null;
  band50: number | null;
  median: number | null;
  q25: number | null;
  q75: number | null;
  q05: number | null;
  q95: number | null;
};

function buildMiniRows(
  history: { observed_on: string; rate: number }[],
  points: ForecastPoint[],
  anchorDate: string | null,
): MiniRow[] {
  const rows = new Map<string, MiniRow>();
  for (const point of history) {
    rows.set(point.observed_on, {
      date: point.observed_on,
      actual: point.rate,
      floor: null,
      band50: null,
      median: null,
      q25: null,
      q75: null,
      q05: null,
      q95: null,
    });
  }
  // Pin the path to the observed rate at the origin only when no earlier vintage
  // already forecast that date; otherwise the pin would overwrite a real prediction.
  const covered = anchorDate ? points.some((point) => point.target_date === anchorDate) : false;
  const anchor = anchorDate && !covered ? rows.get(anchorDate) : undefined;
  if (anchor?.actual != null) {
    anchor.floor = anchor.actual;
    anchor.band50 = 0;
    anchor.median = anchor.actual;
    anchor.q25 = anchor.actual;
    anchor.q75 = anchor.actual;
    anchor.q05 = anchor.actual;
    anchor.q95 = anchor.actual;
  }
  for (const point of points) {
    const row = rows.get(point.target_date) ?? {
      date: point.target_date,
      actual: null,
      floor: null,
      band50: null,
      median: null,
      q25: null,
      q75: null,
      q05: null,
      q95: null,
    };
    row.floor = point.q25;
    row.band50 = point.q75 - point.q25;
    row.median = point.q50;
    row.q25 = point.q25;
    row.q75 = point.q75;
    row.q05 = point.q05;
    row.q95 = point.q95;
    rows.set(point.target_date, row);
  }
  return Array.from(rows.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export type PairOverview = {
  pair: Pair;
  latest: Observation | null;
  previousRate: number | null;
  dayChangePct: number | null;
  weekly: ForecastPath | null;
  daily: ForecastPath | null;
  publication: PublishedSnapshot | null;
  assessment: EventAssessmentRow | null;
  weeklySummary: PathSummary | null;
  dailySummary: PathSummary | null;
  miniRows: MiniRow[];
  /** Dates (within the mini chart's window) where the LLM's proposed rate was selected. */
  adjustments: { date: string; rate: number; base: number; deltaPct: number }[];
};

export type OverviewModel = {
  pairs: PairOverview[];
  coverage: CoverageRow[];
  publications: PublicationSummary[];
  latestRun: PipelineRun | null;
  runs: PipelineRun[];
  series: Record<string, { observed_on: string; rate: number }[]>;
  commercial: CommercialComparison[];
  generatedAt: string;
};

export const getOverview = cache(async (): Promise<OverviewModel> => {
  const [
    latestObservations,
    assessments,
    coverage,
    publications,
    runs,
    series,
    vintages,
    snapshots,
    commercial,
  ] = await Promise.all([
    getLatestObservations(),
    getLatestAssessmentPerPair(),
    getCoverage(),
    getPublicationSummaries(),
    getPipelineRuns(12),
    getAllSeries(400),
    getAllLatestVintages(),
    getAllLatestPublications(),
    // The bank table is newer than the forecast ledgers; never let it take the
    // overview down.
    getCommercialComparisons(2000).catch(() => []),
  ]);

  const pointsByForecast = await getPointsFor(
    vintages.map((vintage) => vintage.forecast_id),
  );
  const pathFor = (pair: Pair, kind: ForecastKind): ForecastPath | null => {
    const vintage = vintages.find((item) => item.pair === pair && item.kind === kind);
    return vintage
      ? { vintage, points: pointsByForecast[vintage.forecast_id] ?? [] }
      : null;
  };

  // Recent vintages so the sparkline keeps last week's Chronos path instead of
  // showing only the newest one. Six covers the 30-day sparkline window.
  const recentByPair = await Promise.all(PAIRS.map((pair) => getPairVintages(pair, 6)));
  // Every stored publication snapshot per pair, so the mini chart can mark a
  // date where the LLM's proposed rate was selected even though that date may
  // have been covered by an earlier, since-superseded snapshot.
  const publicationHistoryByPair = await Promise.all(
    PAIRS.map((pair) => getPublicationHistory(pair, 90)),
  );

  const pairs = PAIRS.map((pair, pairIndex): PairOverview => {
      const weekly = pathFor(pair, "weekly_chronos");
      const daily = pathFor(pair, "daily_bootstrap");
      const publication = snapshots.find((item) => item.pair === pair) ?? null;

      const history = (series[pair] ?? []).slice(-30);
      const weeklyWalkForward = walkForwardWindow(
        recentByPair[pairIndex]
          .filter((path) => path.vintage.kind === "weekly_chronos")
          .map((path) => ({ origin: path.vintage.origin, points: path.points })),
        { since: history[0]?.observed_on ?? null },
      );
      const latest = latestObservations.find((item) => item.pair === pair) ?? null;
      const full = series[pair] ?? [];
      const previousRate = full.length > 1 ? full[full.length - 2].rate : null;

      const publishedWalkForward = buildPublishedWalkForward(
        publicationHistoryByPair[pairIndex].map((snapshot) => ({
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
          deltaPct:
            point.adjustment_delta_pct ??
            ((point.selected_rate - point.base_q50) / point.base_q50) * 100,
        }));

      return {
        pair,
        latest,
        previousRate,
        dayChangePct:
          latest && previousRate ? ((latest.rate - previousRate) / previousRate) * 100 : null,
        weekly,
        daily,
        publication,
        assessment: assessments.find((item) => item.pair === pair) ?? null,
        weeklySummary: summarisePath(weekly?.points ?? [], latest?.rate ?? null),
        dailySummary: summarisePath(daily?.points ?? [], latest?.rate ?? null),
        miniRows: buildMiniRows(history, weeklyWalkForward, weekly?.vintage.origin ?? null),
        adjustments,
      };
  });

  return {
    pairs,
    coverage,
    publications,
    latestRun: runs[0] ?? null,
    runs,
    series,
    commercial,
    generatedAt: new Date().toISOString(),
  };
});
