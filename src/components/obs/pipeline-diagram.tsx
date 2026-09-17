/**
 * The daily cycle, drawn rather than described. Colours come from the theme
 * tokens so the diagram is legible in both modes, and every box is labelled —
 * the shading only groups stages, it never carries meaning on its own.
 */
export function PipelineDiagram() {
  const stages = [
    {
      x: 8,
      title: "Ingest",
      lines: ["Provider `latest` call", "Repair missed dates", "Append immutable payload"],
      tone: "var(--chart-1)",
    },
    {
      x: 196,
      title: "Issue",
      lines: ["Monday: Chronos-2 · 30 days", "Daily: block bootstrap", "Store vintage + 9 quantiles"],
      tone: "var(--chart-7)",
    },
    {
      x: 384,
      title: "Assess",
      lines: ["Bounded news search", "Structured scorer", "Evidence + decision"],
      tone: "var(--chart-2)",
    },
    {
      x: 572,
      title: "Publish",
      lines: ["Apply bounded policy", "Shadow snapshot · 30 points", "Base retained by default"],
      tone: "var(--chart-3)",
    },
  ];

  return (
    <figure className="space-y-3">
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 752 214"
          role="img"
          aria-label="Daily pipeline: ingest, issue, assess, publish, then read through the API and this observatory."
          className="w-full min-w-[640px]"
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

          {stages.map((stage, index) => (
            <g key={stage.title}>
              <rect
                x={stage.x}
                y={26}
                width={172}
                height={96}
                rx={10}
                fill="var(--card)"
                stroke="var(--border)"
              />
              <rect x={stage.x} y={26} width={3} height={96} rx={1.5} fill={stage.tone} />
              <text
                x={stage.x + 16}
                y={50}
                fill="var(--foreground)"
                fontSize="13"
                fontWeight="600"
              >
                {index + 1}. {stage.title}
              </text>
              {stage.lines.map((line, lineIndex) => (
                <text
                  key={line}
                  x={stage.x + 16}
                  y={70 + lineIndex * 16}
                  fill="var(--muted-foreground)"
                  fontSize="10.5"
                >
                  {line}
                </text>
              ))}
              {index < stages.length - 1 ? (
                <line
                  x1={stage.x + 174}
                  y1={74}
                  x2={stage.x + 192}
                  y2={74}
                  stroke="var(--muted-foreground)"
                  strokeWidth={1.25}
                  markerEnd="url(#pipeline-arrow)"
                />
              ) : null}
            </g>
          ))}

          <text x={8} y={16} fill="var(--muted-foreground)" fontSize="10" letterSpacing="1.2">
            ONE DEPENDENCY-ORDERED FLOW · 05:00 AFRICA/ACCRA
          </text>

          {/* Persistence lane */}
          <rect
            x={8}
            y={146}
            width={736}
            height={56}
            rx={10}
            fill="var(--muted)"
            fillOpacity="0.45"
            stroke="var(--border)"
            strokeDasharray="4 4"
          />
          <text x={24} y={168} fill="var(--foreground)" fontSize="11.5" fontWeight="600">
            Append-only PostgreSQL ledgers
          </text>
          <text x={24} y={186} fill="var(--muted-foreground)" fontSize="10.5">
            provider_runs · fx_observations · forecast_vintages + points · event_assessments ·
            published_forecast_snapshots + points · pipeline_runs
          </text>

          {stages.map((stage) => (
            <line
              key={`drop-${stage.title}`}
              x1={stage.x + 86}
              y1={124}
              x2={stage.x + 86}
              y2={144}
              stroke="var(--muted-foreground)"
              strokeWidth={1}
              strokeDasharray="3 3"
              markerEnd="url(#pipeline-arrow)"
            />
          ))}
        </svg>
      </div>
      <figcaption className="text-xs leading-relaxed text-muted-foreground">
        Every stage writes before the next one reads. The observatory and the versioned read API
        both consume the ledgers, never the running flow — so what you see here is exactly what a
        downstream consumer would receive.
      </figcaption>
    </figure>
  );
}
