import "server-only";

import { cache } from "react";

import {
  getAllLatestPublications,
  getLatestAssessmentPerPair,
  getObservations,
  getPairVintages,
  getRealizedPoints,
  type RealizedPoint as RealizedPointRow,
} from "@/lib/server/queries";
import {
  alignByTargetDate,
  buildFanRows,
  buildTrackRows,
  buildWidthRows,
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
  Observation,
  Pair,
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
  weeklyWidths: WidthRow[];
  dailyWidths: WidthRow[];
  divergence: DivergenceRow[];
  track: TrackRow[];
  realized: RealizedPointRow[];
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

    const [paths, observations, publications, assessments, realized] = await Promise.all([
      getPairVintages(pair, 45),
      getObservations(pair, Math.max(historyDays, 180)),
      getAllLatestPublications(),
      getLatestAssessmentPerPair(),
      getRealizedPoints(4000),
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
    };
  },
);

export type { RealizedPointRow as RealizedPoint };
