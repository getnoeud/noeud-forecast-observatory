export type EvaluationOverviewKpis = {
  matured_count: number;
  directional_hit_rate: number | null;
  mae: number | null;
  rmse: number | null;
  bias: number | null;
  mean_absolute_percentage_error: number | null;
  avg_sentiment_adjustment: number | null;
  quant_mae: number | null;
  adjusted_vs_quant_mae_delta: number | null;
  sentiment_improvement_rate: number | null;
};

export type EvaluationPairSummary = {
  currency_pair: string;
  matured_count: number;
  directional_hit_rate: number | null;
  mae: number | null;
  rmse: number | null;
  bias: number | null;
  mean_absolute_percentage_error: number | null;
  avg_sentiment_adjustment: number | null;
  quant_mae: number | null;
  adjusted_vs_quant_mae_delta: number | null;
  sentiment_improvement_rate: number | null;
};

export type EvaluationDailyPoint = {
  date: string;
  matured_count: number;
  directional_hit_rate: number | null;
  mae: number | null;
  rmse: number | null;
  bias: number | null;
};

export type EvaluationOverviewResponse = {
  horizon_days: number | null;
  from_date: string | null;
  to_date: string | null;
  supported_pairs: string[];
  selected_pairs: string[];
  kpis: EvaluationOverviewKpis;
  pair_leaderboard: EvaluationPairSummary[];
  daily_series: EvaluationDailyPoint[];
};

export type ForecastEvaluationItem = {
  public_id?: string | null;
  prediction_id: number;
  prediction_public_id?: string | null;
  currency_pair: string;
  horizon_days: number;
  forecast_date: string;
  target_date: string;
  resolved_actual_date: string;
  current_rate: number | null;
  predicted_rate: number;
  predicted_return: number | null;
  quant_forecast: number | null;
  actual_rate: number;
  signed_error: number;
  absolute_error: number;
  absolute_percentage_error: number | null;
  direction_correct: boolean | null;
  model_version: string;
  model_family: string | null;
  sentiment_score: number | null;
  sentiment_adjustment: number | null;
  quant_absolute_error: number | null;
  sentiment_beats_quant: boolean | null;
  evaluated_at: string | null;
};

export type DailyForecastPoint = {
  predicted_rate: number | null;
  confidence_lower: number | null;
  confidence_upper: number | null;
  predicted_return: number | null;
};

export type PredictionHistoryItem = {
  public_id: string | null;
  forecast_date: string;
  target_date: string;
  horizon_days: number;
  current_rate: number | null;
  predicted_return: number | null;
  predicted_rate: number;
  quant_forecast: number | null;
  confidence_lower: number | null;
  confidence_upper: number | null;
  sentiment_score: number | null;
  sentiment_adjustment: number | null;
  llm_rationale: string | null;
  model_version: string | null;
  model_family: string | null;
  daily_forecasts: Record<string, DailyForecastPoint> | null;
  actual_rate: number | null;
  error: number | null;
};

export type PredictionHistoryResponse = {
  currency_pair: string;
  predictions: PredictionHistoryItem[];
  total_count: number;
};

export type ForecastEvaluationHistoryResponse = {
  currency_pair: string;
  horizon_days: number | null;
  from_date: string | null;
  to_date: string | null;
  evaluations: ForecastEvaluationItem[];
  total_count: number;
};

export type WeeklyEvaluationSummary = {
  evaluation_count: number;
  directional_hit_rate: number | null;
  mae: number | null;
  rmse: number | null;
  bias: number | null;
  mean_absolute_percentage_error: number | null;
  avg_sentiment_adjustment: number | null;
  quant_mae: number | null;
  adjusted_vs_quant_mae_delta: number | null;
};

export type WeeklyEvaluationPairSummary = WeeklyEvaluationSummary & {
  currency_pair: string;
};

export type WeeklyEvaluationReportResponse = {
  week_start: string;
  week_end: string;
  horizon_days: number | null;
  available_pairs: string[];
  selected_pairs: string[];
  resolved_from_latest_data: boolean;
  overall: WeeklyEvaluationSummary;
  pairs: WeeklyEvaluationPairSummary[];
  generated_at: string;
};

export type SentimentResponse = {
  id: number | null;
  currency_pair: string;
  date: string;
  sentiment_score: number;
  confidence?: number | null;
  direction?: string | null;
  num_articles: number;
  top_positive: string[];
  top_negative: string[];
  rationale: string | null;
  market_narrative?: string | null;
  uncertainties?: string[];
  recommendation?: string | null;
  llm_raw_responses?: SentimentLLMInteraction[] | null;
  created_at: string | null;
};

export type SentimentSearchResult = {
  title?: string | null;
  url?: string | null;
  snippet?: string | null;
  source?: string | null;
  published_date?: string | null;
};

export type SentimentLLMInteraction = {
  role: string;
  model: string;
  response_raw: string;
  response_parsed?: Record<string, unknown> | null;
  search_results?: SentimentSearchResult[] | null;
  citations?: string[] | null;
  response_id?: string | null;
  finish_reason?: string | null;
  timestamp?: string | null;
  latency_ms?: number | null;
  prompt_redacted: boolean;
};

export type SentimentHistoryResponse = {
  currency_pair: string;
  sentiments: SentimentResponse[];
  total_count: number;
};
