import { ReferenceArea } from "recharts";

import type { LegendEntry } from "@/components/charts/frame";
import { MAX_WEEKEND_DAYS, weekendRuns } from "@/lib/weekend";

/** Neutral, low-contrast fill: it must read as context, never as a data series. */
export const WEEKEND_FILL = "var(--muted-foreground)";
export const WEEKEND_OPACITY = 0.16;

/**
 * The band is a translucent tint over the card, so the legend swatch is the same
 * tint pre-mixed against the card. A solid grey swatch would read as a darker
 * series than the one drawn.
 */
export const WEEKEND_LEGEND: LegendEntry = {
  label: "Weekend",
  color: `color-mix(in oklab, ${WEEKEND_FILL} ${WEEKEND_OPACITY * 100}%, var(--card))`,
  shape: "area",
};

/**
 * Weekend bands for a category axis. Returns an array of elements, not a
 * component, because Recharts only recognises reference areas that are direct
 * children of the chart. Call it inline: `{weekendBands(dates)}`.
 *
 * `dates` must ascend and are what decides which days are weekend. When the
 * axis is keyed by something else — the horizon charts plot D1–D30 — pass those
 * keys as `keys`, in the same order. Returns nothing for very long windows.
 */
export function weekendBands(dates: readonly string[], keys: readonly (string | number)[] = dates) {
  if (dates.length > MAX_WEEKEND_DAYS) return [];
  return weekendRuns(dates).map(([from, to]) => (
    <ReferenceArea
      key={`weekend-${keys[from]}`}
      x1={keys[from]}
      x2={keys[to]}
      fill={WEEKEND_FILL}
      fillOpacity={WEEKEND_OPACITY}
      stroke="none"
      ifOverflow="hidden"
      isFront={false}
    />
  ));
}

/** True when the window would draw any bands, so the legend entry only appears when useful. */
export function hasWeekendBands(dates: readonly string[]): boolean {
  return dates.length <= MAX_WEEKEND_DAYS && weekendRuns(dates).length > 0;
}
