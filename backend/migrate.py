"""
Safe migration: adds last_seen column to users table if it doesn't already exist.
Run this once, then restart uvicorn.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "accounting.db")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Check existing columns
cursor.execute("PRAGMA table_info(users)")
cols = [row[1] for row in cursor.fetchall()]
print("Current columns:", cols)

if "last_seen" not in cols:
    cursor.execute("ALTER TABLE users ADD COLUMN last_seen DATETIME")
    conn.commit()
    print("✅ Added last_seen column to users table.")
else:
    print("✅ last_seen column already exists — no migration needed.")

conn.close()
