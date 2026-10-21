"""Validated request and response contracts for the mentions dashboard."""
from datetime import date, datetime
import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

ModelName = Literal["chatgpt", "claude", "gemini", "perplexity"]
SentimentName = Literal["positive", "neutral", "negative"]


class MentionFilters(BaseModel):
    """Filters accepted by the table, summary metrics, trends and CSV export.

    `model` and `sentiment` remain available for backward compatibility. New clients
    can select multiple values with `models` and `sentiments`.
    """

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    model: ModelName | None = None
    sentiment: SentimentName | None = None
    models: list[ModelName] = Field(default_factory=list, max_length=4)
    sentiments: list[SentimentName] = Field(default_factory=list, max_length=3)
    date_from: date | None = None
    date_to: date | None = None
    query: str | None = Field(default=None, max_length=200)

    @field_validator("query", mode="before")
    @classmethod
    def normalize_query(cls, value):
        """Normalize the dashboard search term; SQL values are still always parameterized."""
        if value is None or not isinstance(value, str):
            return value
        normalized = re.sub(r"[^a-z0-9\s]", "", value.lower())
        return " ".join(normalized.split())[:200]

    @model_validator(mode="after")
    def check_filter_contract(self):
        if self.date_from and self.date_to and self.date_from > self.date_to:
            raise ValueError("date_from must be on or before date_to")
        if self.model and self.models:
            raise ValueError("Use either model or models, not both")
        if self.sentiment and self.sentiments:
            raise ValueError("Use either sentiment or sentiments, not both")
        if len(set(self.models)) != len(self.models):
            raise ValueError("models must not contain duplicates")
        if len(set(self.sentiments)) != len(self.sentiments):
            raise ValueError("sentiments must not contain duplicates")
        return self


class MentionsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=25, ge=1, le=100)
    filters: MentionFilters | None = None


class TrendsRequest(MentionFilters):
    """Trend request accepts the same flat filter fields as the mentions API."""

    group_by: Literal["day", "week"] = "day"

    def to_filters(self) -> MentionFilters:
        return MentionFilters.model_validate(self.model_dump(exclude={"group_by"}))


class Mention(BaseModel):
    id: str
    query_text: str
    model: str
    mentioned: bool
    position: int | None = None
    sentiment: str | None = None
    citation_url: str | None = None
    created_at: datetime


class ModelRate(BaseModel):
    model: ModelName
    total: int
    mentioned_count: int
    mention_rate: float


class MentionsResponse(BaseModel):
    data: list[Mention]
    total: int
    mentioned_count: int
    mention_rate: float
    average_position: float | None
    positive_sentiment_rate: float
    model_rates: list[ModelRate]
    page: int
    per_page: int


class TrendPoint(BaseModel):
    date: str
    total: int
    mentioned: int


class TrendsResponse(BaseModel):
    data: list[TrendPoint]
