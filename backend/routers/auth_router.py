from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import verify_password, create_access_token, get_current_user, get_password_hash
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    name:       str
    email:      str
    password:   str
    department: Optional[str] = "General"
    phone:      Optional[str] = None


def _build_user_response(user: models.User, modules: list, manager_name: str = None):
    return {
        "id":              user.id,
        "name":            user.name,
        "email":           user.email,
        "role":            user.role,
        "department":      user.department,
        "manager_id":      user.manager_id,
        "manager_name":    manager_name,
        "profile_photo":   user.profile_photo,
        "phone":           user.phone,
        "bio":             user.bio,
        "job_title":       user.job_title,
        "location":        user.location,
        "is_blocked":      user.is_blocked,
        "allowed_modules": modules,
    }


@router.post("/signup")
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    """Public self-registration — creates an active Employee account (module access still via permissions)."""
    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    new_user = models.User(
        name          = data.name,
        email         = data.email,
        password_hash = get_password_hash(data.password),
        role          = "employee",
        department    = data.department or "General",
        phone         = data.phone,
        is_active     = True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Notify all admins
    admins = db.query(models.User).filter(models.User.role == "admin", models.User.is_active == True).all()
    for admin in admins:
        n = models.Notification(
            user_id  = admin.id,
            title    = "New User Signup",
            message  = f"{data.name} ({data.email}) just signed up.",
            type     = "info",
            link     = "/admin/users"
        )
        db.add(n)
    db.commit()

    return {"message": "Account created successfully! You can sign in now."}


@router.post("/login", response_model=schemas.TokenResponse)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active and user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Account not yet activated. Contact your admin or manager to enable your account.",
        )
    if user.is_blocked:
        raise HTTPException(status_code=403, detail="Your account has been blocked. Contact your manager.")

    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    perms = db.query(models.Permission).filter(models.Permission.user_id == user.id).all()
    modules = [p.module for p in perms if p.can_view]
    if user.role == "admin":
        modules = ["invoices", "expenses", "payroll", "ledger", "reports", "journal"]

    manager_name = None
    if user.manager_id:
        mgr = db.query(models.User).filter(models.User.id == user.manager_id).first()
        manager_name = mgr.name if mgr else None

    return {
        "access_token": token,
        "token_type":   "bearer",
        "user":         _build_user_response(user, modules, manager_name),
    }


@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    perms = db.query(models.Permission).filter(models.Permission.user_id == current_user.id).all()
    modules = [p.module for p in perms if p.can_view]
    if current_user.role == "admin":
        modules = ["invoices", "expenses", "payroll", "ledger", "reports", "journal"]

    manager_name = None
    if current_user.manager_id:
        mgr = db.query(models.User).filter(models.User.id == current_user.manager_id).first()
        manager_name = mgr.name if mgr else None

    return _build_user_response(current_user, modules, manager_name)

