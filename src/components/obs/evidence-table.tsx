import { ExternalLinkIcon } from "lucide-react";

import {
  RelevanceBadge,
  SentimentBadge,
  VerificationBadge,
} from "@/components/obs/badges";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { formatDate, hostnameOf, titleCase } from "@/lib/format";
import type { EvidenceItem } from "@/lib/types";

/**
 * Every retrieved item the scorer was allowed to use, with the fields that
 * decide whether it should have been used: freshness, source type, the claimed
 * transmission mechanism, and what the model itself flagged as uncertain.
 */
export function EvidenceTable({
  evidence,
  citedIds,
}: {
  evidence: EvidenceItem[];
  citedIds?: string[];
}) {
  const cited = new Set(citedIds ?? []);

  return (
    <Accordion className="divide-y rounded-xl border">
      {evidence.map((item) => (
        <AccordionItem key={item.evidence_id} value={item.evidence_id} className="border-b-0 px-4">
          <AccordionTrigger className="py-3.5">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 pr-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border bg-muted/60 px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground">
                  {item.evidence_id}
                </span>
                {cited.has(item.evidence_id) ? (
                  <Badge variant="secondary" className="text-[0.65rem]">
                    cited
                  </Badge>
                ) : null}
                <RelevanceBadge relevance={item.relevance} />
                <SentimentBadge sentiment={item.sentiment} />
              </div>
              <span className="text-sm leading-snug font-medium">{item.title}</span>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-normal text-muted-foreground">
                <span>{item.publisher}</span>
                <span aria-hidden>·</span>
                <span>{formatDate(item.published_on ?? item.published_at)}</span>
                <span aria-hidden>·</span>
                <span className="font-mono">{titleCase(item.event_type)}</span>
                <span aria-hidden>·</span>
                <span className="font-mono">{titleCase(item.source_type)}</span>
              </span>
            </div>
          </AccordionTrigger>

          <AccordionContent className="space-y-4 pb-5">
            <p className="text-sm leading-relaxed text-muted-foreground">{item.summary}</p>

            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="eyebrow mb-1">Claimed transmission mechanism</p>
              <p className="text-sm leading-relaxed">{item.mechanism}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {item.established_facts?.length ? (
                <div>
                  <p className="eyebrow mb-1.5">Established facts</p>
                  <ul className="space-y-1.5">
                    {item.established_facts.map((fact, index) => (
                      <li
                        key={index}
                        className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                      >
                        <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--good)]" />
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {item.uncertainties?.length ? (
                <div>
                  <p className="eyebrow mb-1.5">Stated uncertainties</p>
                  <ul className="space-y-1.5">
                    {item.uncertainties.map((note, index) => (
                      <li
                        key={index}
                        className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                      >
                        <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--warning)]" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {item.continuing_relevance ? (
              <div className="rounded-lg border border-dashed p-3">
                <p className="eyebrow mb-1">Why an older item was still admitted</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {item.continuing_relevance}
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <VerificationBadge
                  status={item.source_verification?.status}
                  errorCode={item.source_verification?.error_code}
                />
                <span className="font-mono text-[0.68rem] text-muted-foreground">
                  date: {item.date_status}
                </span>
                {item.source_verification?.method ? (
                  <span className="font-mono text-[0.68rem] text-muted-foreground">
                    method: {item.source_verification.method}
                  </span>
                ) : null}
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {hostnameOf(item.url)}
                <ExternalLinkIcon className="size-3" />
              </a>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
