"""HTTP API for browsing and aggregating AI brand mentions in SQLite."""
from contextlib import asynccontextmanager
from datetime import timedelta
import os

import aiosqlite
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from db_config import database_path, readonly_database_uri
from models import MentionFilters, MentionsRequest, MentionsResponse, TrendsRequest, TrendsResponse

DB_PATH = database_path()
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not DB_PATH.is_file():
        raise RuntimeError(
            f"SQLite database not found at {DB_PATH}. Run `python seed_db.py` from backend/ first."
        )
    yield


app = FastAPI(title="Brand Mentions API", version="1.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


def add_date_filters(clauses: list[str], params: list, date_from, date_to) -> None:
    """Append parameterized SQLite timestamp predicates; both user dates are inclusive."""
    if date_from:
        clauses.append("created_at >= ?")
        params.append(date_from.isoformat())
    if date_to:
        clauses.append("created_at < ?")
        params.append((date_to + timedelta(days=1)).isoformat())


def where_clause(clauses: list[str]) -> str:
    return f"WHERE {' AND '.join(clauses)}" if clauses else ""


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
    clauses: list[str] = []
    params: list = []
    if filters.model:
        clauses.append("model = ?")
        params.append(filters.model)
    if filters.sentiment:
        clauses.append("sentiment = ?")
        params.append(filters.sentiment)
    add_date_filters(clauses, params, filters.date_from, filters.date_to)
    where_sql = where_clause(clauses)
    offset = (request.page - 1) * request.per_page

    try:
        async with aiosqlite.connect(readonly_database_uri(DB_PATH), uri=True) as db:
            db.row_factory = aiosqlite.Row
            summary_cursor = await db.execute(
                f"""SELECT COUNT(*) AS total,
                           COALESCE(SUM(CASE WHEN mentioned = 1 THEN 1 ELSE 0 END), 0) AS mentioned_count
                    FROM mentions {where_sql}""",
                params,
            )
            summary = await summary_cursor.fetchone()
            total = int(summary["total"])
            mentioned_count = int(summary["mentioned_count"])
            mention_rate = round((mentioned_count / total) * 100, 1) if total else 0.0

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
        "page": request.page,
        "per_page": request.per_page,
    }


@app.post("/mentions/trends", response_model=TrendsResponse)
async def mention_trends(request: TrendsRequest):
    clauses: list[str] = []
    params: list = []
    add_date_filters(clauses, params, request.date_from, request.date_to)
    where_sql = where_clause(clauses)
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
