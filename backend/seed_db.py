"""Create and seed the local SQLite database from the supplied seed_data.sql.

WARNING: This command intentionally recreates the database. It is an initialization/reset
command, not a normal application startup or deployment command.
"""
import sqlite3
from pathlib import Path

from db_config import BACKEND_DIR, database_path

ROOT_DIR = BACKEND_DIR.parent


def seed() -> None:
    db_path = database_path()
    seed_path = ROOT_DIR / "seed_data.sql"
    if not seed_path.is_file():
        raise FileNotFoundError(f"Seed file not found: {seed_path}")
    db_path.parent.mkdir(parents=True, exist_ok=True)

    # The supplied SQL creates the table/indexes and inserts the 10,000 fixture records.
    # A separate DB file is rebuilt so the command can be rerun predictably for the demo.
    if db_path.exists():
        db_path.unlink()
    try:
        with sqlite3.connect(db_path) as connection:
            connection.executescript(seed_path.read_text(encoding="utf-8"))
            count = connection.execute("SELECT COUNT(*) FROM mentions").fetchone()[0]
    except Exception:
        db_path.unlink(missing_ok=True)
        raise
    print(f"SQLite database created at {db_path}")
    print(f"Seeded {count:,} mention records from {seed_path.name}")


if __name__ == "__main__":
    seed()
