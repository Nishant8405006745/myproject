from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Generic ───────────────────────────────────────────────────────────────────
class MessageResponse(BaseModel):
    message: str

# ── Auth ──────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


# ── User ──────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str
    department: Optional[str] = "General"
    manager_id: Optional[int] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    manager_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: str
    manager_id: Optional[int]
    is_active: bool
    is_blocked: bool = False
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Permissions ───────────────────────────────────────────────────────────────
class PermissionItem(BaseModel):
    module: str
    can_view: bool = False
    can_create: bool = False
    can_edit: bool = False
    can_delete: bool = False


class PermissionUpdate(BaseModel):
    permissions: List[PermissionItem]


# ── Invoice ───────────────────────────────────────────────────────────────────
class InvoiceCreate(BaseModel):
    client_name: str
    client_email: Optional[str] = ""
    amount: float
    tax: float = 0.0
    status: str = "pending"
    due_date: Optional[str] = None
    issue_date: Optional[str] = None
    description: Optional[str] = ""


class InvoiceOut(InvoiceCreate):
    id: int
    invoice_number: str
    total: float
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Expense ───────────────────────────────────────────────────────────────────
class ExpenseCreate(BaseModel):
    title: str
    category: str
    amount: float
    date: str
    vendor: Optional[str] = ""
    status: str = "pending"
    notes: Optional[str] = ""


class ExpenseOut(ExpenseCreate):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Payroll ───────────────────────────────────────────────────────────────────
class PayrollOut(BaseModel):
    id: int
    employee_name: str
    department: Optional[str]
    gross_salary: float
    deductions: float
    net_salary: float
    pay_period: str
    payment_date: Optional[str]
    status: str

    class Config:
        from_attributes = True


# ── Ledger ────────────────────────────────────────────────────────────────────
class LedgerOut(BaseModel):
    id: int
    date: str
    account_name: str
    account_type: Optional[str]
    debit: float
    credit: float
    balance: float
    reference: Optional[str]
    description: Optional[str]

    class Config:
        from_attributes = True


# ── Journal ───────────────────────────────────────────────────────────────────
class JournalCreate(BaseModel):
    date: str
    description: str
    debit_account: str
    credit_account: str
    amount: float
    reference: Optional[str] = ""
    status: str = "draft"


class JournalOut(JournalCreate):
    id: int
    entry_number: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True
