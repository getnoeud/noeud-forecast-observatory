const FX_TIMEZONE = process.env.NEXT_PUBLIC_FORECAST_TIMEZONE || "Africa/Accra";

export function formatRate(value: number | null | undefined, digits = 4): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatNumber(
  value: number | null | undefined,
  digits = 2,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return Math.round(value).toLocaleString("en-US");
}

export function formatPercent(
  value: number | null | undefined,
  digits = 2,
  withSign = false,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const sign = withSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatSignedRate(value: number | null | undefined, digits = 4): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(digits)}`;
}

export function formatUsd(value: number | null | undefined, digits = 4): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `$${value.toFixed(digits)}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const iso = value.length > 10 ? value : `${value}T00:00:00Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatShortDate(value: string | null | undefined): string {
  if (!value) return "—";
  const iso = value.length > 10 ? value : `${value}T00:00:00Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FX_TIMEZONE,
  }).format(date);
}

export function formatClock(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: FX_TIMEZONE,
  }).format(date);
}

export function formatWeekday(value: string | null | undefined): string {
  if (!value) return "—";
  const iso = value.length > 10 ? value : `${value}T00:00:00Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(date);
}

/** Compact "3h 12m ago" / "in 14h" relative label. */
export function formatRelative(
  value: string | null | undefined,
  now: number = Date.now(),
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const deltaSeconds = (date.getTime() - now) / 1000;
  const abs = Math.abs(deltaSeconds);
  const future = deltaSeconds > 0;
  let text: string;
  if (abs < 60) text = `${Math.round(abs)}s`;
  else if (abs < 3600) text = `${Math.round(abs / 60)}m`;
  else if (abs < 86400) {
    const hours = Math.floor(abs / 3600);
    const minutes = Math.round((abs % 3600) / 60);
    text = minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  } else text = `${Math.round(abs / 86400)}d`;
  return future ? `in ${text}` : `${text} ago`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return "—";
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 100 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function shortHash(value: string | null | undefined, length = 10): string {
  if (!value) return "—";
  return value.length <= length ? value : `${value.slice(0, length)}…`;
}

export function titleCase(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function sentenceCase(value: string | null | undefined): string {
  if (!value) return "—";
  const text = value.replace(/[_-]+/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function hostnameOf(url: string | null | undefined): string {
  if (!url) return "—";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from.slice(0, 10)}T00:00:00Z`).getTime();
  const b = new Date(`${to.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}
