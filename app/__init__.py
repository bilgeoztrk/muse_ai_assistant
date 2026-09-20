"""
Muse Puzzle - Application Factory

Creates and configures the Flask application using the Factory pattern.
Assembles all components: configuration, database, CORS, and routes.
"""

from flask import Flask, jsonify
from flask_cors import CORS
from config import config_map
from app.database import init_db


def create_app(config_name="development"):
    """
    Application factory function.

    Creates a Flask app instance, loads configuration, initializes
    the database, enables CORS, and registers all blueprints.

    Args:
        config_name (str): Configuration to use ('development' or 'production').

    Returns:
        Flask: The configured Flask application instance.
    """
    app = Flask(__name__)

    # Load configuration
    config_class = config_map.get(config_name, config_map["default"])
    app.config.from_object(config_class)

    # Enable CORS for cross-origin requests (Wix integration)
    CORS(app)

    # Initialize the database
    init_db(app)

    # Register blueprints
    from app.routes import pages_bp, api_bp

    app.register_blueprint(pages_bp)
    app.register_blueprint(api_bp)

    # Health check endpoint
    @app.route("/health")
    def health():
        """Health check endpoint for monitoring and deployment verification."""
        return jsonify({"status": "healthy", "service": "Muse Puzzle"}), 200

    return app
