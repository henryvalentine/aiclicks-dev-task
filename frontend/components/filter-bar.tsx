import { UiIcon } from "@/components/ui-icons";
import type { FormEvent } from "react";
import type { MentionFilters } from "@/lib/types";

type FilterBarProps = {
  draft: MentionFilters;
  activeFilterCount: number;
  validationError: string;
  onDraftChange: (key: keyof MentionFilters, value: string) => void;
  onApply: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
};

const fieldClass = "mt-1.5 h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10";
const labelClass = "block min-w-0 text-xs font-semibold text-slate-600";

export function FilterBar({ draft, activeFilterCount, validationError, onDraftChange, onApply, onReset }: FilterBarProps) {
  return (
    <section aria-label="Dashboard filters" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.025] sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600"><UiIcon name="filter" className="size-[17px]" /></span>
          <div>
            <h2 className="m-0 text-sm font-bold text-slate-900">Filters</h2>
            <p className="mb-0 mt-0.5 text-xs text-slate-500">Refine the records and summary metrics</p>
          </div>
        </div>
        <p className="m-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500" aria-live="polite">
          {activeFilterCount} active {activeFilterCount === 1 ? "filter" : "filters"}
        </p>
      </div>
      <form onSubmit={onApply} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] xl:items-end">
        <label className={labelClass}>
          AI model
          <select className={fieldClass} value={draft.model} onChange={(event) => onDraftChange("model", event.target.value)}>
            <option value="">All models</option>
            <option value="chatgpt">ChatGPT</option>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
            <option value="perplexity">Perplexity</option>
          </select>
        </label>
        <label className={labelClass}>
          Sentiment
          <select className={fieldClass} value={draft.sentiment} onChange={(event) => onDraftChange("sentiment", event.target.value)}>
            <option value="">All sentiment</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </label>
        <label className={labelClass}>
          From date
          <input className={fieldClass} type="date" value={draft.date_from} onChange={(event) => onDraftChange("date_from", event.target.value)} />
        </label>
        <label className={labelClass}>
          To date
          <input className={fieldClass} type="date" value={draft.date_to} onChange={(event) => onDraftChange("date_to", event.target.value)} />
        </label>
        <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-1">
          <button className="h-10 flex-1 rounded-lg bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm shadow-teal-600/15 transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 xl:flex-none" type="submit">
            Apply filters
          </button>
          <button className="h-10 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400" type="button" onClick={onReset}>
            Reset
          </button>
        </div>
      </form>
      {validationError && <p role="alert" className="mb-0 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">{validationError}</p>}
    </section>
  );
}
