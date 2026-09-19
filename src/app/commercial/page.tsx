import { ExternalLinkIcon, LandmarkIcon } from "lucide-react";

import {
  BankMarginChart,
  BankRatesChart,
  SpreadChart,
  type SpreadRow,
} from "@/components/charts/commercial-charts";
import { MonoTag, PairBadge, PairDot, StatusPill } from "@/components/obs/badges";
import { DataSourceError } from "@/components/obs/db-error";
import { PaginatedTable } from "@/components/obs/paginated-table";
import { PairSwitcher } from "@/components/obs/pair-switcher";
import {
  EmptyState,
  PageHeader,
  ReadingNote,
  SectionHeading,
  StatTile,
} from "@/components/obs/primitives";
import { Card, CardContent } from "@/components/ui/card";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import {
  bankColor,
  bankLabel,
  BENCHMARK_QUOTE_TYPE,
  MIN_BENCHMARK_BANKS,
  pctDiff,
  QUOTE_TYPE_LABELS,
} from "@/lib/commercial";
import {
  formatDate,
  formatDateTime,
  formatPercent,
  formatRate,
  formatSignedRate,
  hostnameOf,
  shortHash,
} from "@/lib/format";
import { getCommercialModel } from "@/lib/server/commercial-view";
import { isPair, PAIR_LABELS, PAIRS, type Pair } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CommercialPage({
  searchParams,
}: {
  searchParams: Promise<{ pair?: string }>;
}) {
  const params = await searchParams;
  const pair: Pair = isPair(params.pair) ? params.pair : "USDGHS";

  let model;
  try {
    model = await getCommercialModel();
  } catch (error) {
    return (
      <>
        <PageHeader eyebrow="Commercial market" title="Commercial Rates" />
        <DataSourceError error={error} />
      </>
    );
  }

  const { quotes, ledger, comparisons, banks, quoteTypes, provider, models, margins, latestDate } =
    model;

  if (!quotes.length) {
    return (
      <>
        <PageHeader
          eyebrow="Commercial market"
          title="Commercial Rates"
          description="Published Ghana bank rate cards, collected by the weekday midday cycle."
        />
        <EmptyState
          title="No bank quotes archived yet"
          description="The midday commercial cycle collects Absa, Stanbic and FNB rate cards at 12:00 Africa/Accra, Monday to Friday. Rows appear here after its first successful run."
          icon={<LandmarkIcon className="size-5" />}
        />
      </>
    );
  }

  const latestByPair = new Map(
    PAIRS.map((item) => [
      item,
      comparisons.find((row) => row.pair === item && row.observed_on === latestDate) ??
        comparisons.find((row) => row.pair === item) ??
        null,
    ]),
  );
  const current = latestByPair.get(pair) ?? null;
  const modelByDate = new Map(models[pair].map((row) => [row.date, row]));
  const currentModel = current ? modelByDate.get(current.observed_on) : undefined;

  // Spread over time, one column per pair.
  const spreadByDate = new Map<string, SpreadRow>();
  for (const row of comparisons) {
    if (row.exchange_rate_api_rate === null) continue;
    const entry = spreadByDate.get(row.observed_on) ?? { date: row.observed_on };
    entry[row.pair] = pctDiff(row.mean_transfer_selling_rate, row.exchange_rate_api_rate) ?? undefined;
    entry[`${row.pair}_n`] = row.bank_count;
    spreadByDate.set(row.observed_on, entry);
  }
  const spreadRows = Array.from(spreadByDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  // Latest rate-card matrix for the selected pair.
  const latestPairQuotes = quotes.filter(
    (quote) => quote.pair === pair && quote.observed_on === latestDate,
  );
  const matrixTypes = quoteTypes.filter((type) =>
    latestPairQuotes.some((quote) => quote.quote_type === type),
  );
  const cell = (bank: string, type: string) =>
    latestPairQuotes.find((quote) => quote.bank === bank && quote.quote_type === type)?.rate;
  const typeMean = (type: string) => {
    const rates = latestPairQuotes.filter((quote) => quote.quote_type === type).map((q) => q.rate);
    return rates.length ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : null;
  };
  const latestProvider =
    provider[pair].find((point) => point.date === latestDate)?.rate ?? null;

  const publicationDays = new Set(quotes.map((quote) => quote.observed_on)).size;
  const refetches = ledger.length - quotes.length;

  return (
    <>
      <PageHeader
        eyebrow="Commercial market"
        title="Commercial Rates"
        description="What Ghana's banks are actually publishing, beside the provider rate every model is trained on and the forecasts that covered the same dates. Collected by the weekday midday cycle at 12:00 Africa/Accra."
        actions={<PairSwitcher value={pair} />}
      />

      <div className="rounded-lg border border-dashed px-4 py-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground">A separate measurement basis.</strong> The models
          forecast the ExchangeRate-API series, not bank prices. A bank mean above the provider
          rate is a commercial markup, so <em>bank mean − forecast</em> mixes that spread with any
          forecast error and must never be read as model accuracy. Only transfer-selling quotes
          (Absa transfer, Stanbic TT, FNB remittance) enter the mean; cash and buying rates are
          archived as context. Quotes are indicative — Absa limits its card to purchases up to
          USD 5,000, and Stanbic notes amount and product can change the actual customer rate.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={`${pair} bank mean`}
          value={formatRate(current?.mean_transfer_selling_rate)}
          hint={
            current ? (
              <span className="flex flex-wrap items-center gap-1.5">
                {current.benchmark_eligible ? (
                  <StatusPill tone="good" label={`${current.bank_count} banks · benchmark`} />
                ) : (
                  <StatusPill
                    tone="warning"
                    label={`${current.bank_count} bank · below ${MIN_BENCHMARK_BANKS}-bank minimum`}
                  />
                )}
                <span>{formatDate(current.observed_on)}</span>
              </span>
            ) : (
              "No transfer-selling quotes for this pair"
            )
          }
          accent="var(--chart-1)"
        />
        <StatTile
          label="Provider rate, same date"
          value={formatRate(current?.exchange_rate_api_rate)}
          hint="ExchangeRate-API — the series the models are trained and scored on"
          accent="var(--foreground)"
        />
        <StatTile
          label="Commercial spread"
          value={formatPercent(
            pctDiff(current?.mean_transfer_selling_rate ?? null, current?.exchange_rate_api_rate ?? null),
            2,
            true,
          )}
          hint={`${formatSignedRate(current?.bank_mean_minus_provider)} GHS above the provider`}
          accent="var(--chart-2)"
        />
        <StatTile
          label="Bank spread (min – max)"
          value={
            current
              ? formatPercent(
                  pctDiff(current.max_transfer_selling_rate, current.min_transfer_selling_rate),
                  2,
                )
              : "—"
          }
          hint={
            current
              ? `${formatRate(current.min_transfer_selling_rate)} – ${formatRate(current.max_transfer_selling_rate)} · median ${formatRate(current.median_transfer_selling_rate)}`
              : undefined
          }
          accent="var(--chart-7)"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {PAIRS.map((item) => {
          const row = latestByPair.get(item);
          const itemModel = row ? models[item].find((m) => m.date === row.observed_on) : undefined;
          return (
            <Card key={item} className="gap-0 py-0">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <PairDot pair={item} />
                    {PAIR_LABELS[item]}
                  </span>
                  {row ? (
                    row.benchmark_eligible ? (
                      <StatusPill tone="good" label={`${row.bank_count} banks`} />
                    ) : (
                      <StatusPill tone="warning" label={`${row.bank_count} bank`} />
                    )
                  ) : null}
                </div>
                <dl className="grid grid-cols-3 gap-3">
                  <div>
                    <dt className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                      Bank mean
                    </dt>
                    <dd className="tnum mt-0.5 font-mono text-sm font-semibold">
                      {formatRate(row?.mean_transfer_selling_rate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                      Provider
                    </dt>
                    <dd className="tnum mt-0.5 font-mono text-sm">
                      {formatRate(row?.exchange_rate_api_rate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                      Chronos
                    </dt>
                    <dd className="tnum mt-0.5 font-mono text-sm">
                      {formatRate(itemModel?.chronos ?? null)}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs text-muted-foreground">
                  Spread{" "}
                  <span className="tnum font-mono text-foreground">
                    {formatPercent(
                      pctDiff(row?.mean_transfer_selling_rate ?? null, row?.exchange_rate_api_rate ?? null),
                      2,
                      true,
                    )}
                  </span>{" "}
                  over provider · {row ? formatDate(row.observed_on) : "—"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <BankRatesChart
        pair={pair}
        quotes={quotes}
        banks={banks}
        quoteTypes={quoteTypes}
        provider={provider[pair]}
        models={models[pair]}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <SpreadChart rows={spreadRows} />
        <BankMarginChart margins={margins} banks={banks} />
      </section>

      <section className="space-y-3">
        <SectionHeading
          title={`${pair} rate card — ${latestDate ? formatDate(latestDate) : "—"}`}
          description="Every label each bank published for the latest date, beside the cross-bank mean and the provider rate."
        />
        <Card>
          <CardContent>
            <PaginatedTable
              pageSize={10}
              label="rows"
              header={
                <TableRow>
                  <TableHead>Bank</TableHead>
                  {matrixTypes.map((type) => (
                    <TableHead key={type} className="text-right">
                      {QUOTE_TYPE_LABELS[type] ?? type}
                      {type === BENCHMARK_QUOTE_TYPE ? (
                        <MonoTag className="ml-1.5">mean</MonoTag>
                      ) : null}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Selling vs provider</TableHead>
                </TableRow>
              }
              rows={[
                ...banks
                  .filter((bank) => latestPairQuotes.some((quote) => quote.bank === bank))
                  .map((bank) => {
                    const selling = cell(bank, BENCHMARK_QUOTE_TYPE) ?? null;
                    return (
                      <TableRow key={bank}>
                        <TableCell>
                          <span className="flex items-center gap-2 text-xs font-medium">
                            <span
                              aria-hidden
                              className="inline-block size-2 rounded-[2px]"
                              style={{ background: bankColor(bank) }}
                            />
                            {bankLabel(bank)}
                          </span>
                        </TableCell>
                        {matrixTypes.map((type) => {
                          const value = cell(bank, type);
                          return (
                            <TableCell key={type} className="tnum text-right font-mono text-xs">
                              {value === undefined ? (
                                <span className="text-muted-foreground">—</span>
                              ) : (
                                formatRate(value)
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="tnum text-right font-mono text-xs">
                          {formatPercent(pctDiff(selling, latestProvider), 2, true)}
                        </TableCell>
                      </TableRow>
                    );
                  }),
                <TableRow key="__mean" className="bg-muted/40 font-semibold">
                  <TableCell className="text-xs">Cross-bank mean</TableCell>
                  {matrixTypes.map((type) => (
                    <TableCell key={type} className="tnum text-right font-mono text-xs">
                      {formatRate(typeMean(type))}
                    </TableCell>
                  ))}
                  <TableCell className="tnum text-right font-mono text-xs">
                    {formatPercent(pctDiff(typeMean(BENCHMARK_QUOTE_TYPE), latestProvider), 2, true)}
                  </TableCell>
                </TableRow>,
                <TableRow key="__provider">
                  <TableCell className="text-xs text-muted-foreground">
                    Provider (model input)
                  </TableCell>
                  {matrixTypes.map((type) => (
                    <TableCell
                      key={type}
                      className="tnum text-right font-mono text-xs text-muted-foreground"
                    >
                      {formatRate(latestProvider)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right text-xs text-muted-foreground">—</TableCell>
                </TableRow>,
              ]}
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionHeading
          title={`Bank benchmark vs provider vs forecast (${comparisons.length})`}
          description="The backend's own comparison view, one row per pair and publication date, with the latest-vintage model medians alongside."
        />
        <Card>
          <CardContent>
            <PaginatedTable
              pageSize={10}
              label="comparisons"
              header={
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Pair</TableHead>
                  <TableHead className="text-right">Banks</TableHead>
                  <TableHead className="text-right">Mean</TableHead>
                  <TableHead className="text-right">Median</TableHead>
                  <TableHead className="text-right">Min – max</TableHead>
                  <TableHead className="text-right">Provider</TableHead>
                  <TableHead className="text-right">Spread</TableHead>
                  <TableHead className="text-right">Chronos</TableHead>
                  <TableHead className="text-right">Bootstrap</TableHead>
                  <TableHead className="text-right">Mean − Chronos</TableHead>
                  <TableHead className="text-right">Issued Chronos</TableHead>
                </TableRow>
              }
              rows={comparisons.map((row) => {
                const medians = models[row.pair].find((m) => m.date === row.observed_on);
                return (
                  <TableRow key={`${row.pair}-${row.observed_on}`}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatDate(row.observed_on)}
                    </TableCell>
                    <TableCell>
                      <PairBadge pair={row.pair} />
                    </TableCell>
                    <TableCell className="text-right">
                      {row.benchmark_eligible ? (
                        <StatusPill tone="good" label={String(row.bank_count)} />
                      ) : (
                        <StatusPill tone="warning" label={String(row.bank_count)} />
                      )}
                    </TableCell>
                    <TableCell className="tnum text-right font-mono text-xs font-semibold">
                      {formatRate(row.mean_transfer_selling_rate)}
                    </TableCell>
                    <TableCell className="tnum text-right font-mono text-xs">
                      {formatRate(row.median_transfer_selling_rate)}
                    </TableCell>
                    <TableCell className="tnum text-right font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {formatRate(row.min_transfer_selling_rate)} – {formatRate(row.max_transfer_selling_rate)}
                    </TableCell>
                    <TableCell className="tnum text-right font-mono text-xs">
                      {formatRate(row.exchange_rate_api_rate)}
                    </TableCell>
                    <TableCell className="tnum text-right font-mono text-xs">
                      {formatPercent(
                        pctDiff(row.mean_transfer_selling_rate, row.exchange_rate_api_rate),
                        2,
                        true,
                      )}
                    </TableCell>
                    <TableCell className="tnum text-right font-mono text-xs">
                      {formatRate(medians?.chronos ?? null)}
                    </TableCell>
                    <TableCell className="tnum text-right font-mono text-xs">
                      {formatRate(medians?.bootstrap ?? null)}
                    </TableCell>
                    <TableCell className="tnum text-right font-mono text-xs">
                      {formatPercent(
                        pctDiff(row.mean_transfer_selling_rate, medians?.chronos ?? null),
                        2,
                        true,
                      )}
                    </TableCell>
                    <TableCell className="tnum text-right font-mono text-xs text-muted-foreground">
                      {formatRate(row.weekly_chronos_q50)}
                    </TableCell>
                  </TableRow>
                );
              })}
            />
          </CardContent>
        </Card>
        <ReadingNote>
          <strong>Chronos</strong> is the median from whichever weekly vintage most recently
          covered that date, reconstructed or issued. <strong>Issued Chronos</strong> is the
          backend view&apos;s stricter column: it only scores a vintage genuinely issued before the
          bank quotes were fetched, so a reconstructed week shows a dash there by design.
          {current && currentModel?.chronos === null
            ? " No weekly vintage covered the latest date."
            : null}
        </ReadingNote>
      </section>

      <section className="space-y-3">
        <SectionHeading
          title={`Quote ledger (${ledger.length} archived rows)`}
          description="Every parsed rate as archived, with its source document and acquisition time. Append-only: a revised or re-fetched document is a new row, never an edit."
        />
        <Card>
          <CardContent>
            <PaginatedTable
              pageSize={25}
              label="quotes"
              header={
                <TableRow>
                  <TableHead>Published</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Pair</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead>Fetched</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              }
              rows={ledger.map((row) => (
                <TableRow key={row.quote_id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {formatDate(row.observed_on)}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2 text-xs">
                      <span
                        aria-hidden
                        className="inline-block size-2 rounded-[2px]"
                        style={{ background: bankColor(row.bank) }}
                      />
                      {bankLabel(row.bank)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <PairBadge pair={row.pair} />
                  </TableCell>
                  <TableCell className="text-xs">
                    {QUOTE_TYPE_LABELS[row.quote_type] ?? row.quote_type}
                    {row.quote_type === BENCHMARK_QUOTE_TYPE ? (
                      <MonoTag className="ml-1.5">mean</MonoTag>
                    ) : null}
                  </TableCell>
                  <TableCell className="tnum text-right font-mono text-xs font-semibold">
                    {formatRate(row.rate)}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                    {formatDateTime(row.fetched_at)}
                  </TableCell>
                  <TableCell className="font-mono text-[0.68rem] text-muted-foreground">
                    {shortHash(row.source_sha256, 10)}
                  </TableCell>
                  <TableCell>
                    <a
                      href={row.source_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      {hostnameOf(row.source_url)}
                      <ExternalLinkIcon className="size-3" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            />
          </CardContent>
        </Card>
        <ReadingNote>
          {publicationDays} publication date{publicationDays === 1 ? "" : "s"} across{" "}
          {banks.length} bank{banks.length === 1 ? "" : "s"}.{" "}
          {refetches > 0
            ? `${refetches} row${refetches === 1 ? " is a re-fetch" : "s are re-fetches"} of a document already archived — the charts and means use only the latest acquisition per bank, pair, label and date.`
            : "No document has been fetched more than once."}{" "}
          GCB is not in the benchmark: its page redirects in the managed runtime and publishes
          generic buying/selling rather than an explicit transfer-selling label.
        </ReadingNote>
      </section>
    </>
  );
}
