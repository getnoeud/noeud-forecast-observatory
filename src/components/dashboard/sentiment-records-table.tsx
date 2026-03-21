"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  BadgeInfo,
  BrainCircuit,
  ExternalLink,
  FileSearch,
  Link2,
  ListTree,
  Shield,
} from "lucide-react";

import { PaginatedDataTable } from "@/components/dashboard/paginated-data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatNumber } from "@/lib/format";
import type { SentimentLLMInteraction, SentimentResponse } from "@/lib/types";

function compactFactors(items: string[]): string {
  if (items.length === 0) {
    return "--";
  }
  return items.slice(0, 2).join(" | ");
}

function prettyJson(value: Record<string, unknown> | null | undefined): string {
  if (!value) {
    return "--";
  }
  return JSON.stringify(value, null, 2);
}

function renderSimpleStrongText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    const match = /^\*\*(.*)\*\*$/.exec(part);
    if (match) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-foreground">
          {match[1]}
        </strong>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function InteractionCard({
  interaction,
}: {
  interaction: SentimentLLMInteraction;
}) {
  const isRetrievalInteraction = interaction.role === "news_retrieval";

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{interaction.role}</Badge>
        <Badge variant="secondary">{interaction.model}</Badge>
        {interaction.prompt_redacted ? (
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            Prompt hidden
          </Badge>
        ) : null}
        {interaction.response_id ? (
          <Badge variant="outline" className="font-mono text-[10px]">
            {interaction.response_id}
          </Badge>
        ) : null}
        {interaction.finish_reason ? (
          <Badge variant="outline">finish: {interaction.finish_reason}</Badge>
        ) : null}
        {interaction.latency_ms !== null &&
        interaction.latency_ms !== undefined ? (
          <Badge variant="outline">{interaction.latency_ms}ms</Badge>
        ) : null}
      </div>

      {interaction.timestamp ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Captured: {formatDate(interaction.timestamp)}
        </p>
      ) : null}

      {interaction.search_results && interaction.search_results.length > 0 ? (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileSearch className="h-4 w-4" />
            Source Results
          </div>
          <div className="space-y-3">
            {interaction.search_results.map((result, index) => (
              <div
                key={`${result.url ?? result.title ?? index}`}
                className="rounded-md border p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {result.title ?? "Untitled source"}
                    </p>
                    {result.source ? (
                      <p className="text-xs text-muted-foreground">
                        {result.source}
                      </p>
                    ) : null}
                  </div>
                  {result.url ? (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Open <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
                {result.snippet ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {result.snippet}
                  </p>
                ) : null}
                {result.published_date ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Published: {result.published_date}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {interaction.citations && interaction.citations.length > 0 ? (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Link2 className="h-4 w-4" />
            Citations
          </div>
          <div className="flex flex-wrap gap-2">
            {interaction.citations.map((citation) => (
              <a
                key={citation}
                href={citation}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-primary hover:bg-muted"
              >
                Source <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {isRetrievalInteraction ? (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BrainCircuit className="h-4 w-4" />
            Raw Model Output
          </div>
          <div className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
            {interaction.response_raw
              ? renderSimpleStrongText(interaction.response_raw)
              : "--"}
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BrainCircuit className="h-4 w-4" />
              Raw Model Output
            </div>
            <div className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
              {interaction.response_raw
                ? renderSimpleStrongText(interaction.response_raw)
                : "--"}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ListTree className="h-4 w-4" />
              Parsed Output
            </div>
            <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
              {prettyJson(interaction.response_parsed)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function SentimentRecordDialog({
  sentiment,
  open,
  onOpenChange,
}: {
  sentiment: SentimentResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!sentiment) {
    return null;
  }

  const uncertaintyItems =
    sentiment.uncertainties && sentiment.uncertainties.length > 0
      ? sentiment.uncertainties
      : ["--"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            Sentiment Review | {sentiment.currency_pair} |{" "}
            {formatDate(sentiment.date)}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="mt-1 text-2xl font-semibold">
              {formatNumber(sentiment.sentiment_score, 2)}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Confidence</p>
            <p className="mt-1 text-2xl font-semibold">
              {formatNumber(sentiment.confidence, 2)}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Direction</p>
            <p className="mt-1 text-2xl font-semibold">
              {sentiment.direction ?? "--"}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Recommendation</p>
            <p className="mt-1 text-2xl font-semibold">
              {sentiment.recommendation ?? "--"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <BadgeInfo className="h-4 w-4" />
              Safe audit view
            </div>
            <p className="mt-1">
              This view shows stored LLM outputs, parsed scoring metadata, and
              retrieval source links when available. Prompts are intentionally
              redacted from the API response so internal scoring instructions
              are not exposed in the UI.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium">Rationale</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {sentiment.rationale ?? "--"}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium">Market Narrative</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {sentiment.market_narrative ?? "--"}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium">Top Positive Factors</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {(sentiment.top_positive.length > 0
                  ? sentiment.top_positive
                  : ["--"]
                ).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium">Top Negative Factors</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {(sentiment.top_negative.length > 0
                  ? sentiment.top_negative
                  : ["--"]
                ).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium">Uncertainties</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {uncertaintyItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">LLM Interaction Audit</h3>
            {sentiment.llm_raw_responses &&
            sentiment.llm_raw_responses.length > 0 ? (
              <div className="space-y-4">
                {sentiment.llm_raw_responses.map((interaction, index) => (
                  <InteractionCard
                    key={`${interaction.role}-${interaction.model}-${interaction.timestamp ?? index}`}
                    interaction={interaction}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No raw interaction details were returned for this record.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SentimentRecordsTable({
  sentiments,
}: {
  sentiments: SentimentResponse[];
}) {
  const [selectedSentiment, setSelectedSentiment] =
    useState<SentimentResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const columns = useMemo<ColumnDef<SentimentResponse>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {formatDate(row.original.date)}
          </span>
        ),
      },
      {
        accessorKey: "sentiment_score",
        header: "Score",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {formatNumber(row.original.sentiment_score, 2)}
          </span>
        ),
      },
      {
        accessorKey: "direction",
        header: "Direction",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.direction ?? "--"}
          </span>
        ),
      },
      {
        accessorKey: "top_positive",
        header: "Top Positive",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {compactFactors(row.original.top_positive)}
          </span>
        ),
      },
      {
        accessorKey: "top_negative",
        header: "Top Negative",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {compactFactors(row.original.top_negative)}
          </span>
        ),
      },
      {
        id: "details",
        header: "Details",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedSentiment(row.original);
              setDialogOpen(true);
            }}
          >
            Review
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Records</CardTitle>
          <CardDescription>
            Review stored sentiment outputs, rationale, and sanitized LLM audit
            traces for this pair.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <PaginatedDataTable
            columns={columns}
            data={sentiments}
            emptyMessage="No stored sentiment rows for this pair yet."
            defaultPageSize={10}
            pageSizeOptions={[10, 20, 30, 50]}
            initialSorting={[{ id: "date", desc: true }]}
          />
        </CardContent>
      </Card>

      <SentimentRecordDialog
        sentiment={selectedSentiment}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
