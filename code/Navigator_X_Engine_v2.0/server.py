# a basic server for local development
from flask import Flask, send_from_directory
import os

app = Flask(__name__)


# Route to serve the index.html
@app.route("/")
def serve_index():
    return send_from_directory(os.getcwd(), "index.html")


# Route to serve static files (e.g., app.js, styles.css)
@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(os.getcwd(), filename)


if __name__ == "__main__":
    app.run(debug=True)
