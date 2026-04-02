from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas
from auth import get_current_user, require_module_access
import random, string
from datetime import datetime

router = APIRouter(prefix="/api/accounting", tags=["accounting"])


def check_module(module: str, user: models.User, db: Session):
    if user.role == "admin":
        return True
    perm = db.query(models.Permission).filter(
        models.Permission.user_id == user.id,
        models.Permission.module == module,
        models.Permission.can_view == True
    ).first()
    if not perm:
        raise HTTPException(status_code=403, detail=f"No access to {module}")
    return perm


# ── Dashboard ──────────────────────────────────────────────────────────────────
@router.get("/dashboard")
def get_dashboard(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_invoices = db.query(models.Invoice).count()
    paid_invoices = db.query(models.Invoice).filter(models.Invoice.status == "paid").count()
    total_revenue = db.query(models.Invoice).filter(models.Invoice.status == "paid").all()
    revenue = sum(i.total for i in total_revenue)

    total_expenses = db.query(models.Expense).all()
    expenses_total = sum(e.amount for e in total_expenses)

    payroll_total = db.query(models.PayrollRecord).all()
    payroll_sum = sum(p.net_salary for p in payroll_total)

    pending_invoices = db.query(models.Invoice).filter(models.Invoice.status == "pending").count()
    overdue_invoices = db.query(models.Invoice).filter(models.Invoice.status == "overdue").count()

    # Monthly revenue aggregation (last 6 months)
    invoices = db.query(models.Invoice).filter(models.Invoice.status == "paid").all()
    monthly = {}
    for inv in invoices:
        if inv.issue_date:
            try:
                month = inv.issue_date[:7]  # YYYY-MM
                monthly[month] = monthly.get(month, 0) + inv.total
            except:
                pass

    # Expense by category
    expenses = db.query(models.Expense).all()
    by_category = {}
    for e in expenses:
        by_category[e.category] = by_category.get(e.category, 0) + e.amount

    return {
        "stats": {
            "total_revenue": round(revenue, 2),
            "total_expenses": round(expenses_total, 2),
            "net_profit": round(revenue - expenses_total, 2),
            "total_invoices": total_invoices,
            "paid_invoices": paid_invoices,
            "pending_invoices": pending_invoices,
            "overdue_invoices": overdue_invoices,
            "payroll_disbursed": round(payroll_sum, 2),
        },
        "monthly_revenue": [{"month": k, "revenue": v} for k, v in sorted(monthly.items())],
        "expense_by_category": [{"category": k, "amount": round(v, 2)} for k, v in by_category.items()],
    }


# ── Invoices ──────────────────────────────────────────────────────────────────
@router.get("/invoices")
def get_invoices(
    status: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_module("invoices", current_user, db)
    q = db.query(models.Invoice)
    if status:
        q = q.filter(models.Invoice.status == status)
    return q.order_by(models.Invoice.created_at.desc()).all()


@router.post("/invoices", response_model=schemas.InvoiceOut)
def create_invoice(
    data: schemas.InvoiceCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_module("invoices", current_user, db)
    inv_num = "INV-" + "".join(random.choices(string.digits, k=6))
    total = data.amount + (data.amount * data.tax / 100)
    invoice = models.Invoice(
        invoice_number=inv_num,
        client_name=data.client_name,
        client_email=data.client_email,
        amount=data.amount,
        tax=data.tax,
        total=round(total, 2),
        status=data.status,
        due_date=data.due_date,
        issue_date=data.issue_date or datetime.now().strftime("%Y-%m-%d"),
        description=data.description,
        created_by=current_user.id,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


# ── Expenses ──────────────────────────────────────────────────────────────────
@router.get("/expenses")
def get_expenses(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_module("expenses", current_user, db)
    return db.query(models.Expense).order_by(models.Expense.created_at.desc()).all()


@router.post("/expenses", response_model=schemas.ExpenseOut)
def create_expense(
    data: schemas.ExpenseCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_module("expenses", current_user, db)
    expense = models.Expense(**data.model_dump(), created_by=current_user.id)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


# ── Payroll ───────────────────────────────────────────────────────────────────
@router.get("/payroll", response_model=List[schemas.PayrollOut])
def get_payroll(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_module("payroll", current_user, db)
    return db.query(models.PayrollRecord).order_by(models.PayrollRecord.id.desc()).all()


# ── Ledger ────────────────────────────────────────────────────────────────────
@router.get("/ledger", response_model=List[schemas.LedgerOut])
def get_ledger(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_module("ledger", current_user, db)
    return db.query(models.LedgerEntry).order_by(models.LedgerEntry.date.desc()).all()


# ── Reports ───────────────────────────────────────────────────────────────────
@router.get("/reports")
def get_reports(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_module("reports", current_user, db)
    invoices = db.query(models.Invoice).all()
    expenses = db.query(models.Expense).all()
    payroll = db.query(models.PayrollRecord).all()
    ledger = db.query(models.LedgerEntry).all()

    total_revenue = sum(i.total for i in invoices if i.status == "paid")
    total_expenses = sum(e.amount for e in expenses)
    total_payroll = sum(p.net_salary for p in payroll)
    total_debit = sum(l.debit for l in ledger)
    total_credit = sum(l.credit for l in ledger)

    invoice_by_status = {}
    for inv in invoices:
        invoice_by_status[inv.status] = invoice_by_status.get(inv.status, 0) + 1

    expense_by_month = {}
    for e in expenses:
        month = e.date[:7]
        expense_by_month[month] = expense_by_month.get(month, 0) + e.amount

    return {
        "income_statement": {
            "total_revenue": round(total_revenue, 2),
            "total_expenses": round(total_expenses + total_payroll, 2),
            "gross_profit": round(total_revenue - total_expenses, 2),
            "net_profit": round(total_revenue - total_expenses - total_payroll, 2),
        },
        "balance_sheet": {
            "total_debit": round(total_debit, 2),
            "total_credit": round(total_credit, 2),
            "net_balance": round(total_debit - total_credit, 2),
        },
        "invoice_by_status": [{"status": k, "count": v} for k, v in invoice_by_status.items()],
        "expense_by_month": [{"month": k, "amount": round(v, 2)} for k, v in sorted(expense_by_month.items())],
    }


# ── Journal ───────────────────────────────────────────────────────────────────
@router.get("/journal")
def get_journal(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_module("journal", current_user, db)
    return db.query(models.JournalEntry).order_by(models.JournalEntry.created_at.desc()).all()


@router.post("/journal", response_model=schemas.JournalOut)
def create_journal(
    data: schemas.JournalCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_module("journal", current_user, db)
    entry_num = "JE-" + "".join(random.choices(string.digits, k=6))
    entry = models.JournalEntry(
        entry_number=entry_num,
        date=data.date,
        description=data.description,
        debit_account=data.debit_account,
        credit_account=data.credit_account,
        amount=data.amount,
        reference=data.reference,
        status=data.status,
        created_by=current_user.id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
