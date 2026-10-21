"""API regression tests against temporary SQLite databases seeded from the supplied SQL."""
import sqlite3
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import main
from db_config import readonly_database_uri
from models import MentionFilters

SEED_SQL = Path(main.__file__).resolve().parent.parent / "seed_data.sql"


@pytest.fixture
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "mentions-test.db"
    with sqlite3.connect(db_path) as connection:
        connection.executescript(SEED_SQL.read_text(encoding="utf-8"))
    monkeypatch.setattr(main, "DB_PATH", db_path)
    with TestClient(main.app) as test_client:
        yield test_client


def test_health_reports_database_available(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "available"}


def test_health_reports_missing_schema(tmp_path, monkeypatch):
    db_path = tmp_path / "empty.db"
    sqlite3.connect(db_path).close()
    monkeypatch.setattr(main, "DB_PATH", db_path)
    with TestClient(main.app) as test_client:
        response = test_client.get("/health")
    assert response.status_code == 503
    assert response.json()["detail"] == "Database unavailable or schema not ready"


def test_api_database_uri_is_read_only(client):
    with pytest.raises(sqlite3.OperationalError, match="readonly"):
        with sqlite3.connect(readonly_database_uri(main.DB_PATH), uri=True) as connection:
            connection.execute("DELETE FROM mentions WHERE id = ?", ("m00001",))


def test_pagination_and_response_contract(client):
    response = client.post("/mentions", json={"page": 1, "per_page": 10})
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 10000
    assert len(body["data"]) == 10
    assert body["page"] == 1 and body["per_page"] == 10
    assert body["mentioned_count"] > 0
    assert body["mention_rate"] == pytest.approx(body["mentioned_count"] / body["total"] * 100, abs=0.1)
    assert body["average_position"] is not None
    assert 0 <= body["positive_sentiment_rate"] <= 100
    assert {item["model"] for item in body["model_rates"]} == {"chatgpt", "claude", "gemini", "perplexity"}
    assert isinstance(body["data"][0]["mentioned"], bool)
    assert set(body["data"][0]) == {
        "id", "query_text", "model", "mentioned", "position", "sentiment", "citation_url", "created_at"
    }


def test_summary_metrics_are_calculated_for_all_matching_records(client):
    request = {
        "page": 1,
        "per_page": 5,
        "filters": {
            "model": "chatgpt",
            "sentiment": "positive",
            "date_from": "2025-03-25",
            "date_to": "2025-03-25",
        },
    }
    response = client.post("/mentions", json=request)
    assert response.status_code == 200
    body = response.json()
    with sqlite3.connect(main.DB_PATH) as connection:
        expected_total, expected_mentioned = connection.execute(
            """SELECT COUNT(*), COALESCE(SUM(CASE WHEN mentioned = 1 THEN 1 ELSE 0 END), 0)
               FROM mentions
               WHERE model = ? AND sentiment = ? AND created_at >= ? AND created_at < ?""",
            ("chatgpt", "positive", "2025-03-25", "2025-03-26"),
        ).fetchone()
    assert body["total"] == expected_total
    assert body["mentioned_count"] == expected_mentioned
    assert len(body["data"]) == min(5, expected_total)
    assert body["mention_rate"] == pytest.approx(expected_mentioned / expected_total * 100, abs=0.1)


def test_filters_and_inclusive_end_date(client):
    response = client.post("/mentions", json={
        "page": 1, "per_page": 100,
        "filters": {"model": "chatgpt", "sentiment": "positive", "date_from": "2025-03-25", "date_to": "2025-03-25"},
    })
    assert response.status_code == 200
    rows = response.json()["data"]
    assert rows, "fixture should contain matching records on the inclusive date"
    for row in rows:
        assert row["model"] == "chatgpt"
        assert row["sentiment"] == "positive"
        assert row["created_at"].startswith("2025-03-25")


def test_invalid_filters_and_pages_are_rejected(client):
    bad_model = client.post("/mentions", json={"filters": {"model": "other-model"}})
    bad_sentiment = client.post("/mentions", json={"filters": {"sentiment": "mixed"}})
    bad_range = client.post("/mentions/trends", json={"date_from": "2025-03-01", "date_to": "2025-01-01"})
    bad_date = client.post("/mentions/trends", json={"date_from": "2025-02-30"})
    bad_page = client.post("/mentions", json={"page": 0})
    bad_page_size = client.post("/mentions", json={"per_page": 1000})
    bad_group = client.post("/mentions/trends", json={"group_by": "month"})
    assert all(response.status_code == 422 for response in (
        bad_model, bad_sentiment, bad_range, bad_date, bad_page, bad_page_size, bad_group
    ))


def test_trends_are_aggregated_in_sql_and_weekly_buckets_start_monday(client):
    daily = client.post("/mentions/trends", json={"date_from": "2025-01-01", "date_to": "2025-01-07", "group_by": "day"})
    weekly = client.post("/mentions/trends", json={"date_from": "2025-01-01", "date_to": "2025-01-07", "group_by": "week"})
    assert daily.status_code == 200 and len(daily.json()["data"]) == 7
    assert weekly.status_code == 200 and len(weekly.json()["data"]) == 2
    assert weekly.json()["data"][0]["date"] == "2024-12-30"
    assert all(point["total"] >= point["mentioned"] for point in daily.json()["data"])


def test_empty_results_return_valid_response(client):
    response = client.post("/mentions", json={"filters": {"model": "gemini", "date_from": "2020-01-01", "date_to": "2020-01-02"}})
    assert response.status_code == 200
    body = response.json()
    assert body["data"] == []
    assert body["total"] == 0
    assert body["mentioned_count"] == 0
    assert body["mention_rate"] == 0
    assert body["page"] == 1


def test_multi_select_filters_and_literal_query_search(client):
    response = client.post("/mentions", json={
        "page": 1,
        "per_page": 100,
        "filters": {
            "models": ["chatgpt", "gemini"],
            "sentiments": ["positive", "neutral"],
            "date_from": "2025-03-01",
            "date_to": "2025-03-31",
            "query": "project management",
        },
    })
    assert response.status_code == 200
    body = response.json()
    assert body["data"]
    assert all(row["model"] in {"chatgpt", "gemini"} for row in body["data"])
    assert all(row["sentiment"] in {"positive", "neutral"} for row in body["data"])
    assert all("project management" in row["query_text"].lower() for row in body["data"])
    assert all(row["created_at"][:10].startswith("2025-03-") for row in body["data"])


def test_trends_apply_the_same_model_sentiment_and_query_filters(client):
    response = client.post("/mentions/trends", json={
        "date_from": "2025-03-01",
        "date_to": "2025-03-07",
        "models": ["claude"],
        "sentiments": ["positive"],
        "query": "project management",
        "group_by": "day",
    })
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) <= 7
    with sqlite3.connect(main.DB_PATH) as connection:
        expected = connection.execute(
            """SELECT COUNT(*), COALESCE(SUM(CASE WHEN mentioned = 1 THEN 1 ELSE 0 END), 0)
               FROM mentions WHERE model = ? AND sentiment = ? AND created_at >= ?
               AND created_at < ? AND instr(lower(query_text), lower(?)) > 0""",
            ("claude", "positive", "2025-03-01", "2025-03-08", "project management"),
        ).fetchone()
    assert sum(point["total"] for point in data) == expected[0]
    assert sum(point["mentioned"] for point in data) == expected[1]


def test_model_comparison_uses_the_same_model_and_sentiment_filters(client):
    response = client.post("/mentions", json={
        "filters": {
            "models": ["chatgpt"],
            "sentiments": ["negative"],
            "date_from": "2025-01-01",
            "date_to": "2025-03-31",
        }
    })
    assert response.status_code == 200
    body = response.json()
    model_rates = {row["model"]: row for row in body["model_rates"]}
    assert model_rates["chatgpt"]["total"] == body["total"]
    assert model_rates["chatgpt"]["mentioned_count"] == body["mentioned_count"]
    assert model_rates["chatgpt"]["mention_rate"] == body["mention_rate"]
    assert model_rates["gemini"]["total"] == 0
    assert model_rates["gemini"]["mention_rate"] == 0


def test_export_returns_filtered_csv(client):
    response = client.post("/mentions/export", json={
        "models": ["claude"],
        "date_from": "2025-01-01",
        "date_to": "2025-03-31",
    })
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert 'attachment; filename="aiclicks-mentions.csv"' in response.headers["content-disposition"]
    content = response.content.decode("utf-8-sig")
    lines = content.splitlines()
    assert lines[0] == "id,query_text,model,mentioned,position,sentiment,citation_url,created_at"
    assert len(lines) > 1
    assert all(",claude," in line for line in lines[1:])
    assert all(",2025-" in line for line in lines[1:])


def test_conflicting_singular_and_multi_select_filters_are_rejected(client):
    response = client.post("/mentions", json={
        "filters": {"model": "chatgpt", "models": ["claude"]}
    })
    assert response.status_code == 422


def test_search_query_is_lowercased_and_sanitized(client):
    response = client.post("/mentions", json={
        "page": 1,
        "per_page": 100,
        "filters": {"query": "PROJECT management!!"},
    })
    assert response.status_code == 200
    rows = response.json()["data"]
    assert rows
    assert all("project management" in row["query_text"].lower() for row in rows)


def test_search_sanitization_removes_sql_like_punctuation(client):
    response = client.post("/mentions", json={
        "page": 1,
        "per_page": 100,
        "filters": {"query": "project%' OR 1=1 -- management"},
    })
    assert response.status_code == 200
    body = response.json()
    # The query is normalized into a safe literal phrase and cannot turn into a SQL predicate.
    assert body["total"] < 10000
    assert all("project or 11 management" in row["query_text"].lower() for row in body["data"])


def test_search_query_normalization_removes_punctuation_and_lowercases():
    filters = MentionFilters(query="PROJECT management!!")
    assert filters.query == "project management"
    injection_like = MentionFilters(query="PROJECT%' OR 1=1 -- management")
    assert injection_like.query == "project or 11 management"
