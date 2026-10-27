"""
Persistence for user accounts, saved properties, predictions, and model
evaluation snapshots.

DATABASE_URL picks the backend. Locally it defaults to a SQLite file; the
Vercel deployment points it at a Postgres database (Neon), which needs the
psycopg driver from requirements.txt.
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./house_price.db")

if DATABASE_URL.startswith("sqlite"):
    # SQLite connections are thread-bound by default; FastAPI uses a pool.
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # pool_pre_ping drops connections the serverless Postgres closed while idle.
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
