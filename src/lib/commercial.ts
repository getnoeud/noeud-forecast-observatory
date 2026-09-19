import type { Pair } from "@/lib/types";

/**
 * Ghana bank rate cards: a separate measurement basis from the ExchangeRate-API
 * series the models are trained on. Nothing here is a forecast target — a bank
 * mean above the provider rate is a commercial spread, not a model error.
 */

export const BANKS = ["absa", "stanbic", "fnb", "gcb"] as const;
export type Bank = (typeof BANKS)[number];

export const BANK_LABELS: Record<string, string> = {
  absa: "Absa",
  stanbic: "Stanbic",
  fnb: "FNB",
  gcb: "GCB",
};

/**
 * Bank identity follows the validated categorical order from slot 2 onward;
 * slot 1 is reserved for the cross-bank mean so the aggregate never borrows a
 * bank's colour. A bank keeps its colour whatever else is toggled on.
 */
export const BANK_COLORS: Record<string, string> = {
  absa: "var(--chart-2)",
  stanbic: "var(--chart-3)",
  fnb: "var(--chart-4)",
  gcb: "var(--chart-5)",
};

export const MEAN_COLOR = "var(--chart-1)";

export const QUOTE_TYPES = [
  "transfer_selling",
  "transfer_buying",
  "cash_selling",
  "cash_buying",
  "indicative_selling",
  "indicative_buying",
] as const;
export type QuoteType = (typeof QUOTE_TYPES)[number];

export const QUOTE_TYPE_LABELS: Record<string, string> = {
  transfer_selling: "Transfer selling",
  transfer_buying: "Transfer buying",
  cash_selling: "Cash selling",
  cash_buying: "Cash buying",
  indicative_selling: "Indicative selling",
  indicative_buying: "Indicative buying",
};

/** Only this label enters the commercial mean (Absa transfer, Stanbic TT, FNB remittance). */
export const BENCHMARK_QUOTE_TYPE = "transfer_selling";

/** Minimum banks for the mean to count as a cross-bank benchmark. */
export const MIN_BENCHMARK_BANKS = 2;

export function bankLabel(bank: string): string {
  return BANK_LABELS[bank] ?? bank.toUpperCase();
}

export function bankColor(bank: string): string {
  return BANK_COLORS[bank] ?? "var(--muted-foreground)";
}

export type QuoteLike = {
  bank: string;
  pair: Pair;
  quote_type: string;
  observed_on: string;
  rate: number;
};

/** Banks that actually appear in the data, in the fixed identity order. */
export function banksPresent(quotes: QuoteLike[]): string[] {
  const seen = new Set(quotes.map((quote) => quote.bank));
  const known = BANKS.filter((bank) => seen.has(bank)) as string[];
  const unknown = Array.from(seen).filter((bank) => !known.includes(bank)).sort();
  return [...known, ...unknown];
}

export type BankSeriesRow = {
  date: string;
  provider: number | null;
  mean: number | null;
  median: number | null;
  range: [number, number] | null;
  bankCount: number;
  chronos: number | null;
  bootstrap: number | null;
} & Record<string, number | null | string | [number, number] | boolean>;

/**
 * One row per publication date: every bank's quote for the chosen label, the
 * cross-bank mean/median/range computed the same way the backend view does
 * (available banks only, never zero-filled), and the provider rate beside it.
 */
export function buildBankSeries(
  quotes: QuoteLike[],
  pair: Pair,
  quoteType: string,
  provider: Map<string, number>,
  models?: Map<string, { chronos: number | null; bootstrap: number | null }>,
): BankSeriesRow[] {
  const byDate = new Map<string, QuoteLike[]>();
  for (const quote of quotes) {
    if (quote.pair !== pair || quote.quote_type !== quoteType) continue;
    const list = byDate.get(quote.observed_on) ?? [];
    list.push(quote);
    byDate.set(quote.observed_on, list);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, list]) => {
      const rates = list.map((quote) => quote.rate).sort((a, b) => a - b);
      const mid = Math.floor(rates.length / 2);
      const median =
        rates.length % 2 ? rates[mid] : (rates[mid - 1] + rates[mid]) / 2;
      const row: BankSeriesRow = {
        date,
        provider: provider.get(date) ?? null,
        mean: rates.reduce((sum, rate) => sum + rate, 0) / rates.length,
        median,
        range: rates.length ? [rates[0], rates[rates.length - 1]] : null,
        bankCount: rates.length,
        chronos: models?.get(date)?.chronos ?? null,
        bootstrap: models?.get(date)?.bootstrap ?? null,
      };
      for (const quote of list) row[quote.bank] = quote.rate;
      return row;
    });
}

export type BankMargin = {
  bank: string;
  pair: Pair;
  observed_on: string;
  buying: number | null;
  selling: number | null;
  marginPct: number | null;
};

/**
 * The bank's own buy/sell spread on one channel, as a percentage of the mid.
 * This is the price of converting through that bank, independent of any model.
 */
export function bankMargins(
  quotes: QuoteLike[],
  channel: "transfer" | "cash",
): BankMargin[] {
  const key = (quote: QuoteLike) => `${quote.bank}|${quote.pair}|${quote.observed_on}`;
  const grouped = new Map<string, BankMargin>();
  for (const quote of quotes) {
    const isBuy = quote.quote_type === `${channel}_buying`;
    const isSell = quote.quote_type === `${channel}_selling`;
    if (!isBuy && !isSell) continue;
    const entry = grouped.get(key(quote)) ?? {
      bank: quote.bank,
      pair: quote.pair,
      observed_on: quote.observed_on,
      buying: null,
      selling: null,
      marginPct: null,
    };
    if (isBuy) entry.buying = quote.rate;
    if (isSell) entry.selling = quote.rate;
    grouped.set(key(quote), entry);
  }
  for (const entry of grouped.values()) {
    if (entry.buying !== null && entry.selling !== null) {
      const mid = (entry.buying + entry.selling) / 2;
      entry.marginPct = ((entry.selling - entry.buying) / mid) * 100;
    }
  }
  return Array.from(grouped.values());
}

export function pctDiff(value: number | null, base: number | null): number | null {
  if (value === null || base === null || base === 0) return null;
  return ((value - base) / base) * 100;
}

/**
 * Marker shape per bank. Banks routinely quote within a pesewa of each other
 * (and of the model median), so identity cannot rest on colour or position
 * alone: hollow markers of different shapes stay legible when they overlap.
 */
export const BANK_SHAPES: Record<string, "circle" | "square" | "diamond" | "triangle"> = {
  absa: "circle",
  stanbic: "square",
  fnb: "diamond",
  gcb: "triangle",
};

export function bankShape(bank: string) {
  return BANK_SHAPES[bank] ?? "circle";
}
