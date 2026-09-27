import os
import sqlite3
from flask import Flask, render_template, request, redirect, url_for, session, flash, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dfa_secret_super_key_2026")

# Database path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.db")


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )
    """)
    conn.commit()
    conn.close()


init_db()


# Login Page
@app.route("/")
def login():
    if "user" in session:
        return redirect(url_for("home"))
    return render_template("login.html")


# Signup Page
@app.route("/signup")
def signup():
    if "user" in session:
        return redirect(url_for("home"))
    return render_template("signup.html")


# Register User
@app.route("/register", methods=["POST"])
def register():
    username = request.form.get("username", "").strip()
    password = request.form.get("password", "").strip()

    if not username or not password:
        flash("Username and password are required.", "error")
        return redirect(url_for("signup"))

    hashed_password = generate_password_hash(password)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO users(username, password) VALUES(?, ?)",
            (username, hashed_password)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        flash("Username already exists! Please choose another one or log in.", "error")
        return redirect(url_for("signup"))
    except Exception as e:
        conn.close()
        flash(f"An unexpected error occurred: {str(e)}", "error")
        return redirect(url_for("signup"))

    conn.close()
    flash("Account created successfully! Please sign in.", "success")
    return redirect(url_for("login"))


# Authenticate User
@app.route("/authenticate", methods=["POST"])
def authenticate():
    username = request.form.get("username", "").strip()
    password = request.form.get("password", "").strip()

    if not username or not password:
        flash("Please enter both username and password.", "error")
        return redirect(url_for("login"))

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, username, password FROM users WHERE username = ?",
        (username,)
    )
    user = cursor.fetchone()
    conn.close()

    if user:
        stored_hash = user[2]
        # Support hashed passwords as well as legacy plain-text passwords
        is_valid = False
        try:
            if check_password_hash(stored_hash, password):
                is_valid = True
        except Exception:
            pass

        if not is_valid and stored_hash == password:
            is_valid = True

        if is_valid:
            session["user"] = username
            return redirect(url_for("home"))

    flash("Invalid username or password. Please try again.", "error")
    return redirect(url_for("login"))


# DFA Main Page
@app.route("/home")
def home():
    if "user" not in session:
        flash("Please log in to access the DFA Equivalence Workspace.", "info")
        return redirect(url_for("login"))

    return render_template("index.html", current_user=session.get("user"))


# Logout
@app.route("/logout")
def logout():
    session.pop("user", None)
    flash("You have been logged out successfully.", "info")
    return redirect(url_for("login"))


# PWA Service Worker & Manifest
@app.route("/sw.js")
def service_worker():
    response = send_from_directory("static", "sw.js")
    response.headers["Service-Worker-Allowed"] = "/"
    response.headers["Content-Type"] = "application/javascript"
    return response


@app.route("/manifest.json")
def manifest():
    return send_from_directory("static", "manifest.json", mimetype="application/manifest+json")


if __name__ == "__main__":
    app.run(debug=True)