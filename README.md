# Full-Stack Developer Test Task: Brand Mentions Dashboard

## Overview

Build a small full-stack application that displays brand mentions collected from AI model responses. The app should let users browse mentions in a table, filter them, and see a trend chart.

**Time limit:** 3–4 hours. We value simplicity and clean code over completeness — if you run out of time, leave a note on what you'd do next.

---

## What You're Building

An analytics dashboard for tracking how often a brand is mentioned across AI models (ChatGPT, Claude, Gemini, Perplexity). The seed database contains ~10,000 mention records.

### Backend (Python / FastAPI)

Build a REST API with these endpoints:

**1. `POST /mentions`** — List mentions with filtering and pagination

Request body:
```json
{
  "page": 1,
  "per_page": 25,
  "filters": {
    "model": "chatgpt",          // optional, filter by AI model
    "sentiment": "positive",     // optional: positive, neutral, negative
    "date_from": "2025-01-01",   // optional
    "date_to": "2025-03-01"      // optional
  }
}
```

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "query_text": "best project management tools",
      "model": "chatgpt",
      "mentioned": true,
      "position": 2,
      "sentiment": "positive",
      "citation_url": "https://example.com/review",
      "created_at": "2025-02-15T10:30:00Z"
    }
  ],
  "total": 487,
  "page": 1,
  "per_page": 25
}
```

**2. `POST /mentions/trends`** — Daily mention counts for a chart

Request body:
```json
{
  "date_from": "2025-01-01",
  "date_to": "2025-03-01",
  "group_by": "day"              // "day" or "week"
}
```

Response:
```json
{
  "data": [
    { "date": "2025-01-01", "total": 12, "mentioned": 8 },
    { "date": "2025-01-02", "total": 15, "mentioned": 11 }
  ]
}
```

**Requirements:**
- Use the provided SQLite database (seeded from `seed_data.sql`)
- Aggregations should happen in SQL, not Python
- Handle edge cases (invalid filters, empty results)

### Frontend (React / Next.js)

Build a single dashboard page with:

1. **Mentions table** — paginated, shows all fields from the API
2. **Filter controls** — dropdowns/inputs for model, sentiment, date range
3. **Trend chart** — line or bar chart showing mentions over time (use any charting library)
4. **Loading and empty states**

**Requirements:**
- Use React with Next.js (App Router)
- Style with Tailwind CSS
- Responsive layout (works on desktop and tablet)

---

## Getting Started

> **Heads up:** Some dependencies or configurations in the scaffold may not work perfectly out of the box. Fixing these issues is part of the task — treat it like inheriting a real codebase.

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python seed_db.py        # Creates and seeds the SQLite database
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## What We're Evaluating

| Area | What we look for |
|------|-----------------|
| **SQL** | Do aggregations happen in the database? Are queries efficient? |
| **API design** | Clean request/response contracts, proper error handling |
| **React** | Component structure, data fetching patterns, state management |
| **UI/UX** | Does it look polished? Loading states, empty states, responsiveness |
| **Code quality** | Readability, simplicity, no over-engineering |
| **Pragmatism** | Smart trade-offs within the time limit |

---

## Deliverables

1. Push your code to a **public GitHub repo**
2. **Deploy the app** — host the frontend and backend wherever you want (Vercel, Railway, Fly.io, etc.)
3. Send us:
   - A link to your **repo**
   - A link to the **live version** (no auth — we should be able to open it and use it immediately)
4. Include a brief `NOTES.md` in the repo with:
   - Any trade-offs or shortcuts you made
   - What you'd improve with more time
   - How long you actually spent

---

## Rules

- You can use any libraries you want (we've suggested some in the scaffold)
- You can use AI tools (Copilot, ChatGPT, etc.) — we care about the result, not how you got there
- Don't over-engineer — we'd rather see a clean, simple solution than a complex one
- If something is unclear, make a reasonable assumption and note it in NOTES.md
---

# SOLUTION: AIClicks Brand Mentions Dashboard

A small full-stack dashboard for exploring AI-generated brand mentions. The frontend uses Next.js App Router, React and Recharts. The API uses FastAPI and the **SQLite dataset provided with the exercise**. All filtering, pagination, counts and trend aggregations are performed in SQL.

## Features

- Paginated mentions table with model, sentiment and inclusive date filters
- Daily and Monday-based weekly trend aggregation
- Validated request contracts and predictable error/empty states
- SQLite access through `aiosqlite`, parameterized queries and a health endpoint
- Seed loader that uses the provided root-level `seed_data.sql` (10,000 records)

## Local development

Requirements: Python 3.10+, Node.js 20+ and npm.

### 1. Start the API

```bash
cd backend
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seed_db.py
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

`seed_db.py` creates `backend/mentions.db` from the supplied `seed_data.sql` at the repository root. It deliberately recreates the database, so running it again resets the exercise data. Therefore, this shpould not be ran against a database containing data you need to preserve. For a custom database location, set `MENTIONS_DB_PATH` before running both the seed script and API. The API fails at startup with a direct message if the database has not been initialized.

API docs: <http://localhost:8000/docs>; health check: <http://localhost:8000/health>.

### 2. Start the dashboard

In a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open <http://localhost:3000>. The frontend uses `NEXT_PUBLIC_API_URL`, defaulting to `http://localhost:8000`. For production builds, set that variable to the public API origin (or same-origin URL if Nginx proxies API paths).

### 3. Run checks

```bash
cd backend
pip install -r requirements-dev.txt
pytest -q
```

Frontend production check:

```bash
cd frontend
npm ci
npm run build
```

The backend tests create and seed a temporary database from the provided SQL file; they do not reset your local `backend/mentions.db`.

## Production deployment

For the OCI deployment at `https://aiclicks.terrainica.com`, see [`docs/OCI_DEPLOYMENT.md`](docs/OCI_DEPLOYMENT.md). If deployed with SQLite, store `mentions.db` on persistent disk, set explicit file and directory permissions, and arrange backups. Keep the database out of the Git repository. Nginx can serve the Next.js app and proxy API routes to FastAPI.

## Repository files

- `seed_data.sql`: supplied schema and seed records, kept in its original format
- `backend/seed_db.py`: initializes the local SQLite database from that file
- `backend/main.py`: API routes and SQL filters/aggregations
- `backend/test_api.py`: endpoint regression tests using a temporary seeded database
- `NOTES.md`: implementation choices, limitations and future improvements
