import os
from flask import Flask, render_template, send_from_directory

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dfa_secret_super_key_2026")


# Main DFA Page (no login required)
@app.route("/")
@app.route("/home")
def home():
    return render_template("index.html")


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