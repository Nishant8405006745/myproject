from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import auth_router, users_router, permissions_router, accounting_router, profile_router, notifications_router, messages_router

# Create all tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HYGLOW Accounting API",
    description="Role-based accounting management system",
    version="1.0.0",
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:3000",
    ],
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


@app.get("/")
def root():
    return {"message": "HYGLOW Accounting API is running", "docs": "/docs"}
