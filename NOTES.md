# Implementation notes

## Decisions and trade-offs

- I Followed the exercise requirement to use the supplied SQLite dataset seeded from the repository-root `seed_data.sql`. I did not convert the fixture to another database engine like PostgreSQL which I would have preferred.
- I Kept the backend intentionally small and simplistic: FastAPI and Pydantic validate the API contract, while parameterized SQL performs filters, counts, pagination, ordering, and daily/weekly trend aggregation.
- Summary metrics are calculated by the API over **all records matching the applied filters**, no longer from the current page. `total`, `mentioned_count`, and `mention_rate` now accompany the paginated response so the dashboard does not mislabel page-level values as dataset totals.
- Date filters are inclusive from the user's perspective. The query starts at midnight on `date_from` and uses an exclusive midnight after `date_to` so timestamps throughout the ending day are included.
- Source `created_at` values are timezone-naive. The frontend now displays their date/time fields as stored instead of appending `Z` and converting them to the browser timezone. This avoids showing a different calendar day from the source value and date filters. A future ingestion pipeline can establish a real timezone contract before treating these values as instants.
- Weekly trend buckets start on Monday. If the requested date range begins mid-week, the first weekly bucket label can precede `date_from`; only records inside the requested date range contribute to its counts.
- Trends use the selected date range. Model and sentiment filters apply to the records table and summary metrics.
- SQLite path resolution now lives in `backend/db_config.py` and is shared by the API and the seed script. API connections use SQLite read-only mode, and the API no longer enables WAL or sets `busy_timeout` because its request paths only read data for this exercise. The seed script remains an explicit, destructive initialization/reset command.
- The dashboard is now updated to fully use Tailwind CSS v4 utilities for layout and visual styling, with separate components for the header, summary cards, filter bar, trend chart and records table. Fetch logic is encapsulated in a hook, and request effects abort obsolete requests when filters or pagination change.
- Visual design direction was revisited and now tries to mimic a brand-visibility analytics application. The revised UI uses a persistent left navigation, demo-workspace context, teal active states, restrained light surfaces, compact metric cards, clear chart controls, and a structured data table.

## Feedback addressed in this revision

1. **Tailwind usage and visual design:** Reworked the page around Tailwind utilities and a modular SaaS analytics layout informed. The UI now has a persistent desktop sidebar, a responsive mobile navigation, workspace/sample-data context, teal active navigation states, rounded white panels, compact KPI cards, a restrained trend chart, consistent filter controls, and a denser records table.
2. **One oversized page component:** The frontend is now split into into reusable components that include dashboard header, metric cards, filter bar, trend chart and mentions table. I moved the request and cancellation logic into `frontend/lib/use-dashboard-data.ts` and API/format utilities into `frontend/lib/format.ts`.
3. **Incorrect summary values:** The API now calculates the total matching response count, number of matching records where `mentioned = 1`, and the mention rate over the complete filtered result set. The frontend no longer derives global summary cards from the 25 visible rows.
4. **Timezone day shift:** I removed the frontend behavior that appended `Z` to timezone-naive timestamps. Source timestamps are now formatted while preserving their stored date/time fields. Trend labels are formatted without browser-timezone shifts too.
5. **Invalid date range message:** Date-range validation now has its own filter validation state and displays an actionable date-specific message instead of the generic API connectivity message.
6. **Pydantic 422 messages:** Error parsing now handles FastAPI's array of validation details and presents field/message information instead of converting an object to `[object Object]`.
7. **Malformed citations:** Citation values are parsed in a guarded helper. Only valid HTTPS URLs become links, with `noopener noreferrer` to prevent malformed or unsupported values from  crashing rendering.
8. **Duplicate database path code:** I added `backend/db_config.py` to share database path resolution between `main.py` and `seed_db.py`.
9. **SQLite write settings:** I removed unnecessary WAL and `busy_timeout` pragmas from the read-only API. API connections use `mode=ro`, and the health endpoint now checks that the expected `mentions` table is available rather than only running `SELECT 1`.
10. **Python 3.14 dependency issue:** The original `pydantic==2.9.0` pin pulled an older `pydantic-core` build that is not suitable for Python 3.14, leading pip to attempt a native build and fail. I handled the issue with backward compatibility in my previous submission, but I have now updated the pinned stack to FastAPI `0.136.3`, Pydantic `2.14.1`, and Uvicorn `0.53.0`, which declare support for Python 3.14; `aiosqlite`, `python-dotenv`, pytest and HTTPX pins were updated as well. This is to make replication easier now.

## Issues encountered and how they were resolved

### Python environment and packages

- Problem: The project pins `pydantic==2.9.0`. Under Python 3.14, its associated `pydantic-core` dependency lacked a compatible prebuilt wheel, so `pip` attempted to compile Rust code and failed because the Microsoft C++ linker (`link.exe`) was missing.
- Solution: Python 3.12.10 was already installed on my system, so I used it to create a clean virtual environment instead. Compatible prebuilt wheels for the pinned dependencies are available for Python 3.12. I retained the original requirements then.

I had to combine `.\.venv\Scripts\python.exe` with the needed commands from the `backend` directory to get arouund the issue.
I completely missed including this information in my previous submission.

### Windows pytest warning after a passing run

- The pytest completed with **9 passed in 3.58 seconds**. The run still emitted a warning: `StarletteDeprecationWarning` because `httpx` integration in `starlette.testclient` is deprecated in the installed Starlette version and the warning recommends `httpx2`. This is because the development requirements currently pinned `httpx==0.28.1`. I updated backend/requirements-dev.txt to include httpx2 instead of the old httpx==0.28.1 dependency. All nine tests passed on re-run without warnings.

## Known limitations and what I would improve with more time

1. **Persistence and recovery:** SQLite remains the correct choice for the exercise because the supplied SQLite fixture is required. For this deployment, it is better to keep the database at a persistent disk path outside the code checkout and to back it up regularly. For a longer-lived production service, I would evaluate migrating to PostgreSQL and pair it with durable storage, automated backups, tested restore procedures, and monitoring. PostgreSQL alone does not prevent data loss.
2. **Automated regression coverage:** The original task feedback confirmed the six submitted API tests passed. This revision expands the API tests for API-derived summary metrics and missing-schema health checks.
3. **URL-shareable filters and request caching:** Current fetches are now cancellable to prevent stale responses overwriting newer state. For a larger dashboard, I would consider using URL search parameters for shareable filter state and TanStack Query for caching, deduplication and query lifecycle management.
4. **Query tuning:** `EXPLAIN QUERY PLAN` should be reviewed against representative filter combinations and measured before adding compound indexes. The existing indexes come from the supplied seed schema and is not assumed optimal.
5. **Trend filter alignment:** The trend chart is filtered by date range only, while model and sentiment filter the table and summary cards. If the product should support a consistent filtered view, `TrendsRequest` and the trend query need to be extended with those filters and add matching tests.
6. **Weekly labels:** A weekly bucket label can precede `date_from` when the requested range starts mid-week. This is correct for a Monday-start bucket, but the UI could label the bucket range more explicitly.
7. **Security controls:** The current service is a public no-auth demo. If its audience or data sensitivity changes, then authentication, authorization, rate limiting, request-size limits and an abuse/retention policy should all be defined.
8. **Timezone contract:** The current fix preserves the fixture's source wall time and does not infer a timezone. If future data includes real cross-zone events, it can be helpful to store timezone-aware instants (like UTC) and then define how user-selected date filters map to a business timezone.