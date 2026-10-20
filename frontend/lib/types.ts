export type ModelName = "chatgpt" | "claude" | "gemini" | "perplexity";
export type SentimentName = "positive" | "neutral" | "negative";
export type GroupBy = "day" | "week";

export type MentionFilters = {
  model: string;
  sentiment: string;
  date_from: string;
  date_to: string;
};

export type Mention = {
  id: string;
  query_text: string;
  model: ModelName;
  mentioned: boolean;
  position: number | null;
  sentiment: SentimentName | null;
  citation_url: string | null;
  /** The fixture's timestamps are timezone-naive source wall times. */
  created_at: string;
};

export type MentionsResponse = {
  data: Mention[];
  total: number;
  mentioned_count: number;
  /** Percentage for every record matching the applied filters, not just the current page. */
  mention_rate: number;
  page: number;
  per_page: number;
};

export type TrendPoint = {
  date: string;
  total: number;
  mentioned: number;
};

export type TrendsResponse = { data: TrendPoint[] };
