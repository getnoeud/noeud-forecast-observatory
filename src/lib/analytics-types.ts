export type { ForecastKind, ForecastPoint, Observation, Pair } from "@/lib/types";

/** Minimum shape the accuracy rollup needs, so it works on either ledger. */
export type RealizedPointLike = {
  horizon: number;
  target_date: string;
  signed_error: number;
  absolute_percentage_error: number;
  inside_90: boolean;
};
