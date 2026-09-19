import * as React from "react";

export type MarkerShape = "circle" | "square" | "diamond" | "triangle";

/** SVG path for a marker centred on (cx, cy) with half-size r. */
function shapePath(shape: MarkerShape, cx: number, cy: number, r: number): string {
  switch (shape) {
    case "square":
      return `M${cx - r},${cy - r}h${2 * r}v${2 * r}h${-2 * r}Z`;
    case "diamond":
      return `M${cx},${cy - r * 1.3}L${cx + r * 1.3},${cy}L${cx},${cy + r * 1.3}L${cx - r * 1.3},${cy}Z`;
    case "triangle":
      return `M${cx},${cy - r * 1.25}L${cx + r * 1.15},${cy + r * 0.85}L${cx - r * 1.15},${cy + r * 0.85}Z`;
    default:
      return `M${cx - r},${cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
  }
}

/**
 * A Recharts `dot` renderer: a hollow shape, so two banks at the same rate (or
 * a bank and the model median) both remain visible where they overlap.
 */
export function hollowMarker(shape: MarkerShape, color: string, r = 5, strokeWidth = 2) {
  function Marker(props: { cx?: number; cy?: number; value?: unknown; index?: number }) {
    const { cx, cy, value, index } = props;
    if (cx === undefined || cy === undefined || value === null || value === undefined) {
      return <g key={`empty-${index}`} />;
    }
    return (
      <path
        key={`m-${index}`}
        d={shapePath(shape, cx, cy, r)}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
      />
    );
  }
  return Marker;
}

/** The same shape as a static legend swatch. */
export function MarkerSwatch({ shape, color }: { shape: MarkerShape; color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="shrink-0">
      <path d={shapePath(shape, 6, 6, 4)} fill="none" stroke={color} strokeWidth={1.75} />
    </svg>
  );
}
