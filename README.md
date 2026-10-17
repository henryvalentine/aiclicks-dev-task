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
