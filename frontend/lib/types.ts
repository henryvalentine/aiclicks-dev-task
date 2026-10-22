export type ModelName = "chatgpt" | "claude" | "gemini" | "perplexity";
export type SentimentName = "positive" | "neutral" | "negative";
export type GroupBy = "day" | "week";

export type MentionFilters = {
  models: ModelName[];
  sentiments: SentimentName[];
  date_from: string;
  date_to: string;
  query: string;
};

export type Mention = {
  id: string;
  query_text: string;
  model: ModelName;
  mentioned: boolean;
  position: number | null;
  sentiment: SentimentName | null;
  citation_url: string | null;
  /** The supplied source timestamps are timezone-naive wall times. */
  created_at: string;
};

export type ModelRate = {
  model: ModelName;
  total: number;
  mentioned_count: number;
  mention_rate: number;
};

export type SentimentCounts = {
  positive: number;
  neutral: number;
  negative: number;
};

export type MentionsResponse = {
  data: Mention[];
  total: number;
  mentioned_count: number;
  mention_rate: number;
  average_position: number | null;
  positive_sentiment_rate: number;
  sentiment_counts: SentimentCounts;
  model_rates: ModelRate[];
  page: number;
  per_page: number;
};

export type TrendPoint = {
  date: string;
  total: number;
  mentioned: number;
};

export type TrendsResponse = { data: TrendPoint[] };
