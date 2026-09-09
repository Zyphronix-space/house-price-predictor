"""
SQLite persistence for user accounts, saved properties, predictions, and
model evaluation snapshots.

The path is overridable via the DATABASE_URL env var. This matters on
platforms like Azure App Service, where the app's own code directory is
extracted fresh into an ephemeral location on every restart, a relative
path there would silently lose all data on restart. Set DATABASE_URL to a
file under /home (Azure's persistent, network-mounted storage) in that
environment.
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
