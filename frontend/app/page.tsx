"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Mention, MentionsResponse, TrendPoint, TrendsResponse } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const PAGE_SIZE = 25;

type Filters = { model: string; sentiment: string; date_from: string; date_to: string };
const emptyFilters: Filters = { model: "", sentiment: "", date_from: "", date_to: "" };
const modelLabels: Record<string, string> = {
  chatgpt: "ChatGPT", claude: "Claude", gemini: "Gemini", perplexity: "Perplexity",
};
const numberFormat = new Intl.NumberFormat("en-US");

function shortDate(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" });
}
function timestamp(value: string) {
  const date = new Date(value.replace(" ", "T") + (value.endsWith("Z") ? "" : "Z"));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en", { dateStyle: "medium", timeStyle: "short" });
}

export default function Dashboard() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [total, setTotal] = useState(0);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [groupBy, setGroupBy] = useState<"day" | "week">("day");
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [error, setError] = useState("");
  const [trendError, setTrendError] = useState("");

  const activeFilterCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadMentions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/mentions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page,
          per_page: PAGE_SIZE,
          filters: {
            ...(filters.model ? { model: filters.model } : {}),
            ...(filters.sentiment ? { sentiment: filters.sentiment } : {}),
            ...(filters.date_from ? { date_from: filters.date_from } : {}),
            ...(filters.date_to ? { date_to: filters.date_to } : {}),
          },
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ? String(body.detail) : `Request failed (${response.status})`);
      }
      const result = (await response.json()) as MentionsResponse;
      setMentions(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load mentions.");
      setMentions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  const loadTrends = useCallback(async () => {
    setTrendLoading(true);
    setTrendError("");
    try {
      const response = await fetch(`${API_BASE}/mentions/trends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(filters.date_from ? { date_from: filters.date_from } : {}),
          ...(filters.date_to ? { date_to: filters.date_to } : {}),
          group_by: groupBy,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ? String(body.detail) : `Request failed (${response.status})`);
      }
      const result = (await response.json()) as TrendsResponse;
      setTrends(result.data);
    } catch (err) {
      setTrendError(err instanceof Error ? err.message : "Could not load trend data.");
      setTrends([]);
    } finally {
      setTrendLoading(false);
    }
  }, [filters.date_from, filters.date_to, groupBy]);

  useEffect(() => { void loadMentions(); }, [loadMentions]);
  useEffect(() => { void loadTrends(); }, [loadTrends]);

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.date_from && draft.date_to && draft.date_from > draft.date_to) {
      setError("Start date must be on or before end date.");
      return;
    }
    setFilters(draft);
    setPage(1);
  }

  function clearFilters() {
    setDraft(emptyFilters);
    setFilters(emptyFilters);
    setPage(1);
  }

  const mentionedCount = mentions.filter((mention) => mention.mentioned).length;
  const mentionRate = total > 0 ? Math.round((mentionedCount / Math.max(mentions.length, 1)) * 100) : 0;

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Signal home">
          <span className="brand-mark">AC</span><span>AI-Clicks</span>
        </a>
        <div className="topbar-meta"><span className="status-dot" /> AI Model <span className="meta-divider">/</span> Brand visibility</div>
      </header>

      <div className="page-content" id="top">
        <div className="page-heading">
          <div>            
            <h1>Brand mentions</h1>
            <p className="page-subtitle">See when and how often your brand appears in AI answers.</p>
          </div>
          <div className="updated-label"><span className="live-dot" /> Dataset timeline: Jan-Mar 2025, </div>
        </div>

        <section className="summary-grid" aria-label="Mention summary">
          <article className="summary-card">
            <div className="summary-top"><span className="summary-label">Matching records</span><span className="summary-icon">↗</span></div>
            <strong>{loading ? "-" : numberFormat.format(total)}</strong>
            <span className="summary-foot">Records matching your filters</span>
          </article>
          <article className="summary-card">
            <div className="summary-top"><span className="summary-label">On this page</span><span className="summary-icon">◎</span></div>
            <strong>{loading ? "-" : numberFormat.format(mentions.length)}</strong>
            <span className="summary-foot">Up to {PAGE_SIZE} records per page</span>
          </article>
          <article className="summary-card">
            <div className="summary-top"><span className="summary-label">Mentions found</span><span className="summary-icon">✳</span></div>
            <strong>{loading ? "-" : numberFormat.format(mentionedCount)}</strong>
            <span className="summary-foot">Mentioned in the current page</span>
          </article>
          <article className="summary-card summary-card-accent">
            <div className="summary-top"><span className="summary-label">Page mention rate</span><span className="summary-icon">%</span></div>
            <strong>{loading ? "-" : `${mentionRate}%`}</strong>
            <span className="summary-foot">Based on visible records</span>
          </article>
        </section>

        <section className="panel trend-panel">
          <div className="panel-heading trend-heading">
            <div><p className="eyebrow">ACTIVITY OVER TIME</p><h2>Mention trend</h2><p className="panel-subtitle">Total responses compared with responses that mentioned the brand.</p></div>
            <div className="toggle-group" role="group" aria-label="Trend interval">
              <button className={groupBy === "day" ? "toggle active" : "toggle"} onClick={() => setGroupBy("day")} type="button">Daily</button>
              <button className={groupBy === "week" ? "toggle active" : "toggle"} onClick={() => setGroupBy("week")} type="button">Weekly</button>
            </div>
          </div>
          <div className="chart-legend"><span><i className="legend-line total-line" />All responses</span><span><i className="legend-line mentioned-line" />Brand mentioned</span></div>
          {trendLoading ? <div className="chart-state">Loading trend data…</div> : trendError ? <div className="chart-state error-state">{trendError}</div> : trends.length === 0 ? <div className="chart-state">No trend data for this date range.</div> : (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 12, right: 16, left: -12, bottom: 2 }}>
                  <CartesianGrid stroke="#e9edf3" strokeDasharray="3 5" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} tick={{ fill: "#7b8495", fontSize: 11 }} minTickGap={26} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#7b8495", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip labelFormatter={(label) => shortDate(String(label))} contentStyle={{ borderRadius: 10, border: "1px solid #e6eaf0", boxShadow: "0 8px 24px #17243a12", fontSize: 12 }} />
                  <Line type="monotone" dataKey="total" name="All responses" stroke="#8c96a8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="mentioned" name="Brand mentioned" stroke="#6258d9" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="chart-footnote">Trend dates follow the selected date range. Model and sentiment filters apply to the table only.</div>
        </section>

        <section className="panel records-panel">
          <div className="panel-heading records-heading">
            <div><p className="eyebrow">SOURCE RESPONSES</p><h2>All mentions <span className="count-pill">{numberFormat.format(total)}</span></h2><p className="panel-subtitle">Review the individual AI responses and their citation details.</p></div>
          </div>

          <form className="filter-bar" onSubmit={applyFilters}>
            <label className="filter-field"><span>AI model</span><select value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })}><option value="">All models</option><option value="chatgpt">ChatGPT</option><option value="claude">Claude</option><option value="gemini">Gemini</option><option value="perplexity">Perplexity</option></select></label>
            <label className="filter-field"><span>Sentiment</span><select value={draft.sentiment} onChange={(e) => setDraft({ ...draft, sentiment: e.target.value })}><option value="">All sentiment</option><option value="positive">Positive</option><option value="neutral">Neutral</option><option value="negative">Negative</option></select></label>
            <label className="filter-field date-field"><span>From</span><input type="date" value={draft.date_from} onChange={(e) => setDraft({ ...draft, date_from: e.target.value })} /></label>
            <label className="filter-field date-field"><span>To</span><input type="date" value={draft.date_to} onChange={(e) => setDraft({ ...draft, date_to: e.target.value })} /></label>
            <div className="filter-actions"><button className="button-primary" type="submit">Apply filters</button><button className="button-quiet" type="button" onClick={clearFilters}>Reset</button></div>
          </form>
          <div className="table-meta"><span>{activeFilterCount ? `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}` : "All records"}</span><span>Sorted newest first</span></div>
          {error ? <div className="table-state error-state"><strong>Couldn’t load mentions</strong><p>{error}</p><p className="help-text">Check that the API is running and NEXT_PUBLIC_API_URL points to it.</p><button className="button-primary retry-button" onClick={() => void loadMentions()} type="button">Try again</button></div> : loading ? <div className="table-state"><span className="spinner" />Loading mention records…</div> : mentions.length === 0 ? <div className="table-state"><div className="empty-symbol">⌕</div><strong>No mentions found</strong><p>Try changing or clearing the filters to see more results.</p><button className="button-secondary" type="button" onClick={clearFilters}>Clear filters</button></div> : (
            <>
              <div className="table-scroll"><table><thead><tr><th>Query</th><th>AI model</th><th>Mentioned</th><th>Position</th><th>Sentiment</th><th>Citation</th><th>Created at</th></tr></thead><tbody>
                {mentions.map((mention) => <tr key={mention.id}>
                  <td className="query-cell"><span>{mention.query_text}</span><small>{mention.id}</small></td>
                  <td><span className={`model-chip model-${mention.model}`}>{modelLabels[mention.model] ?? mention.model}</span></td>
                  <td><span className={mention.mentioned ? "mention-status yes" : "mention-status no"}><i />{mention.mentioned ? "Yes" : "No"}</span></td>
                  <td>{mention.position == null ? <span className="muted-dash">-</span> : <span className="position-value">#{mention.position}</span>}</td>
                  <td>{mention.sentiment ? <span className={`sentiment sentiment-${mention.sentiment}`}>{mention.sentiment}</span> : <span className="muted-dash">-</span>}</td>
                  <td>{mention.citation_url ? <a className="citation-link" href={mention.citation_url} target="_blank" rel="noreferrer" title={mention.citation_url}>{new URL(mention.citation_url).hostname}<span> ↗</span></a> : <span className="muted-dash">-</span>}</td>
                  <td className="date-cell">{timestamp(mention.created_at)}</td>
                </tr>)}
              </tbody></table></div>
              <div className="pagination"><span>Showing <strong>{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)}</strong> of <strong>{numberFormat.format(total)}</strong></span><div className="pagination-controls"><button type="button" className="page-button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>← Previous</button><span className="page-indicator">Page {page} of {totalPages}</span><button type="button" className="page-button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next →</button></div></div>
            </>
          )}
        </section>
        <footer className="page-footer"><span>AI-Clicks <span className="footer-separator">·</span> Brand mention analytics</span><span>Built for clarity and simplicity.</span></footer>
      </div>
    </main>
  );
}
