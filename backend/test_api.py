"""API regression tests against a temporary database seeded from the supplied SQL file."""
import sqlite3
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import main

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

def test_pagination_and_response_contract(client):
    response = client.post("/mentions", json={"page": 1, "per_page": 10})
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 10000
    assert len(body["data"]) == 10
    assert body["page"] == 1 and body["per_page"] == 10
    assert isinstance(body["data"][0]["mentioned"], bool)
    assert set(body["data"][0]) == {
        "id", "query_text", "model", "mentioned", "position", "sentiment", "citation_url", "created_at"
    }

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

def test_invalid_filters_are_rejected(client):
    bad_model = client.post("/mentions", json={"filters": {"model": "other-model"}})
    bad_range = client.post("/mentions/trends", json={"date_from": "2025-03-01", "date_to": "2025-01-01"})
    bad_page_size = client.post("/mentions", json={"per_page": 1000})
    assert bad_model.status_code == 422
    assert bad_range.status_code == 422
    assert bad_page_size.status_code == 422

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
    assert response.json()["data"] == []
    assert response.json()["total"] == 0
