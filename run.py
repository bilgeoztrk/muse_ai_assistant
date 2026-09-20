"""
Muse Puzzle - Application Entry Point

Starts the Flask development server.
For production, use: gunicorn run:app
"""

from app import create_app
import os

# Determine config from environment, default to development
config_name = os.environ.get("FLASK_ENV", "development")
app = create_app(config_name)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
