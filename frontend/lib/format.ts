/** Format a YYYY-MM-DD trend label without shifting the calendar day by timezone. */
export function formatShortDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  const valueAsUtcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(valueAsUtcDate);
}

/**
 * Preserve the source's timezone-naive timestamp fields. These fixture values are wall times,
 * not UTC instants, so parsing them as UTC and converting to the browser timezone can change
 * the displayed date and make it disagree with date filters.
 */
export function formatSourceTimestamp(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(value);
  if (!match) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("en", { dateStyle: "medium", timeStyle: "short" });
  }
  const [, year, month, day, hour, minute, second = "0"] = match;
  // Use UTC only as a stable formatting container; the source fields are not asserted to be UTC.
  const wallTime = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(wallTime);
}

export function safeCitationUrl(value: string | null): URL | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed : null;
  } catch {
    return null;
  }
}

function formatValidationDetail(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (!Array.isArray(detail)) return null;

  const messages = detail.map((item) => {
    if (!item || typeof item !== "object") return null;
    const entry = item as { loc?: unknown[]; msg?: unknown };
    if (typeof entry.msg !== "string") return null;
    const path = Array.isArray(entry.loc)
      ? entry.loc.filter((part) => part !== "body").map(String).join(" → ")
      : "";
    return path ? `${path}: ${entry.msg}` : entry.msg;
  }).filter((item): item is string => Boolean(item));

  return messages.length ? messages.join("; ") : null;
}

export async function postJson<T>(url: string, body: unknown, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload && typeof payload === "object" && "detail" in payload
      ? (payload as { detail: unknown }).detail
      : null;
    const message = formatValidationDetail(detail);
    throw new Error(message ?? `The request failed (HTTP ${response.status}). Please try again.`);
  }
  return payload as T;
}

export function filtersToRequest(filters: {
  model: string;
  sentiment: string;
  date_from: string;
  date_to: string;
}): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => Boolean(value)),
  );
}
