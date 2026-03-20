"use client";

import { create } from "zustand";

import { daysAgo, toDateInputValue } from "@/lib/format";

type ObservatoryState = {
  horizon: number;
  pair: string;
  fromDate: string;
  toDate: string;
  comparisonMode: "error" | "direction";
  setHorizon: (horizon: number) => void;
  setPair: (pair: string) => void;
  setFromDate: (value: string) => void;
  setToDate: (value: string) => void;
  setComparisonMode: (value: "error" | "direction") => void;
  resetWindow: () => void;
};

export const useObservatoryStore = create<ObservatoryState>((set) => ({
  horizon: 7,
  pair: "ALL",
  fromDate: daysAgo(60),
  toDate: toDateInputValue(new Date()),
  comparisonMode: "error",
  setHorizon: (horizon) => set({ horizon }),
  setPair: (pair) => set({ pair }),
  setFromDate: (fromDate) => set({ fromDate }),
  setToDate: (toDate) => set({ toDate }),
  setComparisonMode: (comparisonMode) => set({ comparisonMode }),
  resetWindow: () =>
    set({
      fromDate: daysAgo(60),
      toDate: toDateInputValue(new Date()),
    }),
}));

