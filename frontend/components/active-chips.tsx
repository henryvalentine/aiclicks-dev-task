"use client";

import { X } from "lucide-react";
import type { MentionFilters, ModelName, SentimentName } from "@/lib/types";

const MODELS: { id: ModelName; label: string }[] = [
  { id: "chatgpt", label: "ChatGPT" }, { id: "claude", label: "Claude" },
  { id: "gemini", label: "Gemini" }, { id: "perplexity", label: "Perplexity" },
];
const DEFAULT_FROM = "2025-01-01";
const DEFAULT_TO = "2025-03-31";

type Chip = { key: string; label: string; remove: () => void };

export function ActiveChips({ filters, onChange, onClearAll }: { filters: MentionFilters; onChange: (value: MentionFilters) => void; onClearAll: () => void }) {
  const chips: Chip[] = [
    ...filters.models.map((model) => ({
      key: model,
      label: MODELS.find((item) => item.id === model)?.label ?? model,
      remove: () => onChange({ ...filters, models: filters.models.filter((value) => value !== model) }),
    })),
    ...filters.sentiments.map((sentiment) => ({
      key: sentiment,
      label: sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
      remove: () => onChange({ ...filters, sentiments: filters.sentiments.filter((value) => value !== sentiment) }),
    })),
  ];
  if (filters.date_from !== DEFAULT_FROM || filters.date_to !== DEFAULT_TO) {
    chips.push({
      key: "date",
      label: `${filters.date_from} → ${filters.date_to}`,
      remove: () => onChange({ ...filters, date_from: DEFAULT_FROM, date_to: DEFAULT_TO }),
    });
  }
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button key={chip.key} type="button" onClick={chip.remove} className="group inline-flex items-center gap-1.5 rounded-full border bg-card py-1 pl-3 pr-2 text-xs font-medium transition-colors hover:border-foreground/30">
          {chip.label}
          <X className="size-3 text-muted-foreground group-hover:text-foreground" />
        </button>
      ))}
      <button type="button" onClick={onClearAll} className="text-xs text-muted-foreground underline-offset-4 hover:underline">Clear all</button>
    </div>
  );
}
