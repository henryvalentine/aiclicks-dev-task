"""Shared SQLite path and connection configuration for the API and seed script."""

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")


def database_path() -> Path:
    """Resolve MENTIONS_DB_PATH or the default backend/mentions.db path."""
    configured_value = os.getenv("MENTIONS_DB_PATH") or str(BACKEND_DIR / "mentions.db")
    configured = Path(configured_value).expanduser()
    if not configured.is_absolute():
        configured = BACKEND_DIR / configured
    return configured.resolve()


def readonly_database_uri(path: Path | None = None) -> str:
    """Return a SQLite file URI opened in read-only mode by application requests."""
    resolved = (path or database_path()).resolve()
    return f"{resolved.as_uri()}?mode=ro"
