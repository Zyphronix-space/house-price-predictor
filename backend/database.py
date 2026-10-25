"""
SQLite persistence for user accounts, saved properties, predictions, and
model evaluation snapshots.

The path is overridable via the DATABASE_URL env var. On Vercel the code
directory is read-only and the filesystem is ephemeral, so the deployment
points DATABASE_URL at a SQLite file under /tmp: accounts and saved data
reset whenever the instance is recycled (see README, Deployment).
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./house_price.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
