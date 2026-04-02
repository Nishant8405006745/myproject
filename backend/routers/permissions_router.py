from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth import get_current_user, require_role

router = APIRouter(prefix="/api/permissions", tags=["permissions"])

ALL_MODULES = ["invoices", "expenses", "payroll", "ledger", "reports", "journal"]


@router.get("/{user_id}")
def get_permissions(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Access control
    if current_user.role == "employee":
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "manager" and target.manager_id != current_user.id and target.id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your employee")

    perms = db.query(models.Permission).filter(models.Permission.user_id == user_id).all()
    return {
        "user_id": user_id,
        "permissions": [
            {
                "module": p.module,
                "can_view": p.can_view,
                "can_create": p.can_create,
                "can_edit": p.can_edit,
                "can_delete": p.can_delete,
            }
            for p in perms
        ]
    }


@router.put("/{user_id}")
def update_permissions(
    user_id: int,
    data: schemas.PermissionUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Access control
    if current_user.role == "employee":
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "manager":
        if target.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your employee")
        if target.role == "admin":
            raise HTTPException(status_code=403, detail="Cannot change admin permissions")
        # Manager can only grant what they themselves have
        manager_perms = db.query(models.Permission).filter(
            models.Permission.user_id == current_user.id
        ).all()
        manager_allowed = {p.module for p in manager_perms if p.can_view}
        for item in data.permissions:
            if item.can_view and item.module not in manager_allowed:
                raise HTTPException(
                    status_code=403,
                    detail=f"You don't have access to module '{item.module}' yourself"
                )

    # Update permissions
    for item in data.permissions:
        perm = db.query(models.Permission).filter(
            models.Permission.user_id == user_id,
            models.Permission.module == item.module
        ).first()
        if perm:
            perm.can_view = item.can_view
            perm.can_create = item.can_create
            perm.can_edit = item.can_edit
            perm.can_delete = item.can_delete
        else:
            perm = models.Permission(
                user_id=user_id,
                module=item.module,
                can_view=item.can_view,
                can_create=item.can_create,
                can_edit=item.can_edit,
                can_delete=item.can_delete,
            )
            db.add(perm)
    db.commit()
    return {"message": "Permissions updated"}
