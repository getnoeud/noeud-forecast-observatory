/**
 * The two daily deployments, drawn rather than described. Colours come from the
 * theme tokens so the diagram is legible in both modes, and every box is
 * labelled — shading only groups stages, it never carries meaning on its own.
 */
export function PipelineDiagram() {
  const W = 138;
  const GAP = 14;
  const stages = [
    {
      title: "Ingest",
      lines: ["Provider `latest` call", "Repair missed dates", "Append raw payload"],
      tone: "var(--chart-1)",
    },
    {
      title: "Issue",
      lines: ["Monday: Chronos-2", "Daily: block bootstrap", "9 quantiles × 30 days"],
      tone: "var(--chart-7)",
    },
    {
      title: "Collect banks",
      lines: ["Absa · Stanbic · FNB", "Dated rate cards", "Hash + fetch time"],
      tone: "var(--chart-3)",
    },
    {
      title: "Assess",
      lines: ["Bounded news search", "Scorer + bank quotes", "Valid midday → midday"],
      tone: "var(--chart-2)",
    },
    {
      title: "Publish",
      lines: ["Bounded 1% policy", "Shadow snapshot", "Base retained"],
      tone: "var(--chart-4)",
    },
  ].map((stage, index) => ({ ...stage, x: 8 + index * (W + GAP) }));

  const morningEnd = stages[1].x + W;
  const middayStart = stages[2].x;
  const middayEnd = stages[4].x + W;

  return (
    <figure className="space-y-3">
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 776 240"
          role="img"
          aria-label="Two deployments: a 05:00 morning cycle that ingests rates and issues forecasts, then a weekday 12:00 cycle that collects bank rates, runs event intelligence and publishes shadow snapshots."
          className="w-full min-w-[680px]"
        >
          <defs>
            <marker
              id="pipeline-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted-foreground)" />
            </marker>
          </defs>

          {/* Deployment brackets */}
          <line x1={8} y1={22} x2={morningEnd} y2={22} stroke="var(--chart-1)" strokeWidth={2} />
          <text x={8} y={14} fill="var(--muted-foreground)" fontSize="10" letterSpacing="1">
            DAILY 05:00 · daily-market-cycle
          </text>
          <line x1={middayStart} y1={22} x2={middayEnd} y2={22} stroke="var(--chart-2)" strokeWidth={2} />
          <text x={middayStart} y={14} fill="var(--muted-foreground)" fontSize="10" letterSpacing="1">
            MON–FRI 12:00 · midday-commercial-cycle
          </text>

          {stages.map((stage, index) => (
            <g key={stage.title}>
              <rect
                x={stage.x}
                y={34}
                width={W}
                height={96}
                rx={10}
                fill="var(--card)"
                stroke="var(--border)"
              />
              <rect x={stage.x} y={34} width={3} height={96} rx={1.5} fill={stage.tone} />
              <text x={stage.x + 14} y={57} fill="var(--foreground)" fontSize="12.5" fontWeight="600">
                {index + 1}. {stage.title}
              </text>
              {stage.lines.map((line, lineIndex) => (
                <text
                  key={line}
                  x={stage.x + 14}
                  y={77 + lineIndex * 16}
                  fill="var(--muted-foreground)"
                  fontSize="10"
                >
                  {line}
                </text>
              ))}
              {index < stages.length - 1 ? (
                <line
                  x1={stage.x + W + 1}
                  y1={82}
                  x2={stage.x + W + GAP - 1}
                  y2={82}
                  stroke="var(--muted-foreground)"
                  strokeWidth={1.25}
                  strokeDasharray={index === 1 ? "3 3" : undefined}
                  markerEnd="url(#pipeline-arrow)"
                />
              ) : null}
            </g>
          ))}

          <text
            x={stages[2].x - GAP / 2}
            y={146}
            textAnchor="middle"
            fill="var(--muted-foreground)"
            fontSize="9"
          >
            archive check
          </text>

          {/* Persistence lane */}
          <rect
            x={8}
            y={166}
            width={middayEnd - 8}
            height={62}
            rx={10}
            fill="var(--muted)"
            fillOpacity="0.45"
            stroke="var(--border)"
            strokeDasharray="4 4"
          />
          <text x={24} y={188} fill="var(--foreground)" fontSize="11.5" fontWeight="600">
            Append-only PostgreSQL ledgers
          </text>
          <text x={24} y={206} fill="var(--muted-foreground)" fontSize="10">
            fx_observations · forecast_vintages + points · commercial_bank_quotes ·
            event_assessments · published_forecast_snapshots · pipeline_runs
          </text>

          {stages.map((stage) => (
            <line
              key={`drop-${stage.title}`}
              x1={stage.x + W / 2}
              y1={132}
              x2={stage.x + W / 2}
              y2={164}
              stroke="var(--muted-foreground)"
              strokeWidth={1}
              strokeDasharray="3 3"
              markerEnd="url(#pipeline-arrow)"
            />
          ))}
        </svg>
      </div>
      <figcaption className="text-xs leading-relaxed text-muted-foreground">
        Two deployments with an explicit dependency, not a guessed gap: the noon flow first
        checks that today&apos;s bootstrap and the current Monday baseline were archived, and
        fails closed before collecting bank rates or paying for LLM calls if they were not. Every
        stage writes before the next one reads, and the observatory reads only the ledgers.
      </figcaption>
    </figure>
  );
}
