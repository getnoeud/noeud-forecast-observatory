import "server-only";

import { cache } from "react";

import { query, queryOne } from "@/lib/server/db";
import type {
  EventAssessmentRow,
  ForecastKind,
  ForecastPath,
  ForecastPoint,
  ForecastVintage,
  LeaseJob,
  MaturedEvaluation,
  ModelAliasPointer,
  ModelArtifact,
  Observation,
  Pair,
  PipelineRun,
  ProviderRun,
  PublishedPoint,
  PublishedSnapshot,
} from "@/lib/types";

/** The private schema is configurable but must stay a bare identifier. */
function schema(): string {
  const name = process.env.OBSERVATORY_DB_SCHEMA?.trim() || "noeud_forecast";
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error(`Invalid OBSERVATORY_DB_SCHEMA: ${name}`);
  }
  return name;
}

const S = () => schema();

/* ------------------------------------------------------------ observations */

export const getObservations = cache(
  async (pair: Pair, limit = 1200): Promise<Observation[]> => {
    const rows = await query<Observation>(
      `select pair, observed_on, rate, source, fetched_at, provider_updated_at
         from ${S()}.canonical_fx_observations
        where pair = $1
        order by observed_on desc
        limit $2`,
      [pair, limit],
    );
    return rows.reverse();
  },
);

export const getLatestObservations = cache(async (): Promise<Observation[]> => {
  return query<Observation>(
    `select distinct on (pair) pair, observed_on, rate, source, fetched_at, provider_updated_at
       from ${S()}.canonical_fx_observations
      order by pair, observed_on desc`,
  );
});

export type CoverageRow = {
  pair: Pair;
  first_date: string;
  last_date: string;
  observed_days: number;
  span_days: number;
  versions: number;
};

export const getCoverage = cache(async (): Promise<CoverageRow[]> => {
  return query<CoverageRow>(
    `select c.pair,
            min(c.observed_on)::text as first_date,
            max(c.observed_on)::text as last_date,
            count(*)::int as observed_days,
            (max(c.observed_on) - min(c.observed_on) + 1)::int as span_days,
            (select count(*)::int from ${S()}.fx_observations o where o.pair = c.pair) as versions
       from ${S()}.canonical_fx_observations c
      group by c.pair
      order by c.pair`,
  );
});

/** Daily close series for every pair, aligned on observation date. */
export const getAllSeries = cache(
  async (limit = 1200): Promise<Record<string, { observed_on: string; rate: number }[]>> => {
    const rows = await query<{ pair: Pair; observed_on: string; rate: number }>(
      `select pair, observed_on, rate
         from (
           select pair, observed_on, rate,
                  row_number() over (partition by pair order by observed_on desc) as rn
             from ${S()}.canonical_fx_observations
         ) ranked
        where rn <= $1
        order by observed_on asc`,
      [limit],
    );
    const grouped: Record<string, { observed_on: string; rate: number }[]> = {};
    for (const row of rows) {
      (grouped[row.pair] ??= []).push({ observed_on: row.observed_on, rate: row.rate });
    }
    return grouped;
  },
);

/* --------------------------------------------------------------- forecasts */

/** Always qualified: several reads join the pointer tables, which repeat pair/kind. */
const VINTAGE_COLUMNS = `v.forecast_id, v.pair, v.kind, v.origin::text as origin, v.issued_at,
        v.data_as_of, v.provenance, v.input_sha256, v.model_artifact_id, v.model_json,
        v.revision, v.supersedes_forecast_id, v.revision_reason, v.recorded_at`;

export const getLatestVintage = cache(
  async (pair: Pair, kind: ForecastKind): Promise<ForecastPath | null> => {
    const vintage = await queryOne<ForecastVintage>(
      `select ${VINTAGE_COLUMNS}
         from ${S()}.forecast_vintages v
         join ${S()}.latest_forecast_pointers p using (forecast_id)
        where p.pair = $1 and p.kind = $2`,
      [pair, kind],
    );
    if (!vintage) return null;
    return { vintage, points: await getForecastPoints(vintage.forecast_id) };
  },
);

export const getForecastPoints = cache(async (forecastId: string): Promise<ForecastPoint[]> => {
  return query<ForecastPoint>(
    `select horizon, target_date::text as target_date,
            q01, q05, q10, q25, q50, q75, q90, q95, q99
       from ${S()}.forecast_points
      where forecast_id = $1
      order by horizon`,
    [forecastId],
  );
});

export const getVintageLedger = cache(async (limit = 200): Promise<ForecastVintage[]> => {
  return query<ForecastVintage>(
    `select ${VINTAGE_COLUMNS},
            (select count(*)::int from ${S()}.forecast_points fp
              where fp.forecast_id = v.forecast_id) as point_count
       from ${S()}.forecast_vintages v
      order by issued_at desc, pair
      limit $1`,
    [limit],
  );
});

export const getLatestPointers = cache(
  async (): Promise<{ pair: Pair; kind: ForecastKind; forecast_id: string; updated_at: string }[]> => {
    return query(
      `select pair, kind, forecast_id, updated_at from ${S()}.latest_forecast_pointers order by pair, kind`,
    );
  },
);

/* ------------------------------------------------------------- publication */

export const getLatestPublication = cache(
  async (pair: Pair): Promise<PublishedSnapshot | null> => {
    const snapshot = await queryOne<Omit<PublishedSnapshot, "points">>(
      `select s.snapshot_id, s.assessment_id, s.pair, s.created_at, s.mode,
              s.policy_version, s.weekly_forecast_id, s.approved_by
         from ${S()}.published_forecast_snapshots s
         join ${S()}.latest_publication_pointers p using (snapshot_id)
        where p.pair = $1
        order by s.created_at desc
        limit 1`,
      [pair],
    );
    if (!snapshot) return null;
    const points = await query<PublishedPoint>(
      `select horizon, target_date::text as target_date, base_q05, base_q50, base_q95,
              selected_rate, adjustment_delta_pct, selection
         from ${S()}.published_forecast_points
        where snapshot_id = $1
        order by horizon`,
      [snapshot.snapshot_id],
    );
    return { ...snapshot, points };
  },
);

export type PublicationSummary = {
  snapshot_id: string;
  assessment_id: string;
  pair: Pair;
  created_at: string;
  mode: "shadow" | "approved";
  policy_version: string;
  approved_by: string | null;
  point_count: number;
  adjusted_points: number;
  max_abs_delta_pct: number | null;
  /** The assessment this snapshot was built from: when it was made and when it lapses. */
  assessed_at: string;
  expires_at: string;
};

export const getPublicationSummaries = cache(async (): Promise<PublicationSummary[]> => {
  return query<PublicationSummary>(
    `select s.snapshot_id, s.assessment_id, s.pair, s.created_at, s.mode,
            s.policy_version, s.approved_by,
            count(p.*)::int as point_count,
            count(*) filter (where p.selection = 'event_candidate')::int as adjusted_points,
            max(abs(p.adjustment_delta_pct)) as max_abs_delta_pct,
            a.as_of as assessed_at, a.expires_at
       from ${S()}.published_forecast_snapshots s
       join ${S()}.event_assessments a using (assessment_id)
       left join ${S()}.published_forecast_points p using (snapshot_id)
      group by s.snapshot_id, s.assessment_id, s.pair, s.created_at, s.mode,
               s.policy_version, s.approved_by, a.as_of, a.expires_at
      order by s.created_at desc`,
  );
});

/* -------------------------------------------------------- event assessments */

export const getAssessments = cache(async (limit = 60): Promise<EventAssessmentRow[]> => {
  return query<EventAssessmentRow>(
    `select a.assessment_id, a.pair, a.as_of, a.created_at, a.expires_at,
            a.is_example, a.status, a.record_json as record,
            l.weekly_forecast_id, l.daily_forecast_id
       from ${S()}.event_assessments a
       left join ${S()}.event_forecast_links l using (assessment_id)
      order by a.created_at desc
      limit $1`,
    [limit],
  );
});

export const getLatestAssessmentPerPair = cache(async (): Promise<EventAssessmentRow[]> => {
  return query<EventAssessmentRow>(
    `select distinct on (a.pair)
            a.assessment_id, a.pair, a.as_of, a.created_at, a.expires_at,
            a.is_example, a.status, a.record_json as record,
            l.weekly_forecast_id, l.daily_forecast_id
       from ${S()}.event_assessments a
       left join ${S()}.event_forecast_links l using (assessment_id)
      order by a.pair, a.created_at desc`,
  );
});

export type RetrievalSnapshotRow = {
  snapshot_id: string;
  created_at: string;
  request_json: Record<string, unknown>;
  response_json: Record<string, unknown>;
};

export const getRetrievalSnapshot = cache(
  async (snapshotId: string): Promise<RetrievalSnapshotRow | null> => {
    return queryOne<RetrievalSnapshotRow>(
      `select snapshot_id, created_at, request_json, response_json
         from ${S()}.retrieval_snapshots where snapshot_id = $1`,
      [snapshotId],
    );
  },
);

/* ------------------------------------------------------------- operations */

export const getPipelineRuns = cache(async (limit = 50): Promise<PipelineRun[]> => {
  return query<PipelineRun>(
    `select pipeline_run_id, run_key, deployment_name, deployment_version, scheduled_for,
            started_at, completed_at, state, result_summary, error_code
       from ${S()}.pipeline_runs
      order by started_at desc
      limit $1`,
    [limit],
  );
});

export const getEventJobs = cache(async (limit = 40): Promise<LeaseJob[]> => {
  return query<LeaseJob>(
    `select context_hash as key, claimed_at, lease_expires_at, state, attempt_count,
            error_code, updated_at
       from ${S()}.event_jobs order by claimed_at desc limit $1`,
    [limit],
  );
});

export const getRetrievalJobs = cache(async (limit = 40): Promise<LeaseJob[]> => {
  return query<LeaseJob>(
    `select request_hash as key, claimed_at, lease_expires_at, state, attempt_count,
            error_code, updated_at
       from ${S()}.retrieval_jobs order by claimed_at desc limit $1`,
    [limit],
  );
});

export const getProviderRuns = cache(async (limit = 40): Promise<ProviderRun[]> => {
  return query<ProviderRun>(
    `select provider_run_id, provider, request_kind, requested_for::text as requested_for,
            started_at, completed_at, status, row_count, error_code
       from ${S()}.provider_runs order by started_at desc limit $1`,
    [limit],
  );
});

export type ProviderRunRollup = {
  request_kind: string;
  status: string;
  runs: number;
  rows_written: number;
  first_started: string;
  last_started: string;
};

export const getProviderRollup = cache(async (): Promise<ProviderRunRollup[]> => {
  return query<ProviderRunRollup>(
    `select request_kind, status, count(*)::int as runs, sum(row_count)::int as rows_written,
            min(started_at) as first_started, max(started_at) as last_started
       from ${S()}.provider_runs
      group by request_kind, status
      order by last_started desc`,
  );
});

/* ------------------------------------------------------------- evaluation */

export const getMaturedEvaluations = cache(
  async (limit = 3000): Promise<MaturedEvaluation[]> => {
    return query<MaturedEvaluation>(
      `select evaluation_id, forecast_id, assessment_id, pair, horizon,
              target_date::text as target_date, observed_rate, base_rate, selected_rate,
              absolute_error, absolute_percentage_error, direction_correct,
              inside_central_90_interval, metric_version, evaluated_at
         from ${S()}.matured_outcome_evaluations
        order by target_date desc, pair
        limit $1`,
      [limit],
    );
  },
);

export type RealizedPoint = {
  forecast_id: string;
  pair: Pair;
  kind: ForecastKind;
  origin: string;
  horizon: number;
  target_date: string;
  q05: number;
  q50: number;
  q95: number;
  observed_rate: number;
  signed_error: number;
  absolute_percentage_error: number;
  inside_90: boolean;
};

/**
 * Forecast points whose target date already has a canonical observation.
 *
 * `matured_outcome_evaluations` is the pipeline's own audited ledger and stays
 * authoritative. This read is the observatory's independent, immediate view so
 * the first days of a live vintage are visible before the ledger is written.
 */
export const getRealizedPoints = cache(async (limit = 4000): Promise<RealizedPoint[]> => {
  return query<RealizedPoint>(
    `select fp.forecast_id, v.pair, v.kind, v.origin::text as origin, fp.horizon,
            fp.target_date::text as target_date, fp.q05, fp.q50, fp.q95,
            o.rate as observed_rate,
            (fp.q50 - o.rate) as signed_error,
            (abs(fp.q50 - o.rate) / o.rate * 100) as absolute_percentage_error,
            (o.rate between fp.q05 and fp.q95) as inside_90
       from ${S()}.forecast_points fp
       join ${S()}.forecast_vintages v using (forecast_id)
       join ${S()}.canonical_fx_observations o
         on o.pair = v.pair and o.observed_on = fp.target_date
      order by fp.target_date desc, v.pair, v.kind
      limit $1`,
    [limit],
  );
});

/* ----------------------------------------------------------------- models */

export const getModelArtifacts = cache(async (): Promise<ModelArtifact[]> => {
  return query<ModelArtifact>(
    `select model_artifact_id, model_family, model_version, scope, artifact_uri,
            artifact_sha256, metrics, parameters, mlflow_run_id,
            trained_through::text as trained_through, created_at
       from ${S()}.model_artifacts order by created_at desc`,
  );
});

export const getModelAliases = cache(async (): Promise<ModelAliasPointer[]> => {
  return query<ModelAliasPointer>(
    `select model_family, scope, alias, model_artifact_id, approved_by, gate_report, updated_at
       from ${S()}.model_alias_pointers order by model_family, scope, alias`,
  );
});

/* -------------------------------------------------------------- inventory */

export type TableCount = { table_name: string; rows: number };

export const getInventory = cache(async (): Promise<TableCount[]> => {
  const rows = await query<{ table_name: string }>(
    `select table_name from information_schema.tables
      where table_schema = $1 and table_type = 'BASE TABLE'
      order by table_name`,
    [S()],
  );
  const counts = await Promise.all(
    rows.map(async ({ table_name }) => {
      const row = await queryOne<{ n: number }>(
        `select count(*)::int as n from ${S()}.${table_name}`,
      );
      return { table_name, rows: row?.n ?? 0 };
    }),
  );
  return counts;
});

/* ------------------------------------------------------- batched page reads */

/**
 * Every currently-pointed-to vintage in one round trip. The overview needs six
 * of these; issuing six separate queries against the pooler is the difference
 * between a fast page and a visibly slow one.
 */
export const getAllLatestVintages = cache(async (): Promise<ForecastVintage[]> => {
  return query<ForecastVintage>(
    `select ${VINTAGE_COLUMNS}
       from ${S()}.forecast_vintages v
       join ${S()}.latest_forecast_pointers p using (forecast_id)
      order by v.pair, v.kind`,
  );
});

/** Points for several forecasts at once, grouped by forecast id. */
export const getPointsFor = cache(
  async (forecastIds: string[]): Promise<Record<string, ForecastPoint[]>> => {
    if (!forecastIds.length) return {};
    const rows = await query<ForecastPoint & { forecast_id: string }>(
      `select forecast_id, horizon, target_date::text as target_date,
              q01, q05, q10, q25, q50, q75, q90, q95, q99
         from ${S()}.forecast_points
        where forecast_id = any($1::text[])
        order by forecast_id, horizon`,
      [forecastIds],
    );
    const grouped: Record<string, ForecastPoint[]> = {};
    for (const { forecast_id, ...point } of rows) {
      (grouped[forecast_id] ??= []).push(point);
    }
    return grouped;
  },
);

/** Every current publication snapshot with its 30 points, in two round trips. */
export const getAllLatestPublications = cache(
  async (): Promise<PublishedSnapshot[]> => {
    const snapshots = await query<Omit<PublishedSnapshot, "points">>(
      `select s.snapshot_id, s.assessment_id, s.pair, s.created_at, s.mode,
              s.policy_version, s.weekly_forecast_id, s.approved_by
         from ${S()}.published_forecast_snapshots s
         join ${S()}.latest_publication_pointers p using (snapshot_id)
        order by s.pair`,
    );
    if (!snapshots.length) return [];
    const points = await query<PublishedPoint & { snapshot_id: string }>(
      `select snapshot_id, horizon, target_date::text as target_date, base_q05, base_q50,
              base_q95, selected_rate, adjustment_delta_pct, selection
         from ${S()}.published_forecast_points
        where snapshot_id = any($1::text[])
        order by snapshot_id, horizon`,
      [snapshots.map((snapshot) => snapshot.snapshot_id)],
    );
    const grouped: Record<string, PublishedPoint[]> = {};
    for (const { snapshot_id, ...point } of points) {
      (grouped[snapshot_id] ??= []).push(point);
    }
    return snapshots.map((snapshot) => ({
      ...snapshot,
      points: grouped[snapshot.snapshot_id] ?? [],
    }));
  },
);

export type RateAnomaly = {
  pair: Pair;
  observed_on: string;
  previous_rate: number;
  rate: number;
  next_rate: number | null;
  move_pct: number;
  reversal_pct: number | null;
  fetched_at: string;
  source: string;
};

/**
 * Single-day moves beyond a threshold, with the following day's move alongside.
 *
 * A large jump that reverses almost exactly the next day is the signature of a
 * bad provider print rather than a market event — and because the bootstrap
 * resamples these returns and Chronos reads them as context, one bad print is
 * worth seeing rather than discovering later in a forecast.
 */
export const getRateAnomalies = cache(
  async (thresholdPct = 4): Promise<RateAnomaly[]> => {
    return query<RateAnomaly>(
      `with series as (
         select pair, observed_on, rate, source, fetched_at,
                lag(rate) over (partition by pair order by observed_on) as previous_rate,
                lead(rate) over (partition by pair order by observed_on) as next_rate
           from ${S()}.canonical_fx_observations
       )
       select pair, observed_on::text as observed_on, previous_rate, rate, next_rate,
              (rate / previous_rate - 1) * 100 as move_pct,
              case when next_rate is null then null
                   else (next_rate / rate - 1) * 100 end as reversal_pct,
              fetched_at, source
         from series
        where previous_rate is not null
          and abs(rate / previous_rate - 1) * 100 >= $1
        order by observed_on desc, pair`,
      [thresholdPct],
    );
  },
);

/**
 * Recent vintages for one pair with their points attached.
 *
 * The bootstrap is re-issued every day and Chronos every Monday, so answering
 * "what was each model saying about this date?" needs more than the current
 * pointer — it needs the run of vintages that covered it.
 */
export const getPairVintages = cache(
  async (pair: Pair, perKind = 20): Promise<ForecastPath[]> => {
    const vintages = await query<ForecastVintage>(
      `select ${VINTAGE_COLUMNS}
         from (
           select v.*, row_number() over (
                    partition by v.kind order by v.origin desc, v.revision desc
                  ) as rn
             from ${S()}.forecast_vintages v
            where v.pair = $1
         ) v
        where v.rn <= $2
        order by v.kind, v.origin desc, v.revision desc`,
      [pair, perKind],
    );
    if (!vintages.length) return [];
    const points = await getPointsFor(vintages.map((vintage) => vintage.forecast_id));
    return vintages.map((vintage) => ({
      vintage,
      points: points[vintage.forecast_id] ?? [],
    }));
  },
);

/* ------------------------------------------------- event-intelligence by day */

function forecastTimezone(): string {
  const zone = process.env.NEXT_PUBLIC_FORECAST_TIMEZONE?.trim() || "Africa/Accra";
  // Only a plain IANA-looking name is ever interpolated into SQL.
  return /^[A-Za-z_]+\/[A-Za-z_+-]+$/.test(zone) || zone === "UTC" ? zone : "UTC";
}

export type AssessmentDay = {
  day: string;
  assessments: number;
  pairs: number;
  decisions: string[];
  first_created_at: string;
  last_created_at: string;
};

/**
 * Every day that has at least one assessment, newest first.
 *
 * Days are bucketed in the pipeline's own timezone so a cycle that starts just
 * after midnight local time is not split across two calendar days.
 */
export const getAssessmentDays = cache(async (limit = 180): Promise<AssessmentDay[]> => {
  return query<AssessmentDay>(
    `select ((as_of at time zone '${forecastTimezone()}')::date)::text as day,
            count(*)::int as assessments,
            count(distinct pair)::int as pairs,
            array_agg(distinct record_json->'assessment'->>'decision') as decisions,
            min(created_at) as first_created_at,
            max(created_at) as last_created_at
       from ${S()}.event_assessments
      group by 1
      order by 1 desc
      limit $1`,
    [limit],
  );
});

/** The latest assessment per pair for one calendar day. */
export const getAssessmentsForDay = cache(
  async (day: string): Promise<EventAssessmentRow[]> => {
    return query<EventAssessmentRow>(
      `select distinct on (a.pair)
              a.assessment_id, a.pair, a.as_of, a.created_at, a.expires_at,
              a.is_example, a.status, a.record_json as record,
              l.weekly_forecast_id, l.daily_forecast_id
         from ${S()}.event_assessments a
         left join ${S()}.event_forecast_links l using (assessment_id)
        where (a.as_of at time zone '${forecastTimezone()}')::date = $1::date
        order by a.pair, a.created_at desc`,
      [day],
    );
  },
);

export type DecisionHistoryRow = {
  day: string;
  pair: Pair;
  decision: string;
  publication_action: string;
  evidence_count: number;
  rejected_count: number;
  cost_usd: number;
  assessment_id: string;
};

/** One row per pair per day: enough to plot how the stance moved over time. */
export const getDecisionHistory = cache(
  async (limit = 400): Promise<DecisionHistoryRow[]> => {
    return query<DecisionHistoryRow>(
      `select distinct on (day, pair) * from (
         select ((a.as_of at time zone '${forecastTimezone()}')::date)::text as day,
                a.pair,
                a.record_json->'assessment'->>'decision' as decision,
                a.record_json->>'publication_action' as publication_action,
                jsonb_array_length(coalesce(a.record_json->'evidence', '[]'::jsonb))::int
                  as evidence_count,
                jsonb_array_length(coalesce(a.record_json->'rejected_evidence', '[]'::jsonb))::int
                  as rejected_count,
                coalesce((
                  select sum((call->>'cost_usd')::numeric)
                    from jsonb_array_elements(a.record_json->'calls') as call
                ), 0)::float8 as cost_usd,
                a.assessment_id,
                a.created_at
           from ${S()}.event_assessments a
       ) ranked
        order by day desc, pair, created_at desc
        limit $1`,
      [limit],
    );
  },
);

/* ------------------------------------------------ commercial bank quotes */

export type BankQuote = {
  quote_id: string;
  bank: string;
  pair: Pair;
  quote_type: string;
  observed_on: string;
  rate: number;
  source_url: string;
  source_sha256: string;
  fetched_at: string;
};

/**
 * One row per bank, pair, quote type and publication date — the latest acquired
 * document wins, matching the rule the comparison view uses. A re-fetch of an
 * unchanged document is a second archive row, not a second quote.
 */
export const getBankQuotes = cache(async (days = 400): Promise<BankQuote[]> => {
  return query<BankQuote>(
    `select distinct on (bank, pair, quote_type, observed_on)
            quote_id, bank, pair, quote_type, observed_on::text as observed_on, rate,
            source_url, source_sha256, fetched_at
       from ${S()}.commercial_bank_quotes
      where observed_on >= current_date - $1::int
      order by bank, pair, quote_type, observed_on, fetched_at desc, created_at desc,
               quote_id desc`,
    [days],
  );
});

/** Every archived document row, including re-fetches, for the provenance ledger. */
export const getBankQuoteLedger = cache(async (limit = 2000): Promise<BankQuote[]> => {
  return query<BankQuote>(
    `select quote_id, bank, pair, quote_type, observed_on::text as observed_on, rate,
            source_url, source_sha256, fetched_at
       from ${S()}.commercial_bank_quotes
      order by observed_on desc, fetched_at desc, bank, pair, quote_type
      limit $1`,
    [limit],
  );
});

export type CommercialComparison = {
  pair: Pair;
  observed_on: string;
  bank_count: number;
  benchmark_eligible: boolean;
  mean_transfer_selling_rate: number;
  median_transfer_selling_rate: number;
  min_transfer_selling_rate: number;
  max_transfer_selling_rate: number;
  latest_quote_fetched_at: string;
  exchange_rate_api_rate: number | null;
  weekly_chronos_q50: number | null;
  weekly_forecast_id: string | null;
  bank_mean_minus_provider: number | null;
  bank_mean_minus_forecast: number | null;
};

/** The backend's own cross-bank benchmark view, one row per pair and date. */
export const getCommercialComparisons = cache(
  async (limit = 2000): Promise<CommercialComparison[]> => {
    return query<CommercialComparison>(
      `select pair, observed_on::text as observed_on, bank_count, benchmark_eligible,
              mean_transfer_selling_rate, median_transfer_selling_rate,
              min_transfer_selling_rate, max_transfer_selling_rate, latest_quote_fetched_at,
              exchange_rate_api_rate, weekly_chronos_q50, weekly_forecast_id,
              bank_mean_minus_provider, bank_mean_minus_forecast
         from ${S()}.commercial_transfer_selling_comparisons
        order by observed_on desc, pair
        limit $1`,
      [limit],
    );
  },
);
