import "server-only";

import { cache } from "react";

import { buildTrackRows } from "@/lib/analytics";
import {
  getAllSeries,
  getBankQuoteLedger,
  getBankQuotes,
  getCommercialComparisons,
  getPairVintages,
  type BankQuote,
  type CommercialComparison,
} from "@/lib/server/queries";
import { bankMargins, banksPresent, type BankMargin } from "@/lib/commercial";
import { PAIRS, type Pair } from "@/lib/types";

export type ModelMedian = { date: string; chronos: number | null; bootstrap: number | null };

export type CommercialModel = {
  quotes: BankQuote[];
  ledger: BankQuote[];
  comparisons: CommercialComparison[];
  banks: string[];
  quoteTypes: string[];
  /** Provider (ExchangeRate-API) rate by date, per pair. */
  provider: Record<Pair, { date: string; rate: number }[]>;
  /** Latest-vintage model medians by target date, per pair. */
  models: Record<Pair, ModelMedian[]>;
  margins: { transfer: BankMargin[]; cash: BankMargin[] };
  latestDate: string | null;
};

/**
 * Everything the commercial-rate views need, in one round of reads. Model
 * medians come from the same walk-forward track as the Forward Forecast page,
 * so a bank quote is always compared with the forecast that was current for
 * that calendar date.
 */
export const getCommercialModel = cache(async (): Promise<CommercialModel> => {
  const [quotes, ledger, comparisons, series, ...vintages] = await Promise.all([
    getBankQuotes(400),
    getBankQuoteLedger(3000),
    getCommercialComparisons(3000),
    getAllSeries(400),
    ...PAIRS.map((pair) => getPairVintages(pair, 45)),
  ]);

  const provider = {} as Record<Pair, { date: string; rate: number }[]>;
  const models = {} as Record<Pair, ModelMedian[]>;

  PAIRS.forEach((pair, index) => {
    const history = series[pair] ?? [];
    provider[pair] = history.map((point) => ({ date: point.observed_on, rate: point.rate }));
    models[pair] = buildTrackRows(
      history,
      vintages[index].map((path) => ({
        kind: path.vintage.kind,
        origin: path.vintage.origin,
        points: path.points,
      })),
    ).map((row) => ({ date: row.date, chronos: row.chronos, bootstrap: row.bootstrap }));
  });

  const quoteTypes = Array.from(new Set(quotes.map((quote) => quote.quote_type)));
  const order = [
    "transfer_selling",
    "transfer_buying",
    "cash_selling",
    "cash_buying",
    "indicative_selling",
    "indicative_buying",
  ];
  quoteTypes.sort((a, b) => order.indexOf(a) - order.indexOf(b));

  return {
    quotes,
    ledger,
    comparisons,
    banks: banksPresent(quotes),
    quoteTypes,
    provider,
    models,
    margins: {
      transfer: bankMargins(quotes, "transfer"),
      cash: bankMargins(quotes, "cash"),
    },
    latestDate:
      quotes.reduce<string | null>(
        (latest, quote) => (latest === null || quote.observed_on > latest ? quote.observed_on : latest),
        null,
      ),
  };
});
