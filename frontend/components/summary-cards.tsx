"use client";

import type { ModelName, ModelRate } from "@/lib/types";
import {
  TrendingUp,
  MessageSquareText,
  ListOrdered,
  Bot,
} from "lucide-react";

const MODELS: { id: ModelName; label: string; dot: string }[] = [
  { id: "chatgpt", label: "ChatGPT", dot: "bg-chatgpt" },
  { id: "claude", label: "Claude", dot: "bg-claude" },
  { id: "gemini", label: "Gemini", dot: "bg-gemini" },
  { id: "perplexity", label: "Perplexity", dot: "bg-perplexity" },
];

export function SummaryCards({
  total, mentionedCount, mentionRate, averagePosition, positiveSentimentRate, modelRates, loading,
}: {
  total: number;
  mentionedCount: number;
  mentionRate: number;
  averagePosition: number | null;
  positiveSentimentRate: number;
  modelRates: ModelRate[];
  loading: boolean;
}) {
  const rates = new Map(modelRates.map((item) => [item.model, item]));
  return (
    <section id="overview" className="grid scroll-mt-24 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {/* <div className="relative overflow-hidden rounded-xl bg-primary p-5 text-primary-foreground shadow-card">
        <p className="text-xs font-medium uppercase tracking-wider opacity-70">Mention rate</p>
        {loading ? <div className="mt-3 h-10 w-28 animate-pulse rounded-md bg-primary-foreground/15" /> : (
          <p className="num mt-2 text-4xl font-semibold tracking-tight">{mentionRate.toFixed(1)}<span className="text-xl opacity-60">%</span></p>
        )}
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-primary-foreground/15">
          <div className="h-full rounded-full bg-signal transition-[width] duration-700" style={{ width: `${loading ? 0 : Math.max(0, Math.min(100, mentionRate))}%` }} />
        </div>
        <p className="mt-2 text-xs opacity-60">of AI responses name your brand</p>
      </div> */}
      
      <Stat
        icon={TrendingUp}
        label="Mention rate"
        value={`${mentionRate.toFixed(1)}%`}
        hint={`of AI responses name your brand`}
        loading={loading}
      />
      <Stat
        icon={MessageSquareText}
        label="Responses tracked"
        value={total.toLocaleString()}
        hint={`${mentionedCount.toLocaleString()} with a mention`}
        loading={loading}
      />

      <Stat
        icon={ListOrdered}
        label="Avg. position"
        value={averagePosition === null ? "—" : `#${averagePosition.toFixed(2)}`}
        hint="when mentioned, lower is better"
        loading={loading}
      />

      <div className="surface flex h-full flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rate by model</p>
        <ul className="mt-3 space-y-2">
          {MODELS.map((model) => {
            const data = rates.get(model.id);
            const rate = data?.mention_rate ?? 0;
            return (
              <li key={model.id} className="flex items-center gap-2 text-xs">
                <span className={`size-1.5 rounded-full ${model.dot}`} />
                <span className="w-16">{model.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full transition-[width] duration-700 ${model.dot}`} style={{ width: loading ? "0%" : `${Math.max(0, Math.min(100, rate))}%` }} />
                </div>
                <span className="num w-10 text-right text-muted-foreground">{loading ? "··" : `${rate.toFixed(0)}%`}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[11px] text-muted-foreground">
          <span className="num text-positive">{positiveSentimentRate.toFixed(0)}%</span> positive sentiment overall
        </p>
      </div>
    </section>
  );
}


function Stat({
  icon: Icon,
  label,
  value,
  hint,
  loading,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  loading: boolean;
}) {
  return (
    <div className="surface flex h-full flex-col p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <div className="flex items-center justify-between">
        {loading ? (
          <div className="h-10 w-28 animate-pulse rounded-md bg-muted" />
        ) : (
          <p className="num min-w-0 break-words text-4xl font-semibold tracking-tight" style={{paddingTop: "25px"}}>
            {value}
          </p>
        )}

        <Icon
          className="size-5 shrink-0 text-muted-foreground"
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </div>

      <p className="mt-auto pt-3 text-xs text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}


