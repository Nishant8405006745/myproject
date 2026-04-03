import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, ProfileChangeRequest, Notification
from auth import get_current_user, get_password_hash, verify_password
from schemas import MessageResponse
from typing import Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/profile", tags=["profile"])


# ── Schemas ────────────────────────────────────────────────────────────────

class ProfileUpdateRequest(BaseModel):
    name:        Optional[str] = None
    phone:       Optional[str] = None
    bio:         Optional[str] = None
    job_title:   Optional[str] = None
    location:    Optional[str] = None
    department:  Optional[str] = None
    profile_photo: Optional[str] = None  # base64 data URL


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password:     str


class ReviewRequest(BaseModel):
    approve: bool
    note:    Optional[str] = None


# ── Helpers ────────────────────────────────────────────────────────────────

def _user_to_dict(user: User) -> dict:
    return {
        "name":          user.name,
        "phone":         user.phone,
        "bio":           user.bio,
        "job_title":     user.job_title,
        "location":      user.location,
        "department":    user.department,
        "profile_photo": user.profile_photo,
    }


def _create_notification(db: Session, user_id: int, title: str, message: str, notif_type: str = "info", link: str = None):
    n = Notification(user_id=user_id, title=title, message=message, type=notif_type, link=link)
    db.add(n)
    db.commit()


def _get_reviewer(db: Session, user: User) -> Optional[User]:
    """Return the user's direct senior: manager → admin if no manager."""
    if user.manager_id:
        return db.query(User).filter(User.id == user.manager_id).first()
    # fall back to any admin
    return db.query(User).filter(User.role == "admin", User.is_active == True).first()


# ── Endpoints ──────────────────────────────────────────────────────────────

@router.get("/me")
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {
        "id":            current_user.id,
        "name":          current_user.name,
        "email":         current_user.email,
        "role":          current_user.role,
        "department":    current_user.department,
        "phone":         current_user.phone,
        "bio":           current_user.bio,
        "job_title":     current_user.job_title,
        "location":      current_user.location,
        "profile_photo": current_user.profile_photo,
        "is_active":     current_user.is_active,
        "is_blocked":    current_user.is_blocked,
        "created_at":    str(current_user.created_at),
        "manager_name":  current_user.manager.name if current_user.manager else None,
    }


@router.post("/request")
def submit_profile_change(
    body: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a profile change request for senior approval."""
    # Determine which fields actually changed
    changes = {k: v for k, v in body.dict().items() if v is not None and v != getattr(current_user, k)}
    if not changes:
        raise HTTPException(status_code=400, detail="No changes detected.")

    reviewer = _get_reviewer(db, current_user)

    req = ProfileChangeRequest(
        user_id            = current_user.id,
        reviewer_id        = reviewer.id if reviewer else None,
        requested_changes  = json.dumps(changes),
        current_values     = json.dumps(_user_to_dict(current_user)),
        status             = "pending",
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # Notify the reviewer
    if reviewer:
        _create_notification(
            db, reviewer.id,
            title   = "Profile Change Request",
            message = f"{current_user.name} has submitted a profile change request for your approval.",
            notif_type = "info",
            link    = "/admin/profile-requests",
        )

    return {"message": "Profile change request submitted. Awaiting approval.", "request_id": req.id}


@router.post("/change-password")
def change_password(
    body: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Password change — immediate (no approval needed), just verify current password."""
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    current_user.password_hash = get_password_hash(body.new_password)
    db.commit()

    _create_notification(
        db, current_user.id,
        title="Password Changed",
        message="Your password was changed successfully.",
        notif_type="success",
    )
    return {"message": "Password changed successfully."}


@router.get("/requests")
def get_pending_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manager/Admin: view profile change requests pending their review."""
    if current_user.role not in ("admin", "manager"):
        raise HTTPException(status_code=403, detail="Not authorized.")

    reqs = db.query(ProfileChangeRequest).filter(
        ProfileChangeRequest.reviewer_id == current_user.id,
        ProfileChangeRequest.status == "pending"
    ).all()

    result = []
    for r in reqs:
        requester = db.query(User).filter(User.id == r.user_id).first()
        result.append({
            "id":                r.id,
            "user_id":           r.user_id,
            "user_name":         requester.name if requester else "Unknown",
            "user_email":        requester.email if requester else "",
            "user_role":         requester.role if requester else "",
            "requested_changes": json.loads(r.requested_changes),
            "current_values":    json.loads(r.current_values),
            "status":            r.status,
            "created_at":        str(r.created_at),
        })
    return result


@router.get("/requests/history")
def get_my_request_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """User: view their own past/pending requests."""
    reqs = db.query(ProfileChangeRequest).filter(
        ProfileChangeRequest.user_id == current_user.id
    ).order_by(ProfileChangeRequest.created_at.desc()).all()

    return [
        {
            "id":                r.id,
            "requested_changes": json.loads(r.requested_changes),
            "current_values":    json.loads(r.current_values),
            "status":            r.status,
            "reviewer_note":     r.reviewer_note,
            "created_at":        str(r.created_at),
            "reviewed_at":       str(r.reviewed_at) if r.reviewed_at else None,
        }
        for r in reqs
    ]


@router.put("/requests/{request_id}/review")
def review_profile_request(
    request_id: int,
    body: ReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manager/Admin: approve or reject a profile change request."""
    if current_user.role not in ("admin", "manager"):
        raise HTTPException(status_code=403, detail="Not authorized.")

    req = db.query(ProfileChangeRequest).filter(ProfileChangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
    if req.reviewer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="This request is not assigned to you.")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already reviewed.")

    req.status      = "approved" if body.approve else "rejected"
    req.reviewer_note = body.note
    req.reviewed_at = datetime.utcnow()

    # If approved — apply the changes
    if body.approve:
        target_user = db.query(User).filter(User.id == req.user_id).first()
        if target_user:
            changes = json.loads(req.requested_changes)
            for field, value in changes.items():
                if hasattr(target_user, field):
                    setattr(target_user, field, value)
            db.commit()

    db.commit()

    # Notify the requester
    requester = db.query(User).filter(User.id == req.user_id).first()
    if requester:
        status_text = "approved" if body.approve else "rejected"
        note_text   = f" Note: {body.note}" if body.note else ""
        _create_notification(
            db, requester.id,
            title      = f"Profile Change {status_text.capitalize()}",
            message    = f"Your profile change request was {status_text} by {current_user.name}.{note_text}",
            notif_type = "success" if body.approve else "warning",
            link       = "/profile",
        )

    return {"message": f"Request {req.status} successfully."}


# ── Direct photo update (no approval needed) ───────────────────────────────

class PhotoUpdateRequest(BaseModel):
    profile_photo: str  # base64 data URL

@router.patch("/photo")
def update_profile_photo(
    body: PhotoUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Immediately update profile photo — no approval needed."""
    current_user.profile_photo = body.profile_photo
    db.commit()
    return {
        "message": "Profile photo updated.",
        "profile_photo": current_user.profile_photo,
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
    }



# ── Online presence ────────────────────────────────────────────────────────

from datetime import timedelta
from sqlalchemy import text

@router.post("/heartbeat")
def heartbeat(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Call every 30s to mark user as online. Uses raw SQL for safety."""
    try:
        db.execute(
            text("UPDATE users SET last_seen = :now WHERE id = :uid"),
            {"now": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"), "uid": current_user.id}
        )
        db.commit()
    except Exception as e:
        pass  # Column might not exist yet — silently skip
    return {"status": "ok"}


@router.get("/online")
def get_online_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return IDs of users seen in the last 2 minutes (online). Uses raw SQL for safety."""
    try:
        cutoff = (datetime.utcnow() - timedelta(minutes=2)).strftime("%Y-%m-%d %H:%M:%S")
        result = db.execute(
            text(
                "SELECT id FROM users WHERE last_seen >= :cutoff "
                "AND is_active IS true AND is_blocked IS NOT true"
            ),
            {"cutoff": cutoff}
        )
        ids = [row[0] for row in result.fetchall()]
        # Always include current user as online (they just called this endpoint)
        if current_user.id not in ids:
            ids.append(current_user.id)
        return {"online_ids": ids}
    except Exception:
        # Column doesn't exist yet — only current user is online
        return {"online_ids": [current_user.id]}

