import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import logging
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
import models
from database import engine, SessionLocal
from routers import auth_router, users_router, permissions_router, accounting_router, profile_router, notifications_router, messages_router

_log = logging.getLogger("uvicorn.error")

_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_static_env = os.environ.get("STATIC_DIR")
STATIC_DIR = os.path.abspath(_static_env) if _static_env else os.path.join(_BACKEND_DIR, "static")
HAS_FRONTEND = os.path.isdir(STATIC_DIR) and os.path.isfile(os.path.join(STATIC_DIR, "index.html"))

# Create all tables
models.Base.metadata.create_all(bind=engine)


def _auto_seed_admin_if_enabled() -> None:
    """If AUTO_SEED_ADMIN=1|true|yes and no admin@acme.com exists, create demo admin (for first deploy on Render)."""
    if os.getenv("AUTO_SEED_ADMIN", "").lower() not in ("1", "true", "yes"):
        return
    db = SessionLocal()
    try:
        if db.query(models.User).filter(func.lower(models.User.email) == "admin@acme.com").first():
            return
        from auth import get_password_hash

        db.add(
            models.User(
                name="Super Admin",
                email="admin@acme.com",
                password_hash=get_password_hash("Admin@123"),
                role="admin",
                department="Administration",
            )
        )
        db.commit()
        _log.warning(
            "AUTO_SEED_ADMIN: created admin@acme.com (password Admin@123). "
            "Unset AUTO_SEED_ADMIN, change the password, and run seed.py for full demo data."
        )
    except IntegrityError:
        db.rollback()
        _log.info("AUTO_SEED_ADMIN: admin already exists (race or duplicate)")
    except Exception:
        db.rollback()
        _log.exception("AUTO_SEED_ADMIN failed")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _auto_seed_admin_if_enabled()
    yield


app = FastAPI(
    title="HYGLOW Accounting API",
    description="Role-based accounting management system",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — local dev defaults; set CORS_ORIGINS="https://app.example.com,https://www.example.com" in production
_default_cors = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://localhost",
    "http://127.0.0.1",
]
_cors_env = os.getenv("CORS_ORIGINS", "").strip()
allow_origins = [o.strip() for o in _cors_env.split(",") if o.strip()] if _cors_env else _default_cors

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(permissions_router.router)
app.include_router(accounting_router.router)
app.include_router(profile_router.router)
app.include_router(notifications_router.router)
app.include_router(messages_router.router)


@app.get("/api/health")
def api_health():
    """Public: DB reachable and user count (debug deploy / login issues)."""
    try:
        db = SessionLocal()
        try:
            n = db.query(models.User).count()
            return {"ok": True, "database": "connected", "user_count": n}
        finally:
            db.close()
    except Exception as exc:
        return {"ok": False, "database": "error", "error": type(exc).__name__}


# Production: serve Vite build from ./static (same origin as /api — one URL on the internet)
if HAS_FRONTEND:
    _assets = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(_assets):
        app.mount("/assets", StaticFiles(directory=_assets), name="vite_assets")

    @app.get("/")
    def serve_root():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        candidate = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
else:

    @app.get("/")
    def root():
        return {"message": "HYGLOW Accounting API is running", "docs": "/docs"}
