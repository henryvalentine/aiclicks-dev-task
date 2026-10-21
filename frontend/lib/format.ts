import type { MentionFilters } from "@/lib/types";

/** Search is a case-insensitive literal phrase; strip punctuation before sending it to the API. */
export function sanitizeSearchQuery(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

/** Format YYYY-MM-DD trend labels without shifting the calendar day by the browser timezone. */
export function formatShortDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  const stableDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", timeZone: "UTC",
  }).format(stableDate);
}

/** Render source wall-time components consistently. No local timezone conversion is applied. */
export function formatSourceTimestamp(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(value);
  if (!match) return value;
  const [, year, month, day, hour, minute, second = "0"] = match;
  const stableDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  }).format(stableDate);
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
    const path = Array.isArray(entry.loc) ? entry.loc.filter((part) => part !== "body").map(String).join(" → ") : "";
    return path ? `${path}: ${entry.msg}` : entry.msg;
  }).filter((item): item is string => Boolean(item));
  return messages.length ? messages.join("; ") : null;
}

export async function postJson<T>(url: string, body: unknown, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload && typeof payload === "object" && "detail" in payload ? (payload as { detail: unknown }).detail : null;
    throw new Error(formatValidationDetail(detail) ?? `The request failed (HTTP ${response.status}).`);
  }
  return payload as T;
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function filtersToRequest(filters: MentionFilters): Record<string, unknown> {
  const request: Record<string, unknown> = {};
  if (filters.models.length) request.models = filters.models;
  if (filters.sentiments.length) request.sentiments = filters.sentiments;
  if (filters.date_from) request.date_from = filters.date_from;
  if (filters.date_to) request.date_to = filters.date_to;
  const query = sanitizeSearchQuery(filters.query);
  if (query) request.query = query;
  return request;
}

export async function downloadMentionsCsv(filters: MentionFilters): Promise<void> {
  const response = await fetch(`${API_BASE}/mentions/export`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(filtersToRequest(filters)),
  });
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const detail = payload && typeof payload === "object" && "detail" in payload ? (payload as { detail: unknown }).detail : null;
    throw new Error(formatValidationDetail(detail) ?? `CSV export failed (HTTP ${response.status}).`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "aiclicks-mentions.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
