from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth import get_current_user, get_password_hash, require_role

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/", response_model=List[schemas.UserOut])
def get_users(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "admin":
        return db.query(models.User).all()
    elif current_user.role == "manager":
        return db.query(models.User).filter(
            (models.User.manager_id == current_user.id) | (models.User.id == current_user.id)
        ).all()
    else:
        return [current_user]


@router.get("/my-team", response_model=List[schemas.UserOut])
def get_my_team(
    current_user: models.User = Depends(require_role("manager")),
    db: Session = Depends(get_db)
):
    return db.query(models.User).filter(models.User.manager_id == current_user.id).all()


@router.post("/", response_model=schemas.UserOut)
def create_user(
    data: schemas.UserCreate,
    current_user: models.User = Depends(require_role("admin", "manager")),
    db: Session = Depends(get_db)
):
    if current_user.role == "manager":
        if data.role != "employee":
            raise HTTPException(status_code=403, detail="Managers can only create employee accounts")
        data.manager_id = current_user.id

    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        name=data.name,
        email=data.email,
        password_hash=get_password_hash(data.password),
        role=data.role,
        department=data.department or "General",
        manager_id=data.manager_id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    modules = ["invoices", "expenses", "payroll", "ledger", "reports", "journal"]
    for module in modules:
        perm = models.Permission(user_id=user.id, module=module)
        db.add(perm)
    db.commit()
    return user


@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    data: schemas.UserUpdate,
    current_user: models.User = Depends(require_role("admin", "manager")),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.role == "manager" and user.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your employee")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}/block")
def toggle_block_user(
    user_id: int,
    current_user: models.User = Depends(require_role("admin", "manager")),
    db: Session = Depends(get_db)
):
    """Block or unblock a user. Managers can only block their own employees."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    if current_user.role == "manager":
        if user.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your employee")
        if user.role != "employee":
            raise HTTPException(status_code=403, detail="Managers can only block employees")

    user.is_blocked = not user.is_blocked
    action = "blocked" if user.is_blocked else "unblocked"

    # Notify the user
    n = models.Notification(
        user_id=user.id,
        title=f"Account {action.capitalize()}",
        message=f"Your account has been {action} by {current_user.name}. Contact your administrator for more information.",
        type="warning" if user.is_blocked else "success",
    )
    db.add(n)
    db.commit()

    return {"message": f"User {action} successfully.", "is_blocked": user.is_blocked}


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}



@router.get("/", response_model=List[schemas.UserOut])
def get_users(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "admin":
        return db.query(models.User).all()
    elif current_user.role == "manager":
        # Managers see their own team + themselves
        return db.query(models.User).filter(
            (models.User.manager_id == current_user.id) | (models.User.id == current_user.id)
        ).all()
    else:
        return [current_user]


@router.post("/", response_model=schemas.UserOut)
def create_user(
    data: schemas.UserCreate,
    current_user: models.User = Depends(require_role("admin", "manager")),
    db: Session = Depends(get_db)
):
    # Managers can only create employees assigned to themselves
    if current_user.role == "manager":
        if data.role != "employee":
            raise HTTPException(status_code=403, detail="Managers can only create employee accounts")
        data.manager_id = current_user.id

    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        name=data.name,
        email=data.email,
        password_hash=get_password_hash(data.password),
        role=data.role,
        department=data.department or "General",
        manager_id=data.manager_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Default permissions: none
    modules = ["invoices", "expenses", "payroll", "ledger", "reports", "journal"]
    for module in modules:
        perm = models.Permission(user_id=user.id, module=module)
        db.add(perm)
    db.commit()
    return user


@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    data: schemas.UserUpdate,
    current_user: models.User = Depends(require_role("admin", "manager")),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Manager can only update their own employees
    if current_user.role == "manager" and user.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your employee")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@router.get("/my-team", response_model=List[schemas.UserOut])
def get_my_team(
    current_user: models.User = Depends(require_role("manager")),
    db: Session = Depends(get_db)
):
    return db.query(models.User).filter(models.User.manager_id == current_user.id).all()
