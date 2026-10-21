"use client";

import type { ReactNode } from "react";
import {
  Bot,
  CalendarRange,
  Check,
  LayoutDashboard,
  LineChart,
  RotateCcw,
  Settings,
  Smile,
  Table2,
  type LucideIcon,
} from "lucide-react";
import type { MentionFilters, ModelName, SentimentName } from "@/lib/types";

const MODELS: { id: ModelName; label: string; dot: string }[] = [
  { id: "chatgpt", label: "ChatGPT", dot: "bg-chatgpt" },
  { id: "claude", label: "Claude", dot: "bg-claude" },
  { id: "gemini", label: "Gemini", dot: "bg-gemini" },
  { id: "perplexity", label: "Perplexity", dot: "bg-perplexity" },
];
const SENTIMENTS: { id: SentimentName; label: string; dot: string; pill: string }[] = [
  { id: "positive", label: "Positive", dot: "bg-positive", pill: "bg-positive/10 text-positive ring-positive/20" },
  { id: "neutral", label: "Neutral", dot: "bg-neutral", pill: "bg-neutral/10 text-muted-foreground ring-neutral/25" },
  { id: "negative", label: "Negative", dot: "bg-negative", pill: "bg-negative/10 text-negative ring-negative/20" },
];
const PRESETS = [
  { label: "7D", from: "2025-03-25" },
  { label: "30D", from: "2025-03-02" },
  { label: "QTD", from: "2025-01-01" },
];
const DEFAULT_FROM = "2025-01-01";
const DEFAULT_TO = "2025-03-31";

type DateDraft = { date_from: string; date_to: string };
type Props = {
  filters: MentionFilters;
  dateDraft: DateDraft;
  expanded: boolean;
  mobileOpen: boolean;
  resultCount: number;
  onChange: (filters: MentionFilters) => void;
  onDateDraftChange: (date: DateDraft) => void;
  onValidatedDateChange: (date: DateDraft) => void;
  onReset: () => void;
  onToggleExpanded: () => void;
  onCloseMobile: () => void;
};

export function FilterSidebar({
  filters, dateDraft, expanded, mobileOpen, resultCount, onChange, onDateDraftChange,
  onValidatedDateChange, onReset, onToggleExpanded, onCloseMobile,
}: Props) {
  const activeCount = filters.models.length + filters.sentiments.length +
    Number(filters.date_from !== DEFAULT_FROM || filters.date_to !== DEFAULT_TO);
  const toggle = <T,>(list: T[], value: T) => list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  const collapsed = !expanded && !mobileOpen;

  const content = (
    <>
      <div className="px-3 pb-2 pt-4">
        <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary font-display text-sm font-extrabold text-sidebar-primary-foreground">ai</div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="font-display text-[15px] font-bold leading-none tracking-tight">aiclicks</p>
            <p className="mt-1 text-[11px] text-sidebar-muted">Brand visibility</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="flex w-full min-w-0 flex-col p-2">
          <div className="flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-muted group-data-[collapsible=icon]:hidden">Workspace</div>
          <nav className="flex w-full min-w-0 flex-col gap-1" aria-label="Workspace">
            <NavItem icon={LayoutDashboard} label="Overview" href="#overview" active collapsed={collapsed} />
            <NavItem icon={LineChart} label="Trends" href="#trends" collapsed={collapsed} />
            <NavItem icon={Table2} label="Mentions" href="#mentions" collapsed={collapsed} />
          </nav>
        </div>

        <div className="mx-3 border-t border-sidebar-border" />

        <div className="flex w-full min-w-0 flex-col p-2">
          <div className="flex h-8 shrink-0 items-center justify-between rounded-md px-2 text-xs font-medium text-sidebar-muted group-data-[collapsible=icon]:hidden">
            <span>Filters</span>
            {activeCount > 0 && <span className="num rounded-full bg-sidebar-primary px-1.5 text-[10px] font-semibold text-sidebar-primary-foreground">{activeCount}</span>}
          </div>
          <div className="space-y-1">
            <FilterSection icon={Bot} label="AI model" count={filters.models.length} collapsed={collapsed} onExpand={onToggleExpanded}>
              {MODELS.map((model) => (
                <OptionRow key={model.id} checked={filters.models.includes(model.id)} onClick={() => onChange({ ...filters, models: toggle(filters.models, model.id) })} dot={model.dot} label={model.label} />
              ))}
            </FilterSection>

            <FilterSection icon={Smile} label="Sentiment" count={filters.sentiments.length} collapsed={collapsed} onExpand={onToggleExpanded}>
              {SENTIMENTS.map((sentiment) => (
                <OptionRow key={sentiment.id} checked={filters.sentiments.includes(sentiment.id)} onClick={() => onChange({ ...filters, sentiments: toggle(filters.sentiments, sentiment.id) })} dot={sentiment.dot} label={sentiment.label} />
              ))}
            </FilterSection>

            <FilterSection icon={CalendarRange} label="Date range" count={Number(filters.date_from !== DEFAULT_FROM || filters.date_to !== DEFAULT_TO)} collapsed={collapsed} onExpand={onToggleExpanded}>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-sidebar-accent p-1">
                {PRESETS.map((preset) => {
                  const selected = filters.date_from === preset.from && filters.date_to === DEFAULT_TO;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        const next = { date_from: preset.from, date_to: DEFAULT_TO };
                        onDateDraftChange(next);
                        onValidatedDateChange(next);
                      }}
                      className={`num rounded-md py-1 text-[11px] font-medium transition-colors ${selected ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-muted hover:text-sidebar-foreground"}`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 grid gap-1.5">
                <DateField label="From" value={dateDraft.date_from} other={dateDraft.date_to} isFrom onChange={(value) => updateDate({ ...dateDraft, date_from: value }, onDateDraftChange, onValidatedDateChange)} />
                <DateField label="To" value={dateDraft.date_to} other={dateDraft.date_from} isFrom={false} onChange={(value) => updateDate({ ...dateDraft, date_to: value }, onDateDraftChange, onValidatedDateChange)} />
              </div>
            </FilterSection>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 pb-4 pt-1">
        <button
          type="button"
          title="Reset filters"
          disabled={activeCount === 0}
          onClick={onReset}
          className="mx-2 flex h-8 items-center gap-2 rounded-md p-2 text-left text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:cursor-not-allowed disabled:opacity-50 group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 group-data-[collapsible=icon]:justify-center"
        >
          <RotateCcw className="size-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">Reset filters</span>
        </button>
        {/* <button
          type="button"
          title="Settings"
          className="mx-2 flex h-8 items-center gap-2 rounded-md p-2 text-left text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 group-data-[collapsible=icon]:justify-center"
        >
          <Settings className="size-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">Settings</span>
        </button> */}
        <button type="button" onClick={onCloseMobile} className="mx-2 mt-2 h-11 rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground md:hidden">
          Show <span className="num">{resultCount.toLocaleString()}</span> results
        </button>
      </div>
    </>
  );

  return (
    <>
      {mobileOpen && <button type="button" aria-label="Close filters" onClick={onCloseMobile} className="fixed inset-0 z-40 bg-black/50 md:hidden" />}
      <aside
        aria-label="Workspace and filters"
        data-collapsible={collapsed ? "icon" : ""}
        data-state={collapsed ? "collapsed" : "expanded"}
        className={`group fixed inset-y-0 left-0 z-50 flex h-svh flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 ease-linear md:translate-x-0 ${expanded ? "md:w-64" : "md:w-12"} w-72 ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {content}
      </aside>
    </>
  );
}

function NavItem({ icon: Icon, label, href, active = false, collapsed }: { icon: LucideIcon; label: string; href: string; active?: boolean; collapsed: boolean }) {
  return (
    <a
      href={href}
      title={collapsed ? label : undefined}
      className={`flex h-8 items-center gap-2 rounded-md p-2 text-sm font-medium transition-colors group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 group-data-[collapsible=icon]:justify-center ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}
    >
      <Icon className="size-4 shrink-0" />
      <span className="group-data-[collapsible=icon]:hidden">{label}</span>
    </a>
  );
}

function FilterSection({ icon: Icon, label, count, collapsed, onExpand, children }: {
  icon: LucideIcon; label: string; count: number; collapsed: boolean; onExpand: () => void; children: ReactNode;
}) {
  return (
    <div className="mb-1">
      <button
        type="button"
        title={collapsed ? (count ? `${label} · ${count} active` : label) : undefined}
        onClick={collapsed ? onExpand : undefined}
        className={`relative flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm font-medium transition-colors group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 group-data-[collapsible=icon]:justify-center ${collapsed ? "cursor-pointer hover:bg-sidebar-accent" : "cursor-default hover:bg-transparent"}`}
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">{label}</span>
        {collapsed && count > 0 && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-sidebar-primary" />}
        {!collapsed && count > 0 && <span className="absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-primary">{count}</span>}
      </button>
      <div className="mb-2 ml-3.5 border-l border-sidebar-border pl-3 group-data-[collapsible=icon]:hidden">{children}</div>
    </div>
  );
}

function OptionRow({ checked, onClick, dot, label }: { checked: boolean; onClick: () => void; dot: string; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-sidebar-accent ${checked ? "text-sidebar-foreground" : "text-sidebar-muted"}`}
    >
      <span className={`size-2 rounded-full ${dot}`} />
      <span className="flex-1 text-left">{label}</span>
      <span className={`grid size-4 place-items-center rounded border transition-colors ${checked ? "border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground" : "border-sidebar-border"}`}>
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
    </button>
  );
}

function DateField({ label, value, other, isFrom, onChange }: { label: string; value: string; other: string; isFrom: boolean; onChange: (value: string) => void }) {
  const invalid = !value || !other || (isFrom ? value > other : other > value);
  return (
    <label className={`flex items-center gap-2 rounded-md border px-2 py-1 focus-within:border-sidebar-primary ${invalid ? "border-destructive" : "border-sidebar-border"}`}>
      <span className="w-8 text-[11px] text-sidebar-muted">{label}</span>
      <input
        type="date"
        value={value}
        min="2025-01-01"
        max="2025-03-31"
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value)}
        className="num min-w-0 flex-1 bg-transparent text-[12px] text-sidebar-foreground outline-none"
      />
    </label>
  );
}

function updateDate(next: DateDraft, onDraftChange: (value: DateDraft) => void, onValidatedDateChange: (value: DateDraft) => void) {
  onDraftChange(next);
  if (next.date_from && next.date_to && next.date_from <= next.date_to) onValidatedDateChange(next);
}
