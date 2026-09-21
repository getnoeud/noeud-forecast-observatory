/**
 * Schedule helpers for the weekday midday cycle (`midday-llm-intelligence`,
 * Mon–Fri 12:00 in the forecast timezone).
 *
 * Event assessments are valid midday to midday and only produced on weekdays,
 * so "latest assessment" and "current assessment" are different questions: on a
 * Monday morning the newest row can be from the previous Friday and long expired.
 */

const TIMEZONE = process.env.NEXT_PUBLIC_FORECAST_TIMEZONE || "Africa/Accra";
export const MIDDAY_HOUR = 12;

type Parts = { year: number; month: number; day: number; hour: number; minute: number; weekday: number };

function partsIn(date: Date, timeZone: string): Parts {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);
  const get = (type: string) => formatted.find((part) => part.type === type)?.value ?? "";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    weekday: weekdays.indexOf(get("weekday")),
  };
}

/** The instant at which the wall clock in `timeZone` reads the given local time. */
function zonedInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, 0, 0);
  const seen = partsIn(new Date(guess), timeZone);
  const seenAsUtc = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute, 0);
  return new Date(guess - (seenAsUtc - guess));
}

/** The next Monday–Friday 12:00 strictly after `now`. */
export function nextMiddayRun(now: Date = new Date(), timeZone: string = TIMEZONE): Date {
  const start = partsIn(now, timeZone);
  for (let offset = 0; offset < 8; offset += 1) {
    const local = new Date(Date.UTC(start.year, start.month - 1, start.day + offset));
    const weekday = local.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    const candidate = zonedInstant(
      local.getUTCFullYear(),
      local.getUTCMonth() + 1,
      local.getUTCDate(),
      MIDDAY_HOUR,
      timeZone,
    );
    if (candidate.getTime() > now.getTime()) return candidate;
  }
  // Unreachable: a weekday always occurs within eight days.
  return now;
}

export function formatRunTime(date: Date, timeZone: string = TIMEZONE): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * The request time, for server-rendered pages that are `force-dynamic`. Deciding
 * whether an assessment has lapsed depends on the moment of the request, so
 * reading the clock is intended; naming it keeps that visible.
 */
export function requestNow(): number {
  return Date.now();
}
