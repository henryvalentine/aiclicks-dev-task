"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { formatSourceTimestamp, safeCitationUrl } from "@/lib/format";
import type { Mention, ModelName, SentimentName } from "@/lib/types";

const MODELS: { id: ModelName; label: string; dot: string }[] = [
  { id: "chatgpt", label: "ChatGPT", dot: "bg-chatgpt" },
  { id: "claude", label: "Claude", dot: "bg-claude" },
  { id: "gemini", label: "Gemini", dot: "bg-gemini" },
  { id: "perplexity", label: "Perplexity", dot: "bg-perplexity" },
];
const SENTIMENT_STYLE: Record<SentimentName, { dot: string; pill: string }> = {
  positive: { dot: "bg-positive", pill: "bg-positive/10 text-positive ring-positive/20" },
  neutral: { dot: "bg-neutral", pill: "bg-neutral/10 text-muted-foreground ring-neutral/25" },
  negative: { dot: "bg-negative", pill: "bg-negative/10 text-negative ring-negative/20" },
};
const modelLabel = (model: ModelName) => MODELS.find((item) => item.id === model)?.label ?? model;

type Props = {
  rows: Mention[];
  total: number;
  page: number;
  perPage: number;
  loading: boolean;
  error: string;
  onPage: (page: number) => void;
  onPerPage: (perPage: number) => void;
  onReset: () => void;
};

export function MentionsTable({ rows, total, page, perPage, loading, error, onPage, onPerPage, onReset }: Props) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <section id="mentions" className="surface scroll-mt-24 overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b px-4 py-4 sm:px-6">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">Mentions</h2>
          <p className="mt-0.5 text-sm text-muted-foreground"><span className="num text-foreground">{total.toLocaleString()}</span> AI responses match your filters</p>
        </div>
      </div>

      {!loading && (error || total === 0) ? (
        <div className="flex flex-col items-center px-6 py-20 text-center">
          {error ? <p role="alert" className="max-w-lg text-sm text-destructive">{error}</p> : <>
            <div className="grid size-12 place-items-center rounded-full bg-muted"><SearchX className="size-5 text-muted-foreground" /></div>
            <p className="mt-4 font-display font-semibold">No mentions match these filters</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">Try widening the date range or clearing a model or sentiment filter.</p>
            <button type="button" className="mt-5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent" onClick={onReset}>Clear all filters</button>
          </>}
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Query</th>
                  <th className="px-3 py-3 font-medium">Model</th>
                  <th className="px-3 py-3 font-medium">Mentioned</th>
                  <th className="px-3 py-3 text-right font-medium">Pos.</th>
                  <th className="px-3 py-3 font-medium">Sentiment</th>
                  <th className="hidden px-3 py-3 font-medium lg:table-cell">Citation</th>
                  <th className="px-6 py-3 text-right font-medium">Date (UTC)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 8 }).map((_, rowIndex) => (
                  <tr key={rowIndex} className="border-b last:border-0">
                    {Array.from({ length: 7 }).map((__, columnIndex) => (
                      <td key={columnIndex} className={`px-3 py-4 first:px-6 last:px-6 ${columnIndex === 5 ? "hidden lg:table-cell" : ""}`}><div className="h-4 w-full max-w-32 animate-pulse rounded-md bg-muted" /></td>
                    ))}
                  </tr>
                )) : rows.map((mention) => (
                  <tr key={mention.id} className="border-b transition-colors last:border-0 hover:bg-muted/40">
                    <td className="max-w-[280px] px-6 py-3.5"><p className="truncate font-medium">{mention.query_text}</p><p className="num mt-0.5 text-[11px] text-muted-foreground">{mention.id}</p></td>
                    <td className="px-3 py-3.5"><ModelTag model={mention.model} /></td>
                    <td className="px-3 py-3.5"><MentionedTag mentioned={mention.mentioned} /></td>
                    <td className="num px-3 py-3.5 text-right">{mention.position ? `#${mention.position}` : <Dash />}</td>
                    <td className="px-3 py-3.5"><SentimentTag sentiment={mention.sentiment} /></td>
                    <td className="hidden max-w-[200px] px-3 py-3.5 lg:table-cell"><Citation url={mention.citation_url} /></td>
                    <td className="num whitespace-nowrap px-6 py-3.5 text-right text-xs text-muted-foreground">{formatSourceTimestamp(mention.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y md:hidden">
            {loading ? Array.from({ length: 5 }).map((_, index) => <li key={index} className="space-y-2 p-4"><div className="h-4 w-3/4 animate-pulse rounded bg-muted" /><div className="h-3 w-1/2 animate-pulse rounded bg-muted" /></li>) : rows.map((mention) => (
              <li key={mention.id} className="p-4">
                <div className="flex items-start justify-between gap-3"><p className="font-medium leading-snug">{mention.query_text}</p><span className="num shrink-0 text-sm">{mention.position ? `#${mention.position}` : <Dash />}</span></div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2"><ModelTag model={mention.model} /><MentionedTag mentioned={mention.mentioned} /><SentimentTag sentiment={mention.sentiment} /></div>
                <div className="mt-2.5 flex items-center justify-between gap-3 text-xs text-muted-foreground"><Citation url={mention.citation_url} /><span className="num shrink-0">{formatSourceTimestamp(mention.created_at)}</span></div>
              </li>
            ))}
          </ul>

          <div className="flex flex-col-reverse items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row sm:px-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Rows</span>
              <select value={perPage} onChange={(event) => onPerPage(Number(event.target.value))} className="num rounded-md border bg-card px-2 py-1 text-foreground">
                {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              <span className="num">{from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" className="grid size-8 place-items-center rounded-md border bg-background text-foreground transition-colors hover:bg-accent disabled:opacity-50" disabled={page <= 1 || loading} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft className="size-4" /></button>
              <span className="num px-3 text-xs">{page} / {pages}</span>
              <button type="button" className="grid size-8 place-items-center rounded-md border bg-background text-foreground transition-colors hover:bg-accent disabled:opacity-50" disabled={page >= pages || loading} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight className="size-4" /></button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Dash() { return <span className="text-muted-foreground/60">—</span>; }

function ModelTag({ model }: { model: ModelName }) {
  const dot = MODELS.find((item) => item.id === model)?.dot ?? "bg-muted-foreground";
  return <span className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2 py-0.5 text-xs font-medium"><span className={`size-1.5 rounded-full ${dot}`} />{modelLabel(model)}</span>;
}

function MentionedTag({ mentioned }: { mentioned: boolean }) {
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${mentioned ? "bg-signal text-signal-foreground" : "bg-muted text-muted-foreground"}`}>{mentioned ? "Mentioned" : "Not mentioned"}</span>;
}

function SentimentTag({ sentiment }: { sentiment: SentimentName | null }) {
  if (!sentiment) return <Dash />;
  const style = SENTIMENT_STYLE[sentiment];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${style.pill}`}><span className={`size-1.5 rounded-full ${style.dot}`} />{sentiment}</span>;
}

function Citation({ url }: { url: string | null }) {
  const parsed = safeCitationUrl(url);
  if (!parsed) return <Dash />;
  const displayUrl = parsed.protocol === "https:" ? parsed.href.replace(/^https:\/\//i, "") : parsed.href;
  return <a href={parsed.href} target="_blank" rel="noreferrer" className="group inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><span className="truncate">{displayUrl}</span><ArrowUpRight className="size-3 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>;
}
