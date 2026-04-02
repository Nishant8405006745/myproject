"""
Seed the database with demo data.
Run: python seed.py
"""
from database import SessionLocal, engine
import models
from auth import get_password_hash

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

ALL_MODULES = ["invoices", "expenses", "payroll", "ledger", "reports", "journal"]


def seed_permissions(user_id, modules, full=False):
    for mod in ALL_MODULES:
        allowed = mod in modules
        perm = models.Permission(
            user_id=user_id,
            module=mod,
            can_view=allowed,
            can_create=allowed and full,
            can_edit=allowed and full,
            can_delete=allowed and full,
        )
        db.add(perm)


# ── Admin ─────────────────────────────────────────────────────────────────────
admin = models.User(
    name="Super Admin",
    email="admin@acme.com",
    password_hash=get_password_hash("Admin@123"),
    role="admin",
    department="Administration",
)
db.add(admin)
db.flush()

# ── Managers ──────────────────────────────────────────────────────────────────
manager1 = models.User(
    name="Sarah Mitchell",
    email="sarah.manager@acme.com",
    password_hash=get_password_hash("Manager@123"),
    role="manager",
    department="Finance",
)
manager2 = models.User(
    name="John Reynolds",
    email="john.manager@acme.com",
    password_hash=get_password_hash("Manager@123"),
    role="manager",
    department="Accounts",
)
db.add_all([manager1, manager2])
db.flush()

# Manager permissions (admin grants these)
seed_permissions(manager1.id, ["invoices", "expenses", "payroll", "ledger", "reports", "journal"], full=True)
seed_permissions(manager2.id, ["invoices", "expenses", "ledger", "reports"], full=True)

# ── Employees ─────────────────────────────────────────────────────────────────
employees_data = [
    ("Alice Johnson", "alice@acme.com", manager1.id, "Finance", ["invoices", "expenses"]),
    ("Bob Carter",   "bob@acme.com",   manager1.id, "Finance", ["invoices"]),
    ("Charlie Brown","charlie@acme.com",manager2.id, "Accounts", ["expenses", "ledger"]),
    ("Diana Prince", "diana@acme.com", manager2.id, "Accounts", ["invoices", "reports"]),
]

for name, email, mgr_id, dept, mods in employees_data:
    emp = models.User(
        name=name,
        email=email,
        password_hash=get_password_hash("Employee@123"),
        role="employee",
        department=dept,
        manager_id=mgr_id,
    )
    db.add(emp)
    db.flush()
    seed_permissions(emp.id, mods, full=False)

# ── Sample Invoices ───────────────────────────────────────────────────────────
invoices = [
    ("Acme Corp",       "acme@client.com", 150000, 18, "paid",    "2026-01-15", "2026-01-01"),
    ("TechStart Ltd",   "tech@start.com",  85000,  18, "paid",    "2026-01-28", "2026-01-10"),
    ("Global Systems",  "gs@global.com",   220000, 18, "pending", "2026-02-15", "2026-02-01"),
    ("NextGen Inc",     "ng@next.com",     67500,  12, "overdue", "2026-01-20", "2026-12-20"),
    ("Sunrise Hotels",  "sr@hotels.com",   95000,  18, "paid",    "2026-02-28", "2026-02-10"),
    ("DataFlow Co",     "df@data.com",     130000, 18, "paid",    "2026-03-10", "2026-02-25"),
    ("MegaCorp",        "mc@mega.com",     310000, 18, "pending", "2026-03-30", "2026-03-15"),
    ("BlueWave",        "bw@bluewave.com", 42000,  5,  "cancelled","2026-02-01","2026-01-20"),
]
for i, (client, email, amount, tax, status, due, issue) in enumerate(invoices, 1):
    total = amount + amount * tax / 100
    inv = models.Invoice(
        invoice_number=f"INV-{10000+i}",
        client_name=client, client_email=email,
        amount=amount, tax=tax, total=round(total, 2),
        status=status, due_date=due, issue_date=issue,
        description="Professional services rendered",
        created_by=admin.id,
    )
    db.add(inv)

# ── Sample Expenses ───────────────────────────────────────────────────────────
expenses_data = [
    ("Office Rent Q1", "utilities", 45000, "2026-01-01", "Prestige Realty", "approved"),
    ("Cloud Services", "utilities", 12000, "2026-01-05", "AWS India", "approved"),
    ("Team Travel",    "travel",    8500,  "2026-01-12", "MakeMyTrip", "approved"),
    ("Marketing Ads",  "marketing", 25000, "2026-01-20", "Google Ads", "approved"),
    ("Office Supplies","office",    3200,  "2026-02-03", "Staples", "approved"),
    ("Software License","utilities",18000, "2026-02-10", "Microsoft", "approved"),
    ("Client Dinner",  "travel",    6500,  "2026-02-14", "The Grand", "pending"),
    ("Server Upgrade", "utilities", 55000, "2026-02-20", "Dell India", "approved"),
    ("Training Prog",  "office",    12000, "2026-03-01", "Coursera", "pending"),
    ("Legal Fees",     "other",     35000, "2026-03-10", "LawFirm LLP", "approved"),
]
for title, cat, amount, date, vendor, status in expenses_data:
    exp = models.Expense(
        title=title, category=cat, amount=amount,
        date=date, vendor=vendor, status=status,
        created_by=admin.id,
    )
    db.add(exp)

# ── Sample Payroll ────────────────────────────────────────────────────────────
payroll_data = [
    ("Sarah Mitchell", manager1.id, "Finance",  120000, 18000, "March 2026"),
    ("John Reynolds",  manager2.id, "Accounts", 115000, 17250, "March 2026"),
    ("Alice Johnson",  None,        "Finance",  65000,  9750,  "March 2026"),
    ("Bob Carter",     None,        "Finance",  55000,  8250,  "March 2026"),
    ("Charlie Brown",  None,        "Accounts", 60000,  9000,  "March 2026"),
    ("Diana Prince",   None,        "Accounts", 58000,  8700,  "March 2026"),
]
for name, emp_id, dept, gross, ded, period in payroll_data:
    pay = models.PayrollRecord(
        employee_name=name, employee_id=emp_id,
        department=dept, gross_salary=gross,
        deductions=ded, net_salary=gross - ded,
        pay_period=period, payment_date="2026-03-31",
        status="paid",
    )
    db.add(pay)

# ── Sample Ledger ─────────────────────────────────────────────────────────────
ledger_data = [
    ("2026-01-01", "Cash & Equivalents",  "asset",     500000, 0,      500000),
    ("2026-01-15", "Accounts Receivable", "asset",     150000, 0,      650000),
    ("2026-01-15", "Revenue",             "income",    0,      150000, 650000),
    ("2026-01-20", "Office Rent Expense", "expense",   45000,  0,      605000),
    ("2026-01-20", "Cash & Equivalents",  "asset",     0,      45000,  560000),
    ("2026-02-01", "Accounts Receivable", "asset",     220000, 0,      780000),
    ("2026-02-01", "Revenue",             "income",    0,      220000, 780000),
    ("2026-02-10", "Software Expense",    "expense",   18000,  0,      762000),
    ("2026-02-10", "Cash & Equivalents",  "asset",     0,      18000,  744000),
    ("2026-03-01", "Payroll Expense",     "expense",   473000, 0,      271000),
    ("2026-03-01", "Cash & Equivalents",  "asset",     0,      473000, 271000),
]
for date, acct, acct_type, debit, credit, balance in ledger_data:
    entry = models.LedgerEntry(
        date=date, account_name=acct, account_type=acct_type,
        debit=debit, credit=credit, balance=balance,
        reference="REF-AUTO", description="Auto-generated entry",
    )
    db.add(entry)

# ── Sample Journal ────────────────────────────────────────────────────────────
journal_data = [
    ("2026-01-15", "Invoice payment from Acme Corp",     "Cash",              "Accounts Receivable", 150000, "INV-10001", "posted"),
    ("2026-01-20", "Office rent payment Jan",            "Rent Expense",      "Cash",                45000,  "EXP-001",  "posted"),
    ("2026-02-01", "Invoice raised for Global Systems",  "Accounts Receivable","Revenue",            220000, "INV-10003", "posted"),
    ("2026-02-10", "Software license Microsoft",         "Software Expense",  "Cash",                18000,  "EXP-006",  "posted"),
    ("2026-03-01", "Monthly payroll disbursement",       "Salaries Expense",  "Cash",                473000, "PAY-MAR26","posted"),
    ("2026-03-10", "Legal fees payment",                 "Legal Expense",     "Cash",                35000,  "EXP-010",  "draft"),
]
for i, (date, desc, debit_acc, credit_acc, amount, ref, status) in enumerate(journal_data, 1):
    jentry = models.JournalEntry(
        entry_number=f"JE-{1000+i}", date=date, description=desc,
        debit_account=debit_acc, credit_account=credit_acc,
        amount=amount, reference=ref, status=status,
        created_by=admin.id,
    )
    db.add(jentry)

db.commit()
db.close()
print("Database seeded successfully!")
print("\nLogin Credentials:")
print("  Admin    -> admin@acme.com          / Admin@123")
print("  Manager1 -> sarah.manager@acme.com  / Manager@123")
print("  Manager2 -> john.manager@acme.com   / Manager@123")
print("  Employee -> alice@acme.com           / Employee@123")
print("  Employee -> bob@acme.com             / Employee@123")
print("  Employee -> charlie@acme.com         / Employee@123")
print("  Employee -> diana@acme.com           / Employee@123")
