"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { Download, PanelLeft, Search, SlidersHorizontal, X } from "lucide-react";
import { ActiveChips } from "@/components/active-chips";
import { FilterSidebar } from "@/components/filter-sidebar";
import { SentimentPanel } from "@/components/sentiment-panel";
import { MentionsTable } from "@/components/mentions-table";
import { SummaryCards } from "@/components/summary-cards";
import { TrendPanel } from "@/components/trend-panel";
import { downloadMentionsCsv, sanitizeSearchQuery } from "@/lib/format";
import { useDashboardData } from "@/lib/use-dashboard-data";
import type { GroupBy, MentionFilters } from "@/lib/types";

const DEFAULT_FILTERS: MentionFilters = {
  models: [],
  sentiments: [],
  date_from: "2025-01-01",
  date_to: "2025-03-31",
  query: "",
};

type DateDraft = { date_from: string; date_to: string };

export default function Dashboard() {
  const [filters, setFilters] = useState<MentionFilters>(DEFAULT_FILTERS);
  const [dateDraft, setDateDraft] = useState<DateDraft>({ date_from: DEFAULT_FILTERS.date_from, date_to: DEFAULT_FILTERS.date_to });
  const [searchDraft, setSearchDraft] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [groupBy, setGroupBy] = useState<GroupBy>("day");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const { mentions, trends } = useDashboardData(filters, page, perPage, groupBy);

  const changeAppliedFilters = useCallback((next: MentionFilters) => {
    if (next.date_from !== filters.date_from || next.date_to !== filters.date_to) {
      setDateDraft({ date_from: next.date_from, date_to: next.date_to });
    }
    setFilters(next);
    setPage(1);
    setExportError("");
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS, query: filters.query });
    setDateDraft({ date_from: DEFAULT_FILTERS.date_from, date_to: DEFAULT_FILTERS.date_to });
    setPage(1);
    setExportError("");
  }, [filters.query]);

  // The active-chip "Clear all" preserves the submitted search.
  const clearFilterSelections = useCallback(() => {
    setFilters((current) => ({ ...DEFAULT_FILTERS, query: current.query }));
    setDateDraft({ date_from: DEFAULT_FILTERS.date_from, date_to: DEFAULT_FILTERS.date_to });
    setPage(1);
    setExportError("");
  }, []);

  // The no-results recovery action clears the search as well as the filter selections.
  const clearEverything = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
    setDateDraft({ date_from: DEFAULT_FILTERS.date_from, date_to: DEFAULT_FILTERS.date_to });
    setSearchDraft("");
    setPage(1);
    setExportError("");
  }, []);

  const updateDateDraft = useCallback((next: DateDraft) => {
    setDateDraft(next);
  }, []);

  const applyValidatedDate = useCallback((next: DateDraft) => {
    if (!next.date_from || !next.date_to || next.date_from > next.date_to) return;
    setFilters((current) => ({ ...current, date_from: next.date_from, date_to: next.date_to }));
    setPage(1);
    setExportError("");
  }, []);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = sanitizeSearchQuery(searchDraft);
    setSearchDraft(query);
    changeAppliedFilters({ ...filters, query });
  }

  async function exportCsv() {
    if (exporting) return;
    setExporting(true);
    setExportError("");
    try {
      await downloadMentionsCsv(filters);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setExportError(message);
    } finally {
      setExporting(false);
    }
  }

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  return (
    <div className="flex min-h-svh w-full bg-background text-foreground">
      <div className={`hidden shrink-0 transition-[width] duration-200 ease-linear md:block ${sidebarExpanded ? "w-64" : "w-12"}`} />
      <FilterSidebar
        filters={filters}
        dateDraft={dateDraft}
        expanded={sidebarExpanded}
        mobileOpen={mobileSidebarOpen}
        resultCount={mentions.total}
        onChange={changeAppliedFilters}
        onDateDraftChange={updateDateDraft}
        onValidatedDateChange={applyValidatedDate}
        onReset={resetFilters}
        onToggleExpanded={() => setSidebarExpanded(true)}
        onCloseMobile={closeMobileSidebar}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <button type="button" onClick={() => setSidebarExpanded((value) => !value)} className="hidden cursor-pointer size-7 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent md:inline-flex" aria-label="Toggle sidebar" title="Toggle sidebar">
            <PanelLeftIcon />
          </button>
          <div className="hidden h-5 w-px bg-border md:block" />
          <form onSubmit={search} className="relative max-w-md flex-1">
            <button type="submit" aria-label="Search queries" title="Search queries" className="absolute left-3 top-1/2 grid size-4 -translate-y-1/2 place-items-center text-muted-foreground">
              <Search className="size-4" />
            </button>
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search queries…"
              aria-label="Search queries"
              maxLength={200}
              className="h-9 w-full rounded-lg border bg-card pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/15"
            />
          </form>
          <button type="button" onClick={() => setMobileSidebarOpen(true)} className="inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:hidden">
            <SlidersHorizontal className="size-4" /> Filters
          </button>
          <div className="ml-auto hidden size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold sm:grid">HO</div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] space-y-4 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Q1 2025 · BLOOMBERG</p>
              <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Brand mentions</h1>
            </div>
            <button type="button" onClick={exportCsv} disabled={exporting} className="inline-flex cursor-pointer h-8 items-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-wait disabled:opacity-60">
              <Download className="size-4" /> Export CSV
            </button>
          </div>

          <ActiveChips filters={filters} onChange={changeAppliedFilters} onClearAll={clearFilterSelections} />
          {exportError && <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"><span className="flex-1">{exportError}</span><button type="button" aria-label="Dismiss" onClick={() => setExportError("")}><X className="size-4" /></button></div>}

          <SummaryCards
            total={mentions.total}
            mentionedCount={mentions.mentionedCount}
            mentionRate={mentions.mentionRate}
            averagePosition={mentions.averagePosition}
            positiveSentimentRate={mentions.positiveSentimentRate}
            modelRates={mentions.modelRates}
            loading={mentions.loading || Boolean(mentions.error)}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
          <TrendPanel
            data={trends.data}
            groupBy={groupBy}
            loading={trends.loading}
            error={trends.error}
            onGroupByChange={setGroupBy}
          />

          <SentimentPanel
            counts={mentions.sentimentCounts}
            loading={mentions.loading}
            error={mentions.error}
          />
        </div>

          <MentionsTable
            rows={mentions.data}
            total={mentions.total}
            page={page}
            perPage={perPage}
            loading={mentions.loading}
            error={mentions.error}
            onPage={setPage}
            onPerPage={(value) => { setPerPage(value); setPage(1); }}
            onReset={clearEverything}
          />
        </main>
      </div>
    </div>
  );
}


function PanelLeftIcon() {
  return (
    <svg
      width="16"
      height="12"
      viewBox="0 0 16 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-3 w-4 shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
        fill="currentColor"
      />
    </svg>
  );
}
