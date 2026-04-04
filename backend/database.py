import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

_raw_url = os.getenv("DATABASE_URL", "sqlite:///./accounting.db")
# Render / Heroku / some hosts use postgres:// — SQLAlchemy expects postgresql://
if _raw_url.startswith("postgres://"):
    _raw_url = _raw_url.replace("postgres://", "postgresql://", 1)

SQLALCHEMY_DATABASE_URL = _raw_url

_connect_args = {}
_engine_kwargs = {}

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    _connect_args["check_same_thread"] = False
elif SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    url_lower = SQLALCHEMY_DATABASE_URL.lower()
    if "sslmode" not in url_lower and "ssl=" not in url_lower:
        _connect_args["sslmode"] = "require"
    # Supabase transaction pooler (port 6543 / ?pgbouncer=true) — no prepared statements; use NullPool
    if "pgbouncer=true" in url_lower or ":6543" in SQLALCHEMY_DATABASE_URL:
        _engine_kwargs["poolclass"] = NullPool

_engine_kwargs.setdefault("pool_pre_ping", True)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=_connect_args,
    **_engine_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
