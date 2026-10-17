from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Brand Mentions API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# TODO: Initialize database connection (use aiosqlite)
# TODO: Implement POST /mentions endpoint (see README for spec)
# TODO: Implement POST /mentions/trends endpoint (see README for spec)


@app.get("/health")
async def health():
    return {"status": "ok"}
