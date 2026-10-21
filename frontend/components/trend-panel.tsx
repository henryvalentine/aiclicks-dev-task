"use client";

import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";
import { formatShortDate } from "@/lib/format";
import type { GroupBy, TrendPoint } from "@/lib/types";

const chartConfig = {
  total: { label: "Responses", color: "var(--chart-1)" },
  mentioned: { label: "Brand mentioned", color: "var(--chart-2)" },
};

type TrendPanelProps = {
  data: TrendPoint[];
  groupBy: GroupBy;
  loading: boolean;
  error: string;
  onGroupByChange: (value: GroupBy) => void;
};

export function TrendPanel({ data, groupBy, loading, error, onGroupByChange }: TrendPanelProps) {
  return (
    <section id="trends" className="surface scroll-mt-24 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">Visibility over time</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Responses vs. responses that mention your brand</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
            <Legend className="bg-chart-1" label="Responses" />
            <Legend className="bg-chart-2" label="Mentioned" />
          </div>
          <div className="flex rounded-lg bg-muted p-0.5" role="tablist" aria-label="Trend interval">
            {(["day", "week"] as const).map((interval) => (
              <button key={interval} type="button" role="tab" aria-selected={groupBy === interval} onClick={() => onGroupByChange(interval)} className={`rounded-md px-3 cursor-pointer py-1 text-xs font-medium capitalize transition-all ${groupBy === interval ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground"}`}>
                {interval === "day" ? "Daily" : "Weekly"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 h-[260px] sm:h-[300px]">
        {loading ? (
          <div className="h-full w-full animate-pulse rounded-lg bg-muted/70" />
        ) : error ? (
          <div role="alert" className="grid h-full place-items-center rounded-lg border border-dashed px-4 text-center text-sm text-muted-foreground">{error}</div>
        ) : data.length === 0 ? (
          <div className="grid h-full place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">No data for this range</div>
        ) : (
          <div className="h-full w-full [&_.recharts-surface]:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="fillMentioned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 4" stroke="var(--border)" />
                <XAxis dataKey="date" tickFormatter={formatShortDate} tickLine={false} axisLine={false} minTickGap={32} tickMargin={10} tick={{ fill: "var(--muted-foreground)" }} />
                <YAxis tickLine={false} axisLine={false} width={44} tick={{ fill: "var(--muted-foreground)" }} />
                <Tooltip cursor={{ strokeDasharray: "3 3", stroke: "var(--border)" }} content={<TrendTooltip />} />
                <Area dataKey="mentioned" name="Brand mentioned" type="monotone" stroke="var(--chart-2)" strokeWidth={2} fill="url(#fillMentioned)" />
                <Line dataKey="total" name="Responses" type="monotone" stroke="var(--chart-1)" strokeWidth={1.75} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={`h-2 w-3 rounded-sm ${className}`} />{label}</span>;
}

function TrendTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const mentioned = payload.find((entry) => entry.dataKey === "mentioned");
  const total = payload.find((entry) => entry.dataKey === "total");
  return (
    <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{formatShortDate(String(label ?? ""))}</div>
      {mentioned && <TooltipRow label="Brand mentioned" value={mentioned.value} color="var(--chart-2)" />}
      {total && <TooltipRow label="Responses" value={total.value} color="var(--chart-1)" />}
    </div>
  );
}

function TooltipRow({ label, value, color }: { label: string; value: unknown; color: string }) {
  return (
    <div className="flex w-full items-center gap-2">
      <span className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
      <span className="flex-1 text-muted-foreground">{label}</span>
      <span className="num font-medium text-foreground">{typeof value === "number" ? value.toLocaleString() : String(value ?? "")}</span>
    </div>
  );
}
