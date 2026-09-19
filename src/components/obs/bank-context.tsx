import { ExternalLinkIcon, LandmarkIcon } from "lucide-react";

import { MonoTag, StatusPill } from "@/components/obs/badges";
import { PaginatedTable } from "@/components/obs/paginated-table";
import { ReadingNote, SectionHeading } from "@/components/obs/primitives";
import { Card, CardContent } from "@/components/ui/card";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import {
  BENCHMARK_QUOTE_TYPE,
  bankColor,
  bankLabel,
  MIN_BENCHMARK_BANKS,
  pctDiff,
  QUOTE_TYPE_LABELS,
} from "@/lib/commercial";
import { formatDate, formatDateTime, formatPercent, formatRate, hostnameOf } from "@/lib/format";
import type { EventAssessmentRecord } from "@/lib/types";

/**
 * The bank rate cards the scorer actually saw. Only quotes fetched before the
 * analyst cutoff and published for the same date are supplied, so this is
 * exactly the commercial evidence the decision could have used — nothing added
 * afterwards.
 */
export function BankContextCard({ record }: { record: EventAssessmentRecord }) {
  const market = record.context.commercial_market;
  const latestSpot = record.context.spots.at(-1);

  if (!market) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3">
          <LandmarkIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">No bank quotes in this assessment&apos;s context</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Prompt <MonoTag>{record.prompt_version}</MonoTag> ran before same-day Ghana bank
              quotes were part of the decision packet. From <MonoTag>events-v2.8</MonoTag> the
              assessment runs in the weekday 12:00 Africa/Accra cycle, after bank collection,
              and the quotes it saw appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const quotes = market.quotes ?? [];
  const selling = quotes.filter((quote) => quote.quote_type === BENCHMARK_QUOTE_TYPE);
  const bankCount = market.bank_count ?? selling.length;
  const mean = market.mean_transfer_selling_rate ?? null;
  const spread = pctDiff(mean, latestSpot?.rate ?? null);

  return (
    <Card>
      <CardContent className="space-y-4">
        <SectionHeading
          title="Bank quotes supplied to the scorer"
          description={`Same-date rate cards acquired before the ${formatDateTime(record.as_of)} cutoff.`}
        />
        <div className="flex flex-wrap items-center gap-2">
          {bankCount >= MIN_BENCHMARK_BANKS ? (
            <StatusPill tone="good" label={`${bankCount} banks · benchmark`} />
          ) : (
            <StatusPill
              tone="warning"
              label={`${bankCount} bank${bankCount === 1 ? "" : "s"} · below ${MIN_BENCHMARK_BANKS}-bank minimum`}
            />
          )}
          <MonoTag>published {formatDate(market.observed_on ?? null)}</MonoTag>
          <MonoTag>mean {formatRate(mean)}</MonoTag>
          {spread !== null ? (
            <MonoTag>
              {formatPercent(spread, 2, true)} vs latest spot {formatRate(latestSpot?.rate)}
            </MonoTag>
          ) : null}
        </div>

        {quotes.length ? (
          <PaginatedTable
            pageSize={10}
            label="quotes"
            header={
              <TableRow>
                <TableHead>Bank</TableHead>
                <TableHead>Label</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead>Fetched</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            }
            rows={quotes.map((quote, index) => (
              <TableRow key={`${quote.bank}-${quote.quote_type}-${index}`}>
                <TableCell>
                  <span className="flex items-center gap-2 text-xs">
                    <span
                      aria-hidden
                      className="inline-block size-2 rounded-[2px]"
                      style={{ background: bankColor(quote.bank) }}
                    />
                    {bankLabel(quote.bank)}
                  </span>
                </TableCell>
                <TableCell className="text-xs">
                  {QUOTE_TYPE_LABELS[quote.quote_type] ?? quote.quote_type}
                  {quote.quote_type === BENCHMARK_QUOTE_TYPE ? (
                    <MonoTag className="ml-1.5">mean</MonoTag>
                  ) : null}
                </TableCell>
                <TableCell className="tnum text-right font-mono text-xs font-semibold">
                  {formatRate(quote.rate)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDateTime(quote.fetched_at)}
                </TableCell>
                <TableCell>
                  <a
                    href={quote.source_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {hostnameOf(quote.source_url)}
                    <ExternalLinkIcon className="size-3" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            The packet carried a bank section but no quote had been published for this date by
            the cutoff — an explicit gap, not a carried-forward rate.
          </p>
        )}

        <ReadingNote>
          {market.limitation ??
            "Indicative bank quotes are not executable customer rates and differ by amount and product."}{" "}
          The scorer is told to use these to explain the spread between bank prices and the
          model median, not to shift the immutable forecast.
        </ReadingNote>
      </CardContent>
    </Card>
  );
}
