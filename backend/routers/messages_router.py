from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from database import get_db
import models
from auth import get_current_user

router = APIRouter(prefix="/api/messages", tags=["messages"])


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    receiver_id: int
    subject:     str = ""
    body:        str


class ReplyCreate(BaseModel):
    body: str


def _fmt_user(u: models.User):
    if not u:
        return None
    return {"id": u.id, "name": u.name, "role": u.role, "department": u.department}


def _fmt_reply(r: models.MessageReply):
    return {
        "id":         r.id,
        "body":       r.body,
        "sender":     _fmt_user(r.sender),
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


def _fmt_message(m: models.Message, include_replies=False):
    d = {
        "id":          m.id,
        "subject":     m.subject,
        "body":        m.body,
        "is_read":     m.is_read,
        "is_resolved": m.is_resolved,
        "resolved_at": m.resolved_at.isoformat() if m.resolved_at else None,
        "resolved_by": _fmt_user(m.resolver) if m.resolved_by else None,
        "created_at":  m.created_at.isoformat() if m.created_at else None,
        "sender":      _fmt_user(m.sender),
        "receiver":    _fmt_user(m.receiver),
        "reply_count": len(m.replies),
    }
    if include_replies:
        d["replies"] = [_fmt_reply(r) for r in m.replies]
    return d


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("")
def get_inbox(
    box: str = "inbox",  # inbox | sent | all
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(models.Message)
    if box == "inbox":
        q = q.filter(models.Message.receiver_id == current_user.id)
    elif box == "sent":
        q = q.filter(models.Message.sender_id == current_user.id)
    else:  # 'all' — admin can see all
        if current_user.role != "admin":
            q = q.filter(
                (models.Message.receiver_id == current_user.id) |
                (models.Message.sender_id   == current_user.id)
            )
    msgs = q.order_by(models.Message.created_at.desc()).all()
    return [_fmt_message(m) for m in msgs]


@router.post("")
def send_message(
    data: MessageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    receiver = db.query(models.User).filter(models.User.id == data.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Recipient not found")
    if receiver.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")
    if not data.body.strip():
        raise HTTPException(status_code=400, detail="Message body cannot be empty")

    msg = models.Message(
        sender_id   = current_user.id,
        receiver_id = data.receiver_id,
        subject     = data.subject.strip() or "No subject",
        body        = data.body.strip(),
    )
    db.add(msg)

    # Notify receiver
    notif = models.Notification(
        user_id = data.receiver_id,
        title   = f"New message from {current_user.name}",
        message = (data.subject or data.body[:60]),
        type    = "info",
        link    = "/messages",
    )
    db.add(notif)
    db.commit()
    db.refresh(msg)
    return _fmt_message(msg)


@router.get("/{message_id}")
def get_message(
    message_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    msg = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != current_user.id and msg.receiver_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    # Mark as read when receiver opens it
    if msg.receiver_id == current_user.id and not msg.is_read:
        msg.is_read = True
        db.commit()

    return _fmt_message(msg, include_replies=True)


@router.post("/{message_id}/reply")
def reply_to_message(
    message_id: int,
    data: ReplyCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    msg = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != current_user.id and msg.receiver_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    if not data.body.strip():
        raise HTTPException(status_code=400, detail="Reply cannot be empty")

    reply = models.MessageReply(
        message_id = message_id,
        sender_id  = current_user.id,
        body       = data.body.strip(),
    )
    db.add(reply)

    # Notify the other party
    notify_id = msg.receiver_id if current_user.id == msg.sender_id else msg.sender_id
    notif = models.Notification(
        user_id = notify_id,
        title   = f"New reply from {current_user.name}",
        message = data.body[:60],
        type    = "info",
        link    = "/messages",
    )
    db.add(notif)
    db.commit()
    db.refresh(reply)
    return _fmt_reply(reply)


@router.patch("/{message_id}/resolve")
def resolve_message(
    message_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    msg = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != current_user.id and msg.receiver_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    msg.is_resolved = True
    msg.resolved_at = datetime.now(timezone.utc)
    msg.resolved_by = current_user.id
    db.commit()
    return _fmt_message(msg, include_replies=True)


@router.patch("/{message_id}/unresolve")
def unresolve_message(
    message_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    msg = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != current_user.id and msg.receiver_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    msg.is_resolved = False
    msg.resolved_at = None
    msg.resolved_by = None
    db.commit()
    return _fmt_message(msg, include_replies=True)


@router.get("/meta/unread-count")
def unread_count(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = db.query(models.Message).filter(
        models.Message.receiver_id == current_user.id,
        models.Message.is_read == False,
    ).count()
    return {"count": count}


@router.get("/meta/users")
def list_users_for_messaging(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all active users except self, for the recipient picker."""
    users = db.query(models.User).filter(
        models.User.is_active == True,
        models.User.id != current_user.id,
    ).order_by(models.User.name).all()
    return [_fmt_user(u) for u in users]

