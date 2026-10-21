"""HTTP API for browsing and aggregating AI brand mentions in SQLite."""
import csv
from contextlib import asynccontextmanager
from datetime import timedelta
from io import StringIO
import os

import aiosqlite
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from db_config import database_path, readonly_database_uri
from models import (
    MentionFilters,
    MentionsRequest,
    MentionsResponse,
    ModelRate,
    TrendsRequest,
    TrendsResponse,
)

DB_PATH = database_path()
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

MODEL_ORDER = ("chatgpt", "claude", "gemini", "perplexity")
EXPORT_COLUMNS = (
    "id", "query_text", "model", "mentioned", "position", "sentiment", "citation_url", "created_at"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not DB_PATH.is_file():
        raise RuntimeError(
            f"SQLite database not found at {DB_PATH}. Run `python seed_db.py` from backend/ first."
        )
    yield


app = FastAPI(title="Brand Mentions API", version="1.3.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


def add_date_filters(clauses: list[str], params: list, date_from, date_to) -> None:
    """Append parameterized timestamp predicates; both selected dates are inclusive."""
    if date_from:
        clauses.append("created_at >= ?")
        params.append(date_from.isoformat())
    if date_to:
        clauses.append("created_at < ?")
        params.append((date_to + timedelta(days=1)).isoformat())


def add_mention_filters(
    clauses: list[str],
    params: list,
    filters: MentionFilters,
    *,
    include_model: bool = True,
    include_sentiment: bool = True,
) -> None:
    """Build SQL predicates from allow-listed columns and bound values only."""
    if include_model:
        if filters.model:
            clauses.append("model = ?")
            params.append(filters.model)
        elif filters.models:
            placeholders = ", ".join("?" for _ in filters.models)
            clauses.append(f"model IN ({placeholders})")
            params.extend(filters.models)

    if include_sentiment:
        if filters.sentiment:
            clauses.append("sentiment = ?")
            params.append(filters.sentiment)
        elif filters.sentiments:
            placeholders = ", ".join("?" for _ in filters.sentiments)
            clauses.append(f"sentiment IN ({placeholders})")
            params.extend(filters.sentiments)

    add_date_filters(clauses, params, filters.date_from, filters.date_to)

    query = (filters.query or "").strip()
    if query:
        # instr() makes a literal substring search, so % and _ are not wildcards.
        clauses.append("instr(lower(query_text), lower(?)) > 0")
        params.append(query)


def build_where(filters: MentionFilters, *, include_model: bool = True, include_sentiment: bool = True):
    clauses: list[str] = []
    params: list = []
    add_mention_filters(
        clauses, params, filters,
        include_model=include_model,
        include_sentiment=include_sentiment,
    )
    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    return where_sql, params


@app.get("/health")
async def health():
    """Check database connectivity and the expected table, not just process liveness."""
    try:
        async with aiosqlite.connect(readonly_database_uri(DB_PATH), uri=True) as db:
            await db.execute("SELECT 1 FROM mentions LIMIT 1")
        return {"status": "ok", "database": "available"}
    except (aiosqlite.Error, OSError) as exc:
        raise HTTPException(status_code=503, detail="Database unavailable or schema not ready") from exc


@app.post("/mentions", response_model=MentionsResponse)
async def list_mentions(request: MentionsRequest):
    filters = request.filters or MentionFilters()
    where_sql, params = build_where(filters)
    offset = (request.page - 1) * request.per_page

    # Model rates use the same filtered population as the summary cards and trend/table.
    model_where_sql, model_params = build_where(filters)

    try:
        async with aiosqlite.connect(readonly_database_uri(DB_PATH), uri=True) as db:
            db.row_factory = aiosqlite.Row
            summary_cursor = await db.execute(
                f"""SELECT COUNT(*) AS total,
                           COALESCE(SUM(CASE WHEN mentioned = 1 THEN 1 ELSE 0 END), 0) AS mentioned_count,
                           AVG(CASE WHEN mentioned = 1 THEN position END) AS average_position,
                           COALESCE(SUM(CASE WHEN sentiment IS NOT NULL THEN 1 ELSE 0 END), 0) AS classified_count,
                           COALESCE(SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END), 0) AS positive_count
                    FROM mentions {where_sql}""",
                params,
            )
            summary = await summary_cursor.fetchone()
            total = int(summary["total"])
            mentioned_count = int(summary["mentioned_count"])
            mention_rate = round((mentioned_count / total) * 100, 1) if total else 0.0
            average_position = (
                round(float(summary["average_position"]), 2)
                if summary["average_position"] is not None else None
            )
            classified_count = int(summary["classified_count"])
            positive_count = int(summary["positive_count"])
            positive_sentiment_rate = round((positive_count / classified_count) * 100, 1) if classified_count else 0.0

            model_cursor = await db.execute(
                f"""SELECT model, COUNT(*) AS total,
                           COALESCE(SUM(CASE WHEN mentioned = 1 THEN 1 ELSE 0 END), 0) AS mentioned_count
                    FROM mentions {model_where_sql}
                    GROUP BY model""",
                model_params,
            )
            model_rows = {row["model"]: row for row in await model_cursor.fetchall()}
            model_rates = []
            for model in MODEL_ORDER:
                row = model_rows.get(model)
                model_total = int(row["total"]) if row else 0
                model_mentioned = int(row["mentioned_count"]) if row else 0
                model_rates.append(ModelRate(
                    model=model,
                    total=model_total,
                    mentioned_count=model_mentioned,
                    mention_rate=round((model_mentioned / model_total) * 100, 1) if model_total else 0.0,
                ))

            cursor = await db.execute(
                f"""SELECT id, query_text, model, mentioned, position, sentiment,
                           citation_url, created_at
                    FROM mentions {where_sql}
                    ORDER BY created_at DESC, id DESC
                    LIMIT ? OFFSET ?""",
                [*params, request.per_page, offset],
            )
            rows = await cursor.fetchall()
    except (aiosqlite.Error, OSError) as exc:
        raise HTTPException(status_code=500, detail="Unable to read mentions from the database") from exc

    data = [dict(row) for row in rows]
    for item in data:
        item["mentioned"] = bool(item["mentioned"])
    return {
        "data": data,
        "total": total,
        "mentioned_count": mentioned_count,
        "mention_rate": mention_rate,
        "average_position": average_position,
        "positive_sentiment_rate": positive_sentiment_rate,
        "model_rates": [model.model_dump() for model in model_rates],
        "page": request.page,
        "per_page": request.per_page,
    }


@app.post("/mentions/export")
async def export_mentions(filters: MentionFilters):
    """Download every record matching the selected filters as a CSV file."""
    where_sql, params = build_where(filters)
    try:
        async with aiosqlite.connect(readonly_database_uri(DB_PATH), uri=True) as db:
            cursor = await db.execute(
                f"""SELECT id, query_text, model, mentioned, position, sentiment, citation_url, created_at
                    FROM mentions {where_sql}
                    ORDER BY created_at DESC, id DESC""",
                params,
            )
            rows = await cursor.fetchall()
    except (aiosqlite.Error, OSError) as exc:
        raise HTTPException(status_code=500, detail="Unable to export mentions from the database") from exc

    output = StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(EXPORT_COLUMNS)
    for row in rows:
        values = list(row)
        values[3] = "true" if values[3] else "false"
        writer.writerow(values)
    return Response(
        content="\ufeff" + output.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="aiclicks-mentions.csv"'},
    )


@app.post("/mentions/trends", response_model=TrendsResponse)
async def mention_trends(request: TrendsRequest):
    filters = request.to_filters()
    where_sql, params = build_where(filters)
    # SQLite weekday numbering: Sunday=0. This expression buckets weeks from Monday.
    bucket = (
        "date(created_at)" if request.group_by == "day"
        else "date(created_at, '-' || ((CAST(strftime('%w', created_at) AS INTEGER) + 6) % 7) || ' days')"
    )
    try:
        async with aiosqlite.connect(readonly_database_uri(DB_PATH), uri=True) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                f"""SELECT {bucket} AS date,
                           COUNT(*) AS total,
                           SUM(CASE WHEN mentioned = 1 THEN 1 ELSE 0 END) AS mentioned
                    FROM mentions {where_sql}
                    GROUP BY date
                    ORDER BY date ASC""",
                params,
            )
            rows = await cursor.fetchall()
    except (aiosqlite.Error, OSError) as exc:
        raise HTTPException(status_code=500, detail="Unable to calculate mention trends") from exc
    return {"data": [dict(row) for row in rows]}
