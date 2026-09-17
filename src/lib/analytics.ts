import type {
  ForecastKind,
  ForecastPoint,
  Observation,
  Pair,
  RealizedPointLike,
} from "@/lib/analytics-types";

export type { RealizedPointLike };

/* --------------------------------------------------------- path statistics */

export function bandWidthPct(point: Pick<ForecastPoint, "q05" | "q50" | "q95">): number {
  return ((point.q95 - point.q05) / point.q50) * 100;
}

export function innerBandWidthPct(point: Pick<ForecastPoint, "q25" | "q50" | "q75">): number {
  return ((point.q75 - point.q25) / point.q50) * 100;
}

/**
 * Quantile skew at a horizon: how far the median sits from the centre of the
 * 90% interval. Positive means the upside tail is longer (more room for the
 * cedi to weaken than to strengthen).
 */
export function skew(point: Pick<ForecastPoint, "q05" | "q50" | "q95">): number {
  const upper = point.q95 - point.q50;
  const lower = point.q50 - point.q05;
  const total = upper + lower;
  return total === 0 ? 0 : (upper - lower) / total;
}

export type PathSummary = {
  horizons: number;
  firstDate: string;
  lastDate: string;
  medianStart: number;
  medianEnd: number;
  driftPct: number;
  anchorDriftPct: number | null;
  widthStart: number;
  widthEnd: number;
  widthAt: (horizon: number) => number | null;
  maxWidth: number;
  meanSkew: number;
  terminal: ForecastPoint | null;
  upsidePct: number | null;
  downsidePct: number | null;
};

export function summarisePath(
  points: ForecastPoint[],
  anchorRate?: number | null,
): PathSummary | null {
  if (!points.length) return null;
  const sorted = [...points].sort((a, b) => a.horizon - b.horizon);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const widths = sorted.map(bandWidthPct);
  const byHorizon = new Map(sorted.map((point) => [point.horizon, point]));

  return {
    horizons: sorted.length,
    firstDate: first.target_date,
    lastDate: last.target_date,
    medianStart: first.q50,
    medianEnd: last.q50,
    driftPct: ((last.q50 - first.q50) / first.q50) * 100,
    anchorDriftPct: anchorRate ? ((last.q50 - anchorRate) / anchorRate) * 100 : null,
    widthStart: widths[0],
    widthEnd: widths[widths.length - 1],
    widthAt: (horizon: number) => {
      const point = byHorizon.get(horizon);
      return point ? bandWidthPct(point) : null;
    },
    maxWidth: Math.max(...widths),
    meanSkew: sorted.reduce((total, point) => total + skew(point), 0) / sorted.length,
    terminal: last,
    upsidePct: anchorRate ? ((last.q95 - anchorRate) / anchorRate) * 100 : null,
    downsidePct: anchorRate ? ((last.q05 - anchorRate) / anchorRate) * 100 : null,
  };
}

/* ------------------------------------------------------------ fan chart rows */

/**
 * The eight segments of the quantile fan, innermost first.
 *
 * Each segment is emitted as an absolute `[low, high]` pair rather than a
 * stacked thickness: Recharts folds the stack baseline (zero) into the axis
 * domain, which flattens a rate series into the top few percent of the plot.
 * Range areas keep the axis on the data.
 */
export const FAN_BANDS = [
  { key: "b1", from: "q01", to: "q05", shade: 1, label: "1-5%" },
  { key: "b2", from: "q05", to: "q10", shade: 2, label: "5-10%" },
  { key: "b3", from: "q10", to: "q25", shade: 3, label: "10-25%" },
  { key: "b4", from: "q25", to: "q50", shade: 4, label: "25-50%" },
  { key: "b5", from: "q50", to: "q75", shade: 4, label: "50-75%" },
  { key: "b6", from: "q75", to: "q90", shade: 3, label: "75-90%" },
  { key: "b7", from: "q90", to: "q95", shade: 2, label: "90-95%" },
  { key: "b8", from: "q95", to: "q99", shade: 1, label: "95-99%" },
] as const;

export type FanBandKey = (typeof FAN_BANDS)[number]["key"];
export type BandRange = [number, number] | null;

export type FanRow = {
  date: string;
  actual: number | null;
  median: number | null;
  q01: number | null;
  q05: number | null;
  q25: number | null;
  q75: number | null;
  q95: number | null;
  q99: number | null;
  horizon: number | null;
  /** Set once an observation exists for a forecast target date. */
  realisedError: number | null;
} & Record<FanBandKey, BandRange>;

function emptyRow(date: string): FanRow {
  return {
    date,
    actual: null,
    median: null,
    q01: null,
    q05: null,
    q25: null,
    q75: null,
    q95: null,
    q99: null,
    horizon: null,
    realisedError: null,
    b1: null,
    b2: null,
    b3: null,
    b4: null,
    b5: null,
    b6: null,
    b7: null,
    b8: null,
  };
}

/**
 * One date-indexed series carrying observed history and the forecast fan.
 *
 * Observations that fall on a forecast target date stay on the `actual` line,
 * so the realised path is drawn straight through the fan - that overlap is the
 * point of the chart during a live experiment.
 */
export function buildFanRows(
  history: { observed_on: string; rate: number }[],
  points: ForecastPoint[],
  anchorDate?: string | null,
): FanRow[] {
  const rows = new Map<string, FanRow>();
  const observed = new Map<string, number>();

  for (const observation of history) {
    const row = rows.get(observation.observed_on) ?? emptyRow(observation.observed_on);
    row.actual = observation.rate;
    rows.set(observation.observed_on, row);
    observed.set(observation.observed_on, observation.rate);
  }

  // Pin the fan to the observation on the origin date so the median line leaves
  // the realised path instead of starting in mid-air.
  const anchorRate = anchorDate ? observed.get(anchorDate) : undefined;
  if (anchorDate && anchorRate !== undefined) {
    const row = rows.get(anchorDate) ?? emptyRow(anchorDate);
    row.median = anchorRate;
    for (const band of FAN_BANDS) row[band.key] = [anchorRate, anchorRate];
    row.q01 = anchorRate;
    row.q05 = anchorRate;
    row.q25 = anchorRate;
    row.q75 = anchorRate;
    row.q95 = anchorRate;
    row.q99 = anchorRate;
    rows.set(anchorDate, row);
  }

  for (const point of points) {
    const row = rows.get(point.target_date) ?? emptyRow(point.target_date);
    for (const band of FAN_BANDS) {
      row[band.key] = [point[band.from], point[band.to]];
    }
    row.median = point.q50;
    row.q01 = point.q01;
    row.q05 = point.q05;
    row.q25 = point.q25;
    row.q75 = point.q75;
    row.q95 = point.q95;
    row.q99 = point.q99;
    row.horizon = point.horizon;
    const realised = observed.get(point.target_date);
    row.realisedError = realised === undefined ? null : realised - point.q50;
    rows.set(point.target_date, row);
  }

  return Array.from(rows.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/* ------------------------------------------------- weekly vs daily alignment */

export type DivergenceRow = {
  target_date: string;
  weeklyHorizon: number | null;
  dailyHorizon: number | null;
  weeklyMedian: number | null;
  dailyMedian: number | null;
  deltaPct: number | null;
  weeklyWidth: number | null;
  dailyWidth: number | null;
};

/**
 * Compare the two model families by target date, not by horizon index: the
 * bootstrap's day 1 is the Chronos vintage's day N for the same calendar date.
 */
export function alignByTargetDate(
  weekly: ForecastPoint[],
  daily: ForecastPoint[],
): DivergenceRow[] {
  const weeklyByDate = new Map(weekly.map((point) => [point.target_date, point]));
  const dailyByDate = new Map(daily.map((point) => [point.target_date, point]));
  const dates = Array.from(
    new Set([...weeklyByDate.keys(), ...dailyByDate.keys()]),
  ).sort();

  return dates.map((date) => {
    const w = weeklyByDate.get(date) ?? null;
    const d = dailyByDate.get(date) ?? null;
    return {
      target_date: date,
      weeklyHorizon: w?.horizon ?? null,
      dailyHorizon: d?.horizon ?? null,
      weeklyMedian: w?.q50 ?? null,
      dailyMedian: d?.q50 ?? null,
      deltaPct: w && d ? ((d.q50 - w.q50) / w.q50) * 100 : null,
      weeklyWidth: w ? bandWidthPct(w) : null,
      dailyWidth: d ? bandWidthPct(d) : null,
    };
  });
}

/* ------------------------------------------------------- market diagnostics */

export function logReturns(series: { observed_on: string; rate: number }[]) {
  const out: { date: string; ret: number }[] = [];
  for (let index = 1; index < series.length; index += 1) {
    const previous = series[index - 1].rate;
    const current = series[index].rate;
    if (previous > 0 && current > 0) {
      out.push({ date: series[index].observed_on, ret: Math.log(current / previous) });
    }
  }
  return out;
}

/** Annualised rolling standard deviation of daily log returns, in percent. */
export function rollingVolatility(
  series: { observed_on: string; rate: number }[],
  window = 30,
): { date: string; vol: number }[] {
  const rets = logReturns(series);
  const out: { date: string; vol: number }[] = [];
  for (let index = window - 1; index < rets.length; index += 1) {
    const slice = rets.slice(index - window + 1, index + 1);
    const mean = slice.reduce((total, item) => total + item.ret, 0) / slice.length;
    const variance =
      slice.reduce((total, item) => total + (item.ret - mean) ** 2, 0) /
      (slice.length - 1 || 1);
    out.push({ date: rets[index].date, vol: Math.sqrt(variance) * Math.sqrt(365) * 100 });
  }
  return out;
}

/** Cumulative cedi depreciation from the series start, in percent. */
export function indexedSeries(series: { observed_on: string; rate: number }[]) {
  if (!series.length) return [];
  const base = series[0].rate;
  return series.map((point) => ({
    date: point.observed_on,
    indexed: ((point.rate - base) / base) * 100,
  }));
}

export function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return Number.NaN;
  const meanA = a.slice(0, n).reduce((t, v) => t + v, 0) / n;
  const meanB = b.slice(0, n).reduce((t, v) => t + v, 0) / n;
  let cov = 0;
  let varA = 0;
  let varB = 0;
  for (let index = 0; index < n; index += 1) {
    const da = a[index] - meanA;
    const db = b[index] - meanB;
    cov += da * db;
    varA += da * da;
    varB += db * db;
  }
  return varA && varB ? cov / Math.sqrt(varA * varB) : Number.NaN;
}

export function latestOf(observations: Observation[], pair: Pair): Observation | undefined {
  return observations.find((observation) => observation.pair === pair);
}

/* ----------------------------------------------------------- accuracy rollup */

export const HORIZON_COHORTS = [
  { key: "1-7", label: "Day 1–7", min: 1, max: 7 },
  { key: "8-14", label: "Day 8–14", min: 8, max: 14 },
  { key: "15-21", label: "Day 15–21", min: 15, max: 21 },
  { key: "22-30", label: "Day 22–30", min: 22, max: 30 },
] as const;

export function cohortOf(horizon: number): string {
  return HORIZON_COHORTS.find((c) => horizon >= c.min && horizon <= c.max)?.key ?? "1-7";
}

export type AccuracyRollup = {
  key: string;
  label: string;
  count: number;
  mape: number;
  mae: number;
  bias: number;
  coverage90: number;
};

export function rollupAccuracy<T extends RealizedPointLike>(
  rows: T[],
  groupBy: (row: T) => { key: string; label: string },
): AccuracyRollup[] {
  const groups = new Map<string, { label: string; rows: T[] }>();
  for (const row of rows) {
    const { key, label } = groupBy(row);
    const bucket = groups.get(key) ?? { label, rows: [] };
    bucket.rows.push(row);
    groups.set(key, bucket);
  }
  return Array.from(groups.entries())
    .map(([key, bucket]) => {
      const n = bucket.rows.length;
      return {
        key,
        label: bucket.label,
        count: n,
        mape: bucket.rows.reduce((t, r) => t + r.absolute_percentage_error, 0) / n,
        mae: bucket.rows.reduce((t, r) => t + Math.abs(r.signed_error), 0) / n,
        bias: bucket.rows.reduce((t, r) => t + r.signed_error, 0) / n,
        coverage90:
          (bucket.rows.filter((r) => r.inside_90).length / n) * 100,
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

/* ------------------------------------------------- shared chart row builders */

export type MultiSeriesRow = { date: string } & Partial<Record<Pair, number>>;

/** Align every pair's series on a common date axis. */
export function buildMultiSeries(
  seriesByPair: Record<string, { observed_on: string; rate: number }[]>,
  transform: (value: number, first: number) => number = (value) => value,
): MultiSeriesRow[] {
  const rows = new Map<string, MultiSeriesRow>();
  for (const [pair, series] of Object.entries(seriesByPair)) {
    const first = series[0]?.rate ?? 1;
    for (const point of series) {
      const row = rows.get(point.observed_on) ?? { date: point.observed_on };
      row[pair as Pair] = transform(point.rate, first);
      rows.set(point.observed_on, row);
    }
  }
  return Array.from(rows.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export type WidthRow = {
  horizon: number;
  target_date: string;
  width90: number;
  width50: number;
  skew: number;
  median: number;
};

export function buildWidthRows(points: ForecastPoint[]): WidthRow[] {
  return [...points]
    .sort((a, b) => a.horizon - b.horizon)
    .map((point) => ({
      horizon: point.horizon,
      target_date: point.target_date,
      width90: bandWidthPct(point),
      width50: innerBandWidthPct(point),
      skew: skew(point) * 100,
      median: point.q50,
    }));
}

/* ---------------------------------------------------------------- axis help */

/**
 * Round an axis range out to human-readable bounds and return matching ticks.
 * Recharts will otherwise honour an exact computed domain and emit ticks at
 * awkward values, which is hard to read on a rate axis.
 */
export function niceDomain(
  values: number[],
  targetTicks = 5,
  padFraction = 0.06,
): { domain: [number, number]; ticks: number[] } | null {
  const finite = values.filter((value) => Number.isFinite(value));
  if (!finite.length) return null;

  const rawMin = Math.min(...finite);
  const rawMax = Math.max(...finite);
  const pad = (rawMax - rawMin) * padFraction || Math.abs(rawMax) * 0.01 || 1;
  const min = rawMin - pad;
  const max = rawMax + pad;

  const rawStep = (max - min) / Math.max(1, targetTicks - 1);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const stepMultiple = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  const step = stepMultiple * magnitude;

  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;

  const ticks: number[] = [];
  for (let tick = lo; tick <= hi + step / 2; tick += step) {
    ticks.push(Number(tick.toFixed(10)));
  }
  return { domain: [lo, hi], ticks };
}

/* ---------------------------------------------- observed vs both model views */

export type TrackRow = {
  date: string;
  actual: number | null;
  chronos: number | null;
  chronosBand: BandRange;
  chronosOrigin: string | null;
  chronosHorizon: number | null;
  bootstrap: number | null;
  bootstrapBand: BandRange;
  bootstrapOrigin: string | null;
  bootstrapHorizon: number | null;
};

type KindedPath = {
  kind: ForecastKind;
  origin: string;
  points: ForecastPoint[];
};

/**
 * One row per calendar date carrying the observed rate beside what each model
 * family was saying about that date.
 *
 * Where several vintages cover the same target date, the most recent origin
 * wins — that is the view a consumer reading the latest pointer would have had.
 */
export function buildTrackRows(
  history: { observed_on: string; rate: number }[],
  paths: KindedPath[],
): TrackRow[] {
  const rows = new Map<string, TrackRow>();
  const ensure = (date: string): TrackRow => {
    let row = rows.get(date);
    if (!row) {
      row = {
        date,
        actual: null,
        chronos: null,
        chronosBand: null,
        chronosOrigin: null,
        chronosHorizon: null,
        bootstrap: null,
        bootstrapBand: null,
        bootstrapOrigin: null,
        bootstrapHorizon: null,
      };
      rows.set(date, row);
    }
    return row;
  };

  for (const observation of history) {
    ensure(observation.observed_on).actual = observation.rate;
  }

  // Oldest origin first, so a newer vintage overwrites an older one's view.
  const ordered = [...paths].sort((a, b) => a.origin.localeCompare(b.origin));
  for (const path of ordered) {
    const weekly = path.kind === "weekly_chronos";
    for (const point of path.points) {
      const row = ensure(point.target_date);
      if (weekly) {
        row.chronos = point.q50;
        row.chronosBand = [point.q05, point.q95];
        row.chronosOrigin = path.origin;
        row.chronosHorizon = point.horizon;
      } else {
        row.bootstrap = point.q50;
        row.bootstrapBand = [point.q05, point.q95];
        row.bootstrapOrigin = path.origin;
        row.bootstrapHorizon = point.horizon;
      }
    }
  }

  return Array.from(rows.values()).sort((a, b) => a.date.localeCompare(b.date));
}
