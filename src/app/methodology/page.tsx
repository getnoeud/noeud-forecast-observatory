import { MonoTag } from "@/components/obs/badges";
import { PipelineDiagram } from "@/components/obs/pipeline-diagram";
import {
  PageHeader,
  ReadingNote,
  SectionHeading,
} from "@/components/obs/primitives";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = {
  title: "Methodology · Noeud Forecast Observatory",
};

const GATE_DIMENSIONS = [
  {
    dimension: "Probabilistic skill",
    check: "Mean pinball and approximate CRPS improve on the declared benchmark",
    why: "A point forecast can look good while its whole distribution is poor",
  },
  {
    dimension: "Point accuracy",
    check: "Median MAE/MASE and RMSE stay within bounds",
    why: "Quantile averages can hide a weak median",
  },
  {
    dimension: "Pair stability",
    check: "Each of the three pairs passes its own minimum skill and non-regression limits",
    why: "A large failure on one pair must not be averaged away",
  },
  {
    dimension: "Horizon stability",
    check: "Day 1–7, 8–14, 15–21 and 22–30 cohorts each pass",
    why: "Long-horizon failure can hide behind strong short horizons",
  },
  {
    dimension: "Calibration",
    check: "80% and 90% coverage fall inside versioned tolerances with bounded width",
    why: "Very wide intervals can achieve coverage without being useful",
  },
  {
    dimension: "Bias",
    check: "Signed error stays bounded per pair and per cohort",
    why: "Persistent over- or under-prediction distorts downstream exposure estimates",
  },
  {
    dimension: "Output validity",
    check: "Positive rates, all horizons 1–30, all quantiles, no crossing",
    why: "API completeness is non-negotiable",
  },
  {
    dimension: "Reproducibility",
    check: "Dataset, config and code hashes present, and serialised replay passes",
    why: "An unreproducible result cannot be promoted",
  },
  {
    dimension: "Operations",
    check: "Inference latency, bundle size and batch cost meet limits",
    why: "A more accurate model may be impractical to operate",
  },
  {
    dimension: "Holdout / live evidence",
    check: "Approved holdout evaluation and the required shadow vintages exist",
    why: "Backtest success alone is not production evidence",
  },
];

const GLOSSARY = [
  {
    term: "Vintage",
    body: "One immutable forecast for one pair, one model family and one origin date, covering all thirty target dates. A corrected forecast is a new revision that names its parent — never an edit.",
  },
  {
    term: "Origin",
    body: "The date the forecast was made from. Day 1 is the first calendar day after the origin. Two vintages with different origins can cover the same target date at different horizons.",
  },
  {
    term: "Quantile (q05, q50, q95 …)",
    body: "The value the model expects the rate to fall below with that probability. q50 is the median; the gap between q05 and q95 is the central 90% interval. The schema enforces that quantiles never cross.",
  },
  {
    term: "Interval width",
    body: "(q95 − q05) ÷ q50, as a percentage. It is the model's own statement of how uncertain it is at that horizon, expressed relative to the level so the three pairs are comparable.",
  },
  {
    term: "Skew",
    body: "How much of the 90% interval sits above the median. Positive means a longer upside tail — more room for the cedi to weaken than to firm.",
  },
  {
    term: "Coverage",
    body: "Share of matured target dates whose realised rate landed inside the 90% interval. Well above 90% means the intervals are wider than they need to be; well below means they are overconfident.",
  },
  {
    term: "Bias",
    body: "Mean signed error (median − realised). Distinct from absolute error: a model can be accurate on average and still lean consistently in one direction.",
  },
  {
    term: "Provenance: issued vs reconstructed",
    body: "An issued vintage was produced live on its origin date. A reconstructed one was rebuilt later from the exact recorded inputs — hash-verified and legitimate, but not evidence of live operational behaviour on that date.",
  },
  {
    term: "Shadow mode",
    body: "A publication snapshot that records what the policy would have selected, without being a customer deliverable. Approving one requires a named, accountable approver.",
  },
  {
    term: "Decision packet",
    body: "The deterministic input given to the scorer: the next seven common target dates in detail, checkpoints at days 14, 21 and 30, path statistics, the latest five spot observations, and the weekly forecast errors already observed.",
  },
];

export default function MethodologyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Reference"
        title="Methodology"
        description="How every number on this dashboard is produced, and what each one is and is not allowed to claim."
      />

      <Card>
        <CardContent className="space-y-5">
          <SectionHeading
            title="What this system forecasts"
            description="Probabilistic 30-calendar-day forecasts of USD/GHS, EUR/GHS and GBP/GHS."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="eyebrow mb-2">In scope</p>
              <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                <li>Market-data ingestion and validation</li>
                <li>Quantitative forecasting and quantile calibration</li>
                <li>Event-aware adjustment proposals and their evidence</li>
                <li>Evaluation, scheduling and model lineage</li>
                <li>Delivery of one approved path through a versioned read API</li>
              </ul>
            </div>
            <div className="rounded-xl border border-dashed p-4">
              <p className="eyebrow mb-2">Explicitly out of scope</p>
              <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                <li>Invoice OCR and document handling</li>
                <li>Exposure calculations, VaR and CFaR</li>
                <li>Customer risk tolerance</li>
                <li>The product dashboard</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5">
          <SectionHeading
            title="The daily cycle"
            description="One dependency-ordered flow, so no downstream step depends on a guessed time gap between schedules."
          />
          <PipelineDiagram />
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="space-y-4">
            <SectionHeading
              title="Two model families, on purpose"
              description="They answer different questions and are compared by target date, never by horizon index."
            />
            <div className="space-y-4">
              <div className="rounded-xl border p-4">
                <p className="text-sm font-medium">Weekly — Chronos-2 zero-shot</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  A pretrained time-series foundation model, used without fine-tuning, with a
                  2,048-day context and cross-learning across the three pairs. Quantiles are
                  calibrated forward-only per horizon cohort at half strength. The weights are
                  pinned by revision and SHA-256 and verified before every inference, so a path
                  can be replayed exactly.
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm font-medium">Daily — block bootstrap</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  1,000 paths resampled in seven-day blocks from the trailing three years of the
                  pair&apos;s own returns. Block resampling preserves short runs of momentum that
                  an independent draw would destroy. It is re-issued every day, and it is the
                  benchmark the Chronos release gate had to beat.
                </p>
              </div>
            </div>
            <ReadingNote>
              On the single frozen holdout, Chronos-2 version 1 scored a pinball loss of 0.064432
              against block bootstrap&apos;s 0.058403 — 10.32% worse — despite a 0.58% better
              median MAE. That is a failed gate, and it is why no champion alias exists.
            </ReadingNote>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <SectionHeading
              title="Reading the fan chart"
              description="The fan is the forecast. The median line is only its centre."
            />
            <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>
                <strong className="text-foreground">Shading is probability mass.</strong> The
                darkest band is the middle 50% of the distribution; each paler band adds a
                further slice out to the 98% interval.
              </li>
              <li>
                <strong className="text-foreground">The fan should widen.</strong> A flat fan at
                day 30 would mean the model is not admitting the extra distance. A sudden step at
                one horizon usually points at a calibration cohort boundary, not the market.
              </li>
              <li>
                <strong className="text-foreground">The observed line continues through it.</strong>{" "}
                Target dates that have already matured stay on the observed series, drawn inside
                the fan, so a forecast being wrong is visible immediately rather than at the end
                of the month.
              </li>
              <li>
                <strong className="text-foreground">The origin marker matters.</strong>{" "}
                Everything left of it is realised; everything right of it was unknown when the
                vintage was issued.
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="space-y-5">
          <SectionHeading
            title="Event intelligence and its bounds"
            description="Two explicit calls per pair per day, with deterministic gates on both sides of the model."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                title: "1 · Retrieval",
                body: "A time-bounded news search through a search-capable model. Its output is a constrained schema: title, publisher, publication date, source type, relevance, sentiment towards the cedi, the claimed transmission mechanism, established facts and stated uncertainties.",
              },
              {
                title: "2 · Gates",
                body: "URLs are corroborated and allowlisted official sources are date-verified. Items outside the hard lookback are rejected outright; items outside the priority window survive only if the model argues the event is still materially active.",
              },
              {
                title: "3 · Analysis",
                body: "A structured scorer reads the surviving evidence alongside the deterministic decision packet and returns hold, monitor, or review_adjustment — with a rationale, counter-evidence, watch items, and any proposed per-date deltas.",
              },
            ].map((step) => (
              <div key={step.title} className="rounded-xl border p-4">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-dashed p-4">
            <p className="eyebrow mb-2">Hard limits the implementation enforces</p>
            <ul className="grid gap-2 text-sm leading-relaxed text-muted-foreground sm:grid-cols-2">
              <li>
                Each delta is a signed percentage of the <strong>Monday median for its own
                target date</strong>.
              </li>
              <li>
                Absolute deltas above 5% are rejected. That ceiling is an engineering guard, not
                a calibrated production limit.
              </li>
              <li>
                Duplicate dates, retrospective dates, dates outside the current Monday–Sunday
                week, and unsupported citations are all rejected.
              </li>
              <li>
                The shadow policy selects the event candidate only when the absolute delta is{" "}
                <strong>strictly greater than 1%</strong>. Exactly 1% does not qualify.
              </li>
              <li>
                <strong>No quantile interval is ever shifted or invented by the model.</strong>{" "}
                Only the selected point rate can move.
              </li>
              <li>
                Every assessment keeps <MonoTag>publication_action: retain_base</MonoTag>.
                Approval is a separate step with a named approver.
              </li>
            </ul>
          </div>

          <ReadingNote>
            Each pair is a separate assessment with its own search and analysis call — six
            gateway calls for one full daily cycle. Memory is filtered by pair and never merged,
            and the prompts distinguish the Federal Reserve, the ECB and the Bank of England
            while retaining Ghana developments common to all three.
          </ReadingNote>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <SectionHeading
            title="The model gate"
            description="Ten dimensions that pass or fail separately. One aggregate score would let a strength in one area hide a real failure in another."
          />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">Dimension</TableHead>
                  <TableHead>Example check</TableHead>
                  <TableHead>Why it is separate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {GATE_DIMENSIONS.map((row) => (
                  <TableRow key={row.dimension}>
                    <TableCell className="text-xs font-medium">{row.dimension}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.check}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.why}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ReadingNote>
            Thresholds must be set before the final holdout is evaluated. Changing them after
            seeing holdout results invalidates that promotion review — which is why the failed
            version-1 gate remains part of the evidence rather than being retired.
          </ReadingNote>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="space-y-4">
            <SectionHeading
              title="Data guarantees"
              description="What the database itself enforces, independent of any application code."
            />
            <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
              <li>
                <strong className="text-foreground">Append-only evidence.</strong> Observation,
                forecast, assessment and publication ledgers reject UPDATE and DELETE. A changed
                provider payload is a new observation; a changed forecast is a new revision.
              </li>
              <li>
                <strong className="text-foreground">Point-in-time reads.</strong> Every
                observation carries its fetch timestamp alongside its observation date, so a rate
                is never used before it was knowable.
              </li>
              <li>
                <strong className="text-foreground">Quantiles cannot cross.</strong> A check
                constraint enforces q01 ≤ q05 ≤ … ≤ q99, and every forecast must be positive.
              </li>
              <li>
                <strong className="text-foreground">Lineage is validated in the database.</strong>{" "}
                A revision above 1 must name a parent with the same pair, kind and origin, one
                revision lower, issued no later than itself.
              </li>
              <li>
                <strong className="text-foreground">Publication identity is checked.</strong> A
                snapshot&apos;s pair must match both its assessment and its weekly vintage, and
                that vintage must be a Chronos vintage.
              </li>
              <li>
                <strong className="text-foreground">Exactly-once by lease.</strong> Event and
                retrieval work is claimed under an expiring lease keyed by a content hash, so a
                retry cannot buy the same paid call twice.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <SectionHeading
              title="How this dashboard reads the data"
              description="Direct, server-side, read-only."
            />
            <p className="text-sm leading-relaxed text-muted-foreground">
              The <MonoTag>noeud_forecast</MonoTag> schema is deliberately absent from the
              Supabase Data API&apos;s exposed-schema list, so no browser key can reach it. The
              observatory therefore reads it server-side over PostgreSQL and renders finished
              HTML; the connection string never leaves the server, and nothing on this dashboard
              writes.
            </p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Reads</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["Overview", "latest pointers, vintages, publications, coverage, pipeline runs"],
                    ["Forward Forecast", "forecast_vintages, forecast_points, published_forecast_*"],
                    ["Forecast Accuracy", "forecast_points ⋈ canonical_fx_observations, matured_outcome_evaluations"],
                    ["Event Intelligence", "event_assessments, event_forecast_links, retrieval_snapshots"],
                    ["Model Lineage", "forecast_vintages, model_artifacts, model_alias_pointers"],
                    ["Market History", "canonical_fx_observations, provider_runs"],
                    ["Operations", "pipeline_runs, event_jobs, retrieval_jobs, provider_runs"],
                  ].map(([page, reads]) => (
                    <TableRow key={page}>
                      <TableCell className="text-xs font-medium whitespace-nowrap">{page}</TableCell>
                      <TableCell className="font-mono text-[0.68rem] text-muted-foreground">
                        {reads}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ReadingNote>
              A failed read is shown as a failed read. The observatory never substitutes fixture
              data for live rows, because a dashboard that silently mixes the two is worse than
              one that is visibly down.
            </ReadingNote>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="space-y-4">
          <SectionHeading
            title="Glossary"
            description="Every term this dashboard uses without further explanation."
          />
          <Accordion className="divide-y rounded-xl border">
            {GLOSSARY.map((entry) => (
              <AccordionItem key={entry.term} value={entry.term} className="border-b-0 px-4">
                <AccordionTrigger className="py-3">{entry.term}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{entry.body}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}
