/**
 * Domain contracts for the Noeud Forecast Intelligence database.
 *
 * These mirror `supabase/migrations/20260915000100_create_private_forecast_schema.sql`
 * in `noeud-fx-forecast-intelligence` plus the JSON documents that migration
 * stores verbatim (`model_json`, `record_json`, `result_summary`).
 */

export const PAIRS = ["USDGHS", "EURGHS", "GBPGHS"] as const;
export type Pair = (typeof PAIRS)[number];

export const PAIR_LABELS: Record<Pair, string> = {
  USDGHS: "USD / GHS",
  EURGHS: "EUR / GHS",
  GBPGHS: "GBP / GHS",
};

export const PAIR_BASE_LABELS: Record<Pair, string> = {
  USDGHS: "US dollar",
  EURGHS: "Euro",
  GBPGHS: "Pound sterling",
};

export function isPair(value: string | undefined | null): value is Pair {
  return !!value && (PAIRS as readonly string[]).includes(value);
}

export type ForecastKind = "weekly_chronos" | "daily_bootstrap";

export const FORECAST_KIND_LABELS: Record<ForecastKind, string> = {
  weekly_chronos: "Weekly Chronos-2",
  daily_bootstrap: "Daily bootstrap",
};

export const QUANTILE_KEYS = [
  "q01",
  "q05",
  "q10",
  "q25",
  "q50",
  "q75",
  "q90",
  "q95",
  "q99",
] as const;
export type QuantileKey = (typeof QUANTILE_KEYS)[number];

/** One target date of a 30-day probabilistic path. */
export type ForecastPoint = { horizon: number; target_date: string } & Record<
  QuantileKey,
  number
>;

export type ChronosModelJson = {
  device?: string;
  runtime?: string;
  horizons?: number;
  model_id?: string;
  quantiles?: number[];
  calibration?: string;
  weights_bytes?: number;
  context_length?: number;
  cross_learning?: boolean;
  model_revision?: string;
  weights_sha256?: string;
  calibrator_sha256?: string;
};

export type BootstrapModelJson = {
  family?: string;
  recipe?: {
    seed?: number;
    paths?: number;
    block_days?: number;
    lookback_days?: number;
  };
};

export type ModelJson = ChronosModelJson & BootstrapModelJson;

export type ForecastVintage = {
  forecast_id: string;
  pair: Pair;
  kind: ForecastKind;
  origin: string;
  issued_at: string;
  data_as_of: string | null;
  provenance: "issued" | "reconstructed";
  input_sha256: string;
  model_artifact_id: string | null;
  model_json: ModelJson;
  revision: number;
  supersedes_forecast_id: string | null;
  revision_reason: string;
  recorded_at: string;
  point_count?: number;
};

export type ForecastPath = {
  vintage: ForecastVintage;
  points: ForecastPoint[];
};

export type Observation = {
  pair: Pair;
  observed_on: string;
  rate: number;
  source: string;
  fetched_at: string;
  provider_updated_at: string | null;
};

export type PublishedPoint = {
  horizon: number;
  target_date: string;
  base_q05: number;
  base_q50: number;
  base_q95: number;
  selected_rate: number;
  adjustment_delta_pct: number | null;
  selection: "base" | "event_candidate";
};

export type PublishedSnapshot = {
  snapshot_id: string;
  assessment_id: string;
  pair: Pair;
  created_at: string;
  mode: "shadow" | "approved";
  policy_version: string;
  weekly_forecast_id: string;
  approved_by: string | null;
  points: PublishedPoint[];
};

/* ---------------------------------------------------------------- event LLM */

export type EvidenceRelevance = "high" | "medium" | "low";
export type EvidenceSentiment =
  | "cedi_negative"
  | "cedi_positive"
  | "mixed"
  | "neutral"
  | string;

export type EvidenceItem = {
  evidence_id: string;
  url: string;
  title: string;
  summary: string;
  mechanism: string;
  publisher: string;
  relevance: EvidenceRelevance | string;
  sentiment: EvidenceSentiment;
  event_type: string;
  date_status: string;
  source_type: string;
  published_at: string | null;
  published_on: string | null;
  uncertainties: string[];
  established_facts: string[];
  event_or_release_at: string | null;
  continuing_relevance: string | null;
  source_verification: {
    method?: string;
    status?: string;
    checked_at?: string;
    error_code?: string | null;
    content_sha256?: string | null;
    date_precision?: string | null;
    declared_value?: string | null;
  } | null;
};

export type EventDecision = "hold" | "monitor" | "review_adjustment";

export type EventAssessmentBody = {
  pair: Pair;
  decision: EventDecision | string;
  rationale: string;
  persistence: string;
  watch_items: string[];
  evidence_ids: string[];
  prior_reviews: unknown[];
  recommendations: unknown[];
  counter_evidence: string[];
  evidence_strength: string;
};

export type GatewayCall = {
  stage: "retrieval" | "analysis" | string;
  cost_usd: number | null;
  cache_hit: boolean;
  response_id: string | null;
  prompt_tokens: number | null;
  request_bytes: number | null;
  returned_model: string | null;
  latency_seconds: number | null;
  requested_model: string | null;
  completion_tokens: number | null;
  max_output_tokens: number | null;
  original_cost_usd: number | null;
  retrieval_snapshot_id: string | null;
};

export type AdjustmentProposal = {
  target_date?: string;
  delta_pct?: number;
  rationale?: string;
  evidence_ids?: string[];
  [key: string]: unknown;
};

export type EventAssessmentRecord = {
  pair: Pair;
  as_of: string;
  calls: GatewayCall[];
  config: Record<string, unknown>;
  status: "assessed" | "failed";
  context: {
    pair: Pair;
    as_of: string;
    is_example: boolean;
    daily: { origin: string; points: { day: number; date: string; q05: number; q50: number; q95: number }[] };
    weekly: { origin: string; points: { day: number; date: string; q05: number; q50: number; q95: number }[] };
    spots: { date: string; rate: number; available_at: string }[];
  };
  evidence: EvidenceItem[];
  assessment: EventAssessmentBody;
  created_at: string;
  error_code: string | null;
  expires_at: string;
  is_example: boolean;
  context_hash: string;
  assessment_id: string;
  prompt_version: string;
  prompt_snapshot: Record<string, string>;
  rejected_evidence: string[];
  validation_errors: string[];
  adjustment_preview: AdjustmentProposal[];
  publication_action: string;
  provider_final_text: string | null;
  memory_reference_map: Record<string, unknown>;
};

export type EventAssessmentRow = {
  assessment_id: string;
  pair: Pair;
  as_of: string;
  created_at: string;
  expires_at: string;
  is_example: boolean;
  status: "assessed" | "failed";
  record: EventAssessmentRecord;
  weekly_forecast_id: string | null;
  daily_forecast_id: string | null;
};

/* ------------------------------------------------------------- operations */

export type PipelineRun = {
  pipeline_run_id: string;
  run_key: string;
  deployment_name: string;
  deployment_version: string | null;
  scheduled_for: string;
  started_at: string;
  completed_at: string | null;
  state: "running" | "succeeded" | "failed" | "cancelled";
  result_summary: Record<string, unknown>;
  error_code: string | null;
};

export type LeaseJob = {
  key: string;
  claimed_at: string;
  lease_expires_at: string;
  state: "running" | "finished" | "failed";
  attempt_count: number;
  error_code: string | null;
  updated_at: string;
};

export type ProviderRun = {
  provider_run_id: string;
  provider: string;
  request_kind: "latest" | "historical" | "backfill";
  requested_for: string | null;
  started_at: string;
  completed_at: string | null;
  status: "running" | "succeeded" | "failed";
  row_count: number;
  error_code: string | null;
};

export type MaturedEvaluation = {
  evaluation_id: string;
  forecast_id: string;
  assessment_id: string | null;
  pair: Pair;
  horizon: number;
  target_date: string;
  observed_rate: number;
  base_rate: number;
  selected_rate: number | null;
  absolute_error: number;
  absolute_percentage_error: number;
  direction_correct: boolean | null;
  inside_central_90_interval: boolean;
  metric_version: string;
  evaluated_at: string;
};

export type ModelArtifact = {
  model_artifact_id: string;
  model_family: string;
  model_version: string;
  scope: string;
  artifact_uri: string;
  artifact_sha256: string;
  metrics: Record<string, unknown>;
  parameters: Record<string, unknown>;
  mlflow_run_id: string | null;
  trained_through: string | null;
  created_at: string;
};

export type ModelAliasPointer = {
  model_family: string;
  scope: string;
  alias: "candidate" | "champion" | "retired";
  model_artifact_id: string;
  approved_by: string;
  gate_report: Record<string, unknown>;
  updated_at: string;
};
