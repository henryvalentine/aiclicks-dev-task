"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { FilterBar } from "@/components/filter-bar";
import { MentionsTable } from "@/components/mentions-table";
import { SummaryCards } from "@/components/summary-cards";
import { TrendPanel } from "@/components/trend-panel";
import { useDashboardData } from "@/lib/use-dashboard-data";
import type { GroupBy, MentionFilters } from "@/lib/types";

const PAGE_SIZE = 25;
const emptyFilters: MentionFilters = { model: "", sentiment: "", date_from: "", date_to: "" };

function validateFilters(filters: MentionFilters): string {
  if (filters.date_from && filters.date_to && filters.date_from > filters.date_to) {
    return "The start date must be on or before the end date. Update the dates and apply your filters again.";
  }
  return "";
}

export default function Dashboard() {
  const [filters, setFilters] = useState<MentionFilters>(emptyFilters);
  const [draft, setDraft] = useState<MentionFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [groupBy, setGroupBy] = useState<GroupBy>("day");
  const [filterError, setFilterError] = useState("");
  const activeFilterCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);
  const { mentions, trends, retryMentions, retryTrends } = useDashboardData(filters, page, groupBy);

  function updateDraft(key: keyof MentionFilters, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setFilterError("");
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validateFilters(draft);
    if (validationMessage) {
      setFilterError(validationMessage);
      return;
    }
    setFilterError("");
    setFilters({ ...draft });
    setPage(1);
  }

  function clearFilters() {
    setDraft(emptyFilters);
    setFilters(emptyFilters);
    setFilterError("");
    setPage(1);
  }

  return (
    <div id="top" className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardHeader />
      <div className="min-h-screen lg:pl-64">
        <div className="sticky top-0 z-20 hidden h-[56px] items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur lg:flex xl:px-8">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Workspace</span><span aria-hidden="true">/</span><span className="font-semibold text-slate-700">Dashboard</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Brand visibility on AI engines</span>
            <span className="mx-1 text-slate-300"></span>
            <span></span>
          </div>
        </div>

        <main className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
          <section aria-labelledby="page-title" className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                <span className="rounded-md bg-teal-50 px-2 py-1 font-semibold text-teal-700">Overview</span>
                <span aria-hidden="true">/</span>
                <span>AI response monitoring</span>
              </div>
              <h1 id="page-title" className="m-0 text-2xl font-bold tracking-tight text-slate-950 sm:text-[30px]">Brand mentions overview</h1>
              <p className="mb-0 mt-2 max-w-2xl text-sm leading-6 text-slate-500">Explore how AI responses mention brands, compare model output, and inspect the prompts and citations behind each record.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-500 sm:self-auto">
              <span className="grid size-7 place-items-center rounded-lg bg-teal-50 font-bold text-teal-700">10k</span>
              <span><strong className="block text-slate-800">Historical sample</strong><span className="mt-0.5 block">10,000 responses</span></span>
            </div>
          </section>

          <FilterBar draft={draft} activeFilterCount={activeFilterCount} validationError={filterError} onDraftChange={updateDraft} onApply={applyFilters} onReset={clearFilters} />

          <SummaryCards total={mentions.total} mentionedCount={mentions.mentionedCount} mentionRate={mentions.mentionRate} visibleCount={mentions.data.length} loading={mentions.loading} error={mentions.error} />

          <TrendPanel data={trends.data} groupBy={groupBy} loading={trends.loading} error={trends.error} onGroupByChange={setGroupBy} onRetry={retryTrends} />

          <MentionsTable data={mentions.data} loading={mentions.loading} error={mentions.error} page={page} pageSize={PAGE_SIZE} total={mentions.total} onPageChange={setPage} onResetFilters={clearFilters} onRetry={retryMentions} />

          <footer id="dataset-info" className="flex flex-col justify-between gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400 sm:flex-row sm:items-center">
            <span className="font-semibold text-slate-500">AI Clicks <span className="mx-1 text-slate-300">·</span> Brand intelligence</span>
            <span className="font-semibold text-slate-500"> Built for clarity and simplicity.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
