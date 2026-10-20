"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatShortDate } from "@/lib/format";
import type { GroupBy, TrendPoint } from "@/lib/types";
import { UiIcon } from "@/components/ui-icons";

type TrendPanelProps = {
  data: TrendPoint[];
  groupBy: GroupBy;
  loading: boolean;
  error: string;
  onGroupByChange: (value: GroupBy) => void;
  onRetry: () => void;
};

export function TrendPanel({ data, groupBy, loading, error, onGroupByChange, onRetry }: TrendPanelProps) {
  return (
    <section id="trends" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.025]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-5 sm:py-5">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-teal-50 text-teal-700"><UiIcon name="trend" className="size-[17px]" /></span>
            <p className="m-0 text-xs font-semibold text-teal-700">Performance overview</p>
          </div>
          <h2 className="m-0 text-lg font-bold tracking-tight text-slate-950 sm:text-xl">Brand mentions over time</h2>
          <p className="mb-0 mt-1.5 max-w-xl text-sm leading-5 text-slate-500">Compare total AI responses with responses that mention the brand.</p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Trend interval">
          {(["day", "week"] as const).map((interval) => (
            <button key={interval} type="button" aria-pressed={groupBy === interval} onClick={() => onGroupByChange(interval)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${groupBy === interval ? "bg-white text-teal-700 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"}`}>
              {interval === "day" ? "Daily" : "Weekly"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 px-4 pt-4 text-xs font-medium text-slate-500 sm:px-5">
        <span className="inline-flex items-center gap-2"><i className="h-0.5 w-5 rounded-full bg-teal-500" />All responses</span>
        <span className="inline-flex items-center gap-2"><i className="h-0.5 w-5 rounded-full bg-teal-500" />Brand mentioned</span>
      </div>
      {loading ? (
        <div className="grid h-[300px] place-items-center text-sm text-slate-500" role="status"><span className="flex items-center gap-3"><span className="size-4 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />Loading trend data…</span></div>
      ) : error ? (
        <div className="grid min-h-[300px] place-content-center justify-items-center gap-3 px-6 text-center" role="alert">
          <p className="m-0 max-w-xl text-sm text-rose-700">{error}</p>
          <button onClick={onRetry} type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Retry trend request</button>
        </div>
      ) : data.length === 0 ? (
        <div className="grid h-[300px] place-items-center px-6 text-center text-sm text-slate-500">No trend data for this date range.</div>
      ) : (
        <div className="h-[300px] w-full px-2 pb-4 pr-4 pt-2 sm:px-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 10, left: -18, bottom: 2 }}>
              <CartesianGrid stroke="#e9edf5" strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatShortDate} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} tick={{ fill: "#94a3b8", fontSize: 11 }} minTickGap={28} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
              <Tooltip labelFormatter={(label) => formatShortDate(String(label))} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px #0f172a12", fontSize: 12 }} />
              <Line type="monotone" dataKey="total" name="All responses" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="mentioned" name="Brand mentioned" stroke="#14b8a6" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="m-0 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs leading-5 text-slate-500 sm:px-5">
        Trend aggregation follows the selected date range. Model and sentiment filters affect the response table and summary metrics, not this chart.
      </p>
    </section>
  );
}
