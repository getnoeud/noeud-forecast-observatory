/**
 * Saturday/Sunday helpers for date-axis charts.
 *
 * FX rates are quoted every calendar day here, but the market is closed at the
 * weekend: the provider repeats Friday's rate, and the models still forecast
 * the days. Marking those days keeps a flat stretch from being misread as a
 * calm market, and shows which forecast days fall when banks are closed.
 */

export function isWeekend(date: string): boolean {
  const day = new Date(`${date.slice(0, 10)}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Runs of consecutive weekend entries in `dates`, as inclusive [firstIndex,
 * lastIndex] pairs. Dates must ascend; only adjacent entries join into a run, so
 * a lone Saturday or Sunday at the edge of the data is a one-day run.
 */
export function weekendRuns(dates: readonly string[]): [number, number][] {
  const runs: [number, number][] = [];
  let start = -1;
  for (let index = 0; index < dates.length; index += 1) {
    if (isWeekend(dates[index])) {
      if (start === -1) start = index;
    } else if (start !== -1) {
      runs.push([start, index - 1]);
      start = -1;
    }
  }
  if (start !== -1) runs.push([start, dates.length - 1]);
  return runs;
}

export function weekendRanges(dates: readonly string[]): [string, string][] {
  return weekendRuns(dates).map(([from, to]) => [dates[from], dates[to]]);
}

/** Above this many days a weekend band is under three pixels wide and only adds noise. */
export const MAX_WEEKEND_DAYS = 400;
