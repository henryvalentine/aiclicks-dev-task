"""Validated request and response contracts for the mentions API."""
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

ModelName = Literal["chatgpt", "claude", "gemini", "perplexity"]
SentimentName = Literal["positive", "neutral", "negative"]

class MentionFilters(BaseModel):
    model_config = ConfigDict(extra="forbid")
    model: ModelName | None = None
    sentiment: SentimentName | None = None
    date_from: date | None = None
    date_to: date | None = None

    @model_validator(mode="after")
    def check_date_range(self):
        if self.date_from and self.date_to and self.date_from > self.date_to:
            raise ValueError("date_from must be on or before date_to")
        return self

class MentionsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=25, ge=1, le=100)
    filters: MentionFilters | None = None

class TrendsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    date_from: date | None = None
    date_to: date | None = None
    group_by: Literal["day", "week"] = "day"

    @model_validator(mode="after")
    def check_date_range(self):
        if self.date_from and self.date_to and self.date_from > self.date_to:
            raise ValueError("date_from must be on or before date_to")
        return self

class Mention(BaseModel):
    id: str
    query_text: str
    model: str
    mentioned: bool
    position: int | None = None
    sentiment: str | None = None
    citation_url: str | None = None
    created_at: datetime

class MentionsResponse(BaseModel):
    data: list[Mention]
    total: int
    mentioned_count: int
    mention_rate: float
    page: int
    per_page: int

class TrendPoint(BaseModel):
    date: str
    total: int
    mentioned: int

class TrendsResponse(BaseModel):
    data: list[TrendPoint]
