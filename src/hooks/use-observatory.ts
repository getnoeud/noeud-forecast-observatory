"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type {
  EvaluationOverviewResponse,
  ForecastEvaluationHistoryResponse,
  PredictionHistoryResponse,
  SentimentHistoryResponse,
  WeeklyEvaluationReportResponse,
} from "@/lib/types";

function compactParams(params: Record<string, string | number | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined) {
        return false;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== "";
    }),
  );
}

export function useEvaluationOverview(filters: {
  horizon: number;
  fromDate?: string;
  toDate?: string;
  currencyPairs?: string[];
}) {
  return useQuery({
    queryKey: ["evaluation-overview", filters],
    queryFn: async () => {
      const response = await api.get<EvaluationOverviewResponse>("/evaluation/overview", {
        params: compactParams({
          horizon: filters.horizon,
          from: filters.fromDate,
          to: filters.toDate,
          currency_pairs: filters.currencyPairs,
        }),
      });
      return response.data;
    },
  });
}

export function useEvaluationHistory(filters: {
  currencyPair: string;
  horizon: number;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["evaluation-history", filters],
    queryFn: async () => {
      const response = await api.get<ForecastEvaluationHistoryResponse>(
        `/evaluation/history/${filters.currencyPair}`,
        {
          params: compactParams({
            horizon: filters.horizon,
            from: filters.fromDate,
            to: filters.toDate,
            limit: filters.limit ?? 200,
          }),
        },
      );
      return response.data;
    },
  });
}

export function useWeeklyEvaluationReport(filters: {
  horizon: number;
  weekStart?: string;
  currencyPairs?: string[];
}) {
  return useQuery({
    queryKey: ["weekly-evaluation-report", filters],
    queryFn: async () => {
      const response = await api.get<WeeklyEvaluationReportResponse>("/evaluation/reports/weekly", {
        params: compactParams({
          horizon: filters.horizon,
          week_start: filters.weekStart,
          currency_pairs: filters.currencyPairs,
        }),
      });
      return response.data;
    },
  });
}

export function useSentimentHistory(currencyPair: string, limit = 30) {
  return useQuery({
    queryKey: ["sentiment-history", currencyPair, limit],
    queryFn: async () => {
      const response = await api.get<SentimentHistoryResponse>(`/sentiment/${currencyPair}/history`, {
        params: { limit },
      });
      return response.data;
    },
    enabled: currencyPair !== "ALL",
  });
}

export function usePredictionHistory(filters: {
  currencyPair: string;
  horizon: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["prediction-history", filters],
    queryFn: async () => {
      const response = await api.get<PredictionHistoryResponse>(
        `/forecast/history/${filters.currencyPair}`,
        {
          params: compactParams({
            horizon: filters.horizon,
            limit: filters.limit ?? 60,
          }),
        },
      );
      return response.data;
    },
    enabled: filters.currencyPair !== "ALL",
  });
}

