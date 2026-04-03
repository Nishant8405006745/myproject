import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

_raw_url = os.getenv("DATABASE_URL", "sqlite:///./accounting.db")
# Render / Heroku sometimes use postgres:// — SQLAlchemy expects postgresql://
if _raw_url.startswith("postgres://"):
    _raw_url = _raw_url.replace("postgres://", "postgresql://", 1)

SQLALCHEMY_DATABASE_URL = _raw_url

_connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    _connect_args["check_same_thread"] = False
elif SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    # Render Postgres (and most managed Postgres) requires TLS
    url_lower = SQLALCHEMY_DATABASE_URL.lower()
    if "sslmode" not in url_lower and "ssl=" not in url_lower:
        _connect_args["sslmode"] = "require"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=_connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
