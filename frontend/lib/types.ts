// Types matching the backend API contract

export interface MentionFilters {
  model?: "chatgpt" | "claude" | "gemini" | "perplexity";
  sentiment?: "positive" | "neutral" | "negative";
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
}

export interface MentionsRequest {
  page: number;
  per_page: number;
  filters?: MentionFilters;
}

export interface Mention {
  id: string;
  query_text: string;
  model: string;
  mentioned: boolean;
  position: number | null;
  sentiment: string | null;
  citation_url: string | null;
  created_at: string;
}

export interface MentionsResponse {
  data: Mention[];
  total: number;
  page: number;
  per_page: number;
}

export interface TrendsRequest {
  date_from?: string;
  date_to?: string;
  group_by: "day" | "week";
}

export interface TrendPoint {
  date: string;
  total: number;
  mentioned: number;
}

export interface TrendsResponse {
  data: TrendPoint[];
}
