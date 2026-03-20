export function formatNumber(value: number | null | undefined, digits = 3): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }
  return `${formatNumber(value, digits)}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "--";
  }
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function toDateInputValue(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function daysAgo(days: number): string {
  const value = new Date();
  value.setDate(value.getDate() - days);
  return toDateInputValue(value);
}

