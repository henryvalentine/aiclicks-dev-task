
"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { SentimentCounts } from "@/lib/types";

const SENTIMENTS = [
  {
    key: "positive",
    label: "Positive",
    color: "var(--positive)",
  },
  {
    key: "negative",
    label: "Negative",
    color: "var(--negative)",
  },
  {
    key: "neutral",
    label: "Neutral",
    color: "var(--neutral)",
  },
] as const;

type SentimentPanelProps = {
  counts: SentimentCounts;
  loading: boolean;
  error: string;
};

export function SentimentPanel({
  counts,
  loading,
  error,
}: SentimentPanelProps) {
  const data = SENTIMENTS.map((sentiment) => ({
    ...sentiment,
    value: counts[sentiment.key],
  }));

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Positive share of the classified sentiment distribution.
  // This is 0% when Positive is excluded by the applied filters.
  const positivePercentage =
    total > 0
      ? Math.round((counts.positive / total) * 100)
      : 0;

  return (
    <section
      id="sentiment"
      className="surface min-w-0 scroll-mt-24 p-4 sm:p-6"
    >
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Sentiment distribution
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Across matching results
        </p>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="h-[320px] animate-pulse rounded-lg bg-muted/70" />
        ) : error ? (
          <div
            role="alert"
            className="grid min-h-[280px] place-items-center rounded-lg border border-dashed px-4 text-center text-sm text-muted-foreground"
          >
            Sentiment data is unavailable.
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {/* Larger doughnut with positive percentage in the centre */}
            <div className="relative aspect-square w-full max-w-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius="62%"
                    outerRadius="90%"
                    paddingAngle={total > 0 ? 2 : 0}
                    stroke="var(--card)"
                    strokeWidth={2}
                  >
                    {data.map((item) => (
                      <Cell
                        key={item.key}
                        fill={item.color}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) => [
                      Number(value ?? 0).toLocaleString(),
                      "Responses",
                    ]}
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      color: "var(--popover-foreground)",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="num text-2xl font-semibold tracking-tight sm:text-3xl">
                  {positivePercentage}%
                </span>
                <span className="mt-0.5 text-sm font-medium">
                  Positive
                </span>
              </div>
            </div>

            {/* Legend below the doughnut */}
            <div className="grid w-full grid-cols-3 gap-2 border-t border-border pt-3">
              {data.map((item) => {
                const percentage =
                  total > 0
                    ? Math.round((item.value / total) * 100)
                    : 0;

                return (
                  <div
                    key={item.key}
                    className="flex min-w-0 flex-col items-center gap-1 text-center"
                  >
                    <div className="flex min-w-0 items-center justify-center gap-1.5">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-xs font-medium">
                        {item.label}
                      </span>
                    </div>

                    <span className="num text-xs font-medium">
                      {item.value.toLocaleString()}
                    </span>

                    <span className="num text-[11px] text-muted-foreground">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>

            {total === 0 && (
              <p className="text-center text-xs text-muted-foreground">
                No classified sentiment for these filters.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
