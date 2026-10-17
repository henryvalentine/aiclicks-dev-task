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

1. **More resilient persistence:** SQLite is the right choice for this exercise because the instructions explicitly require the supplied SQLite dataset. For a longer-lived production service, I would evaluate migrating to PostgreSQL and pair it with durable storage, automated backups, tested restore procedures, and monitoring. PostgreSQL alone does not prevent data loss. For the current SQLite deployment, I would make the database file's location and backup procedure explicit and verify that it is kept on durable OCI storage rather than temporary or replaceable storage.

2. **Automated regression and deployment checks:** On 17 October 2026, the Next.js production build completed successfully on OCI using Next.js 15.5.14. Smoke checks confirmed that the public homepage, `GET /health`, and `POST /mentions` returned HTTP 200; the mentions response reported 10,000 records, and I verified that the dashboard worked in the browser. With more time, I would add repeatable automated API and UI regression tests to CI, covering filters, pagination, date boundaries, trend aggregation, validation errors, and empty states. The successful build and manual smoke checks are useful deployment evidence, but they do not replace a regression suite.

3. **Stale requests:** Add request cancellation or stale-response protection so a slower response for an earlier filter selection cannot overwrite newer results when users change filters rapidly.

4. **Measured query performance:** Review `EXPLAIN QUERY PLAN` for relevant filter combinations before adding indexes. The existing indexes come from the supplied seed schema and should be measured rather than assumed optimal.

5. **Schema changes:** Introduce a schema migration strategy if the application grows beyond the exercise. Keep database initialization separate from routine application startup, and never run the destructive seed/reset script against the live database as part of a normal deployment.

6. **Timezone policy:** Define and document a timezone policy if incoming records later originate across time zones. The supplied timestamps are timezone-naive, so any future timezone handling should be explicit and tested.

7. **Public-demo controls:** Add rate limiting or authentication only if the public-demo requirements change. The current exercise calls for a no-auth demo; any change should also be driven by the expected audience and threat model.

## Time spent

2026-10-17: from 10:37 am to 1: 48 pm (from start to deployment) => 3 hours and 11 minutes.
