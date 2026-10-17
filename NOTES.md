# Implementation notes

## Decisions and trade-offs

- I followed the exercise requirement to use the supplied SQLite dataset seeded from the repository-root `seed_data.sql`. I did not convert the fixture to another database engine like PostgreSQL which I would have preferred.
- I retained the supplied FastAPI and Next.js App Router approach and kept the implementation intentionally simplistic.
- Filtering, counts, pagination, ordering, and daily/weekly chart aggregation are designed to run in SQL. The day/week bucket is selected from a fixed allowlist; filter values are supplied as SQL parameters.
- Date filters are inclusive from the user's perspective. The query starts at midnight on `date_from` and uses an exclusive midnight after `date_to` so timestamps throughout the ending day are included.
- Weekly trend buckets start on Monday. If the requested date range begins mid-week, its first weekly label can precede `date_from`; only records inside the requested range contribute to the counts.
- The trend chart uses the selected date range. Model and sentiment filters apply to the table only, and the interface explains this distinction.
- The seed script recreates the SQLite file from the supplied SQL when explicitly run. This makes demo setup repeatable, but it is destructive to any changes in that database. It should not be run as part of every application restart or deployment.
- I kept the code focused on the exercise rather than adding authentication, a migration framework, container orchestration, or a large service layer.

## Known limitations and what I would improve with more time

1. **More resilient persistence:** SQLite is the right choice for this exercise because the instructions explicitly require the supplied SQLite data. For a longer-lived production service, I would migrate to a more resilient persistent database such as PostgreSQL, with the database stored on persistent storage and automated, tested backups. That would make recovery from server/disk failure and deployment changes easier, and avoid relying on a single application-local database file. PostgreSQL alone does not prevent data loss; durable storage, backup/restore procedures, and monitoring are also required. For the current SQLite deployment, place the database on a persistent disk path and back it up rather than keeping it on an ephemeral filesystem.
2. Run the API regression tests and a Next.js production build in the final target environment before submitting; record their actual outcomes below.
3. Add request cancellation or stale-response protection if users rapidly change filters.
4. Review `EXPLAIN QUERY PLAN` against relevant filter combinations before adding further indexes. Existing indexes come from the supplied seed schema and should be measured rather than assumed optimal.
5. Add a schema migration strategy if this grows beyond the exercise. Keep database initialization separate from routine application startup.
6. Define and document a timezone policy if incoming records later originate across time zones. The supplied timestamps are timezone-naive.
7. Add rate limiting or authentication only if the public-demo requirements change.

## Time spent

Enter the actual time spent before submitting. Do not estimate or backdate it.

## Verification status

- Source-level changes and package contents should be checked before publishing.
- Run `python seed_db.py` to verify the seed file creates the expected 10,000 rows, then run `pytest -q` against the disposable test database fixtures.
- Run `npm ci && npm run build` in `frontend/` with a supported Node.js version.
- Record the actual test/build outcomes after those commands have run; do not claim a check passed unless it did.
