"""
Muse Puzzle - Database Module

Handles ALL database operations. SQL code exists ONLY in this file.
Uses SQLite with parameterized queries to prevent SQL injection.
"""

import sqlite3
from datetime import datetime
from flask import g, current_app


def get_db():
    """
    Get a database connection for the current request.
    Stores the connection in Flask's `g` object so it can be reused
    within the same request and properly closed afterward.
    """
    if "db" not in g:
        g.db = sqlite3.connect(
            current_app.config["DATABASE_URL"],
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        g.db.row_factory = sqlite3.Row  # Return rows as dict-like objects
    return g.db


def close_db(e=None):
    """
    Close the database connection at the end of the request.
    Registered as a teardown_appcontext callback.
    """
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db(app):
    """
    Initialize the database: create the leads table if it doesn't exist.
    Must be called within an application context.
    """
    with app.app_context():
        db = get_db()
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        db.commit()

    # Register the close_db function to run at the end of each request
    app.teardown_appcontext(close_db)


def add_lead(name, phone, message=""):
    """
    Add a new lead to the database.
    Uses parameterized queries (?) to prevent SQL injection.

    Args:
        name (str): Lead's full name.
        phone (str): Lead's phone number.
        message (str): Optional message from the lead.

    Returns:
        int: The ID of the newly inserted lead.
    """
    db = get_db()
    cursor = db.execute(
        "INSERT INTO leads (name, phone, message) VALUES (?, ?, ?)",
        (name, phone, message),
    )
    db.commit()
    return cursor.lastrowid


def get_all_leads():
    """
    Retrieve all leads from the database, ordered by newest first.

    Returns:
        list[dict]: List of lead records as dictionaries.
    """
    db = get_db()
    rows = db.execute(
        "SELECT id, name, phone, message, created_at FROM leads ORDER BY created_at DESC"
    ).fetchall()

    return [
        {
            "id": row["id"],
            "name": row["name"],
            "phone": row["phone"],
            "message": row["message"],
            "created_at": row["created_at"],
        }
        for row in rows
    ]
