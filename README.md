# AIClicks Brand Mentions Dashboard

A small full-stack dashboard for exploring AI-generated brand mentions. The frontend uses Next.js App Router, React, Tailwind CSS v4 and Recharts. The API uses FastAPI and the **SQLite dataset provided with the exercise**. All filtering, pagination, counts and trend aggregations are performed in SQL.

## Features

- Paginated mentions table with model, sentiment and inclusive date filters
- Daily and Monday-based weekly trend aggregation
- Validated request contracts and predictable error/empty states
- SQLite access through read-only `aiosqlite` connections, parameterized queries and a schema-aware health endpoint
- API-derived summary totals over the complete filtered result set; React fetches cancel stale requests
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

`seed_db.py` creates `backend/mentions.db` from the supplied `seed_data.sql` at the repository root. It deliberately recreates the database, so running it again resets the exercise data. Do not run it against a database containing data you need to preserve. For a custom database location, set `MENTIONS_DB_PATH` before running both the seed script and API. The API fails at startup with a direct message if the database has not been initialized.

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
python -m pytest -q
```

Frontend production check:

```bash
cd frontend
npm ci
npm run typecheck
npm run build
```

The backend tests create and seed a temporary database from the provided SQL file; they do not reset your local `backend/mentions.db`.

## Production deployment

For the OCI deployment at `https://aiclicks.terrainica.com`, see [`docs/OCI_DEPLOYMENT.md`](docs/OCI_DEPLOYMENT.md). The deployed ports are `127.0.0.1:3340` for AIClicks Next.js and `127.0.0.1:8800` for FastAPI; do not take over Terrainica's existing port `3000`. If deployed with SQLite, store `mentions.db` on persistent disk, set explicit file and directory permissions, and arrange backups. Keep the database out of the Git repository. Nginx can serve the Next.js app and proxy API routes to FastAPI.

## Repository files

- `seed_data.sql`: supplied schema and seed records, kept in its original format
- `backend/seed_db.py`: initializes the local SQLite database from that file
- `backend/main.py`: API routes and SQL filters/aggregations
- `backend/db_config.py`: shared database path and read-only URI configuration
- `frontend/components/`: Tailwind-styled dashboard sections
- `frontend/lib/use-dashboard-data.ts`: cancellable API request lifecycle
- `backend/test_api.py`: endpoint regression tests using a temporary seeded database
- `NOTES.md`: implementation choices, limitations and future improvements
