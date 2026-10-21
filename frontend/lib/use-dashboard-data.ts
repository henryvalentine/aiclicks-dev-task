"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE, filtersToRequest, postJson } from "@/lib/format";
import type {
  GroupBy,
  Mention,
  MentionFilters,
  MentionsResponse,
  ModelRate,
  TrendPoint,
  TrendsResponse,
} from "@/lib/types";

type MentionsState = {
  data: Mention[];
  total: number;
  mentionedCount: number;
  mentionRate: number;
  averagePosition: number | null;
  positiveSentimentRate: number;
  modelRates: ModelRate[];
  loading: boolean;
  error: string;
};

type TrendsState = { data: TrendPoint[]; loading: boolean; error: string };
const emptyMentions: MentionsState = {
  data: [], total: 0, mentionedCount: 0, mentionRate: 0, averagePosition: null,
  positiveSentimentRate: 0, modelRates: [], loading: true, error: "",
};

export function useDashboardData(filters: MentionFilters, page: number, perPage: number, groupBy: GroupBy) {
  const [mentions, setMentions] = useState<MentionsState>(emptyMentions);
  const [trends, setTrends] = useState<TrendsState>({ data: [], loading: true, error: "" });
  const [mentionsRetryKey, setMentionsRetryKey] = useState(0);
  const [trendsRetryKey, setTrendsRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setMentions((current) => ({ ...current, loading: true, error: "" }));
      try {
        const result = await postJson<MentionsResponse>(`${API_BASE}/mentions`, {
          page,
          per_page: perPage,
          filters: filtersToRequest(filters),
        }, controller.signal);
        setMentions({
          data: result.data,
          total: result.total,
          mentionedCount: result.mentioned_count,
          mentionRate: result.mention_rate,
          averagePosition: result.average_position,
          positiveSentimentRate: result.positive_sentiment_rate,
          modelRates: result.model_rates,
          loading: false,
          error: "",
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setMentions({ ...emptyMentions, loading: false,
          error: error instanceof Error ? error.message : "Could not load mention records." });
      }
    }
    void load();
    return () => controller.abort();
  }, [filters, page, perPage, mentionsRetryKey]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setTrends((current) => ({ ...current, loading: true, error: "" }));
      try {
        const result = await postJson<TrendsResponse>(`${API_BASE}/mentions/trends`, {
          ...filtersToRequest(filters),
          group_by: groupBy,
        }, controller.signal);
        setTrends({ data: result.data, loading: false, error: "" });
      } catch (error) {
        if (controller.signal.aborted) return;
        setTrends({ data: [], loading: false,
          error: error instanceof Error ? error.message : "Could not load trend data." });
      }
    }
    void load();
    return () => controller.abort();
  }, [filters, groupBy, trendsRetryKey]);

  const retryMentions = useCallback(() => setMentionsRetryKey((value) => value + 1), []);
  const retryTrends = useCallback(() => setTrendsRetryKey((value) => value + 1), []);
  return { mentions, trends, retryMentions, retryTrends };
}
