"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatNumber } from "@/lib/format";
import type { SentimentResponse } from "@/lib/types";

function compactFactors(items: string[]): string {
  if (items.length === 0) {
    return "--";
  }
  return items.slice(0, 2).join(" | ");
}

export function SentimentRecordsTable({
  sentiments,
}: {
  sentiments: SentimentResponse[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Records</CardTitle>
        <CardDescription>
          Raw sentiment entries stored for this pair, kept alongside the model
          evaluation view for auditability.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>Top Positive</TableHead>
                <TableHead>Top Negative</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sentiments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No stored sentiment rows for this pair yet.
                  </TableCell>
                </TableRow>
              ) : (
                sentiments.map((sentiment) => (
                  <TableRow key={`${sentiment.currency_pair}-${sentiment.date}`}>
                    <TableCell className="font-mono text-xs">
                      {formatDate(sentiment.date)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatNumber(sentiment.sentiment_score, 2)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {sentiment.num_articles}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {compactFactors(sentiment.top_positive)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {compactFactors(sentiment.top_negative)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
