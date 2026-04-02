from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # admin | manager | employee
    department = Column(String, default="General")
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_blocked = Column(Boolean, default=False)
    # Profile fields
    profile_photo = Column(String, nullable=True)     # base64 data URL or URL
    phone = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    job_title = Column(String, nullable=True)
    location = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # last_seen for online presence — added via migrate.py (ALTER TABLE users ADD COLUMN last_seen DATETIME)
    # Using try/except in router so app works even before migration runs


    manager = relationship("User", remote_side=[id], back_populates="subordinates")
    subordinates = relationship("User", back_populates="manager")
    permissions = relationship("Permission", back_populates="user", cascade="all, delete-orphan")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    module = Column(String, nullable=False)  # invoices, expenses, payroll, ledger, reports, journal
    can_view = Column(Boolean, default=False)
    can_create = Column(Boolean, default=False)
    can_edit = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)

    user = relationship("User", back_populates="permissions")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, nullable=False)
    client_name = Column(String, nullable=False)
    client_email = Column(String)
    amount = Column(Float, nullable=False)
    tax = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    status = Column(String, default="pending")  # pending | paid | overdue | cancelled
    due_date = Column(String)
    issue_date = Column(String)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)  # travel, utilities, salaries, marketing, office, other
    amount = Column(Float, nullable=False)
    date = Column(String, nullable=False)
    vendor = Column(String)
    status = Column(String, default="pending")  # pending | approved | rejected
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PayrollRecord(Base):
    __tablename__ = "payroll"

    id = Column(Integer, primary_key=True, index=True)
    employee_name = Column(String, nullable=False)
    employee_id = Column(Integer, ForeignKey("users.id"))
    department = Column(String)
    gross_salary = Column(Float, nullable=False)
    deductions = Column(Float, default=0.0)
    net_salary = Column(Float, nullable=False)
    pay_period = Column(String, nullable=False)
    payment_date = Column(String)
    status = Column(String, default="pending")  # pending | paid
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LedgerEntry(Base):
    __tablename__ = "ledger"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, nullable=False)
    account_name = Column(String, nullable=False)
    account_type = Column(String)  # asset, liability, equity, income, expense
    debit = Column(Float, default=0.0)
    credit = Column(Float, default=0.0)
    balance = Column(Float, default=0.0)
    reference = Column(String)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class JournalEntry(Base):
    __tablename__ = "journal"

    id = Column(Integer, primary_key=True, index=True)
    entry_number = Column(String, unique=True)
    date = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    debit_account = Column(String, nullable=False)
    credit_account = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    reference = Column(String)
    status = Column(String, default="draft")  # draft | posted | reversed
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProfileChangeRequest(Base):
    """A request to change profile fields — must be approved by the user's senior."""
    __tablename__ = "profile_change_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # manager or admin who reviews

    # Requested new values (stored as JSON string)
    requested_changes = Column(Text, nullable=False)   # JSON: {"name": "...", "phone": "..."}
    current_values    = Column(Text, nullable=False)   # JSON: snapshot before change

    status = Column(String, default="pending")         # pending | approved | rejected
    reviewer_note = Column(Text, nullable=True)

    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    user     = relationship("User", foreign_keys=[user_id],    backref="change_requests")
    reviewer = relationship("User", foreign_keys=[reviewer_id])


class Notification(Base):
    """In-app notifications for users."""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id  = Column(Integer, ForeignKey("users.id"), nullable=False)  # recipient
    title    = Column(String, nullable=False)
    message  = Column(Text, nullable=False)
    type     = Column(String, default="info")   # info | success | warning | error
    is_read  = Column(Boolean, default=False)
    link     = Column(String, nullable=True)    # optional frontend route to navigate to
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id], backref="notifications")


class Message(Base):
    """A message sent from one user to another (or broadcast)."""
    __tablename__ = "messages"

    id          = Column(Integer, primary_key=True, index=True)
    sender_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject     = Column(String, nullable=False, default="")
    body        = Column(Text, nullable=False)
    is_read     = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    sender   = relationship("User", foreign_keys=[sender_id],   backref="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], backref="received_messages")
    resolver = relationship("User", foreign_keys=[resolved_by])
    replies  = relationship("MessageReply", back_populates="message", cascade="all, delete-orphan",
                            order_by="MessageReply.created_at")


class MessageReply(Base):
    """A reply to a Message."""
    __tablename__ = "message_replies"

    id         = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=False)
    sender_id  = Column(Integer, ForeignKey("users.id"),    nullable=False)
    body       = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    message = relationship("Message", back_populates="replies")
    sender  = relationship("User", foreign_keys=[sender_id], backref="sent_replies")
