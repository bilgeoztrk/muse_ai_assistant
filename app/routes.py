"""
Muse Puzzle - Routes Module

Handles HTTP request routing. NO SQL or AI code exists in this file.
Routes only receive requests, delegate to the appropriate service layer,
and return formatted responses.
"""

from flask import Blueprint, request, jsonify, render_template
from app.database import add_lead, get_all_leads
from app.services.ai_service import AIService, AIServiceError

# Blueprint for page routes (HTML templates)
pages_bp = Blueprint("pages", __name__)

# Blueprint for API routes (JSON responses)
api_bp = Blueprint("api", __name__, url_prefix="/api")


# ─────────────────────────────────────────────
# Page Routes
# ─────────────────────────────────────────────


@pages_bp.route("/")
def index():
    """Serve the landing page with chat widget and lead form."""
    return render_template("index.html")


@pages_bp.route("/dashboard")
def dashboard():
    """Serve the admin dashboard for viewing leads."""
    return render_template("dashboard.html")


# ─────────────────────────────────────────────
# API Routes
# ─────────────────────────────────────────────


@api_bp.route("/chat", methods=["POST"])
def chat():
    """
    Handle chat messages.
    Expects JSON: {"message": "...", "history": [...]}
    Returns JSON: {"response": "..."}
    """
    try:
        data = request.get_json()

        # Validate required fields
        if not data or "message" not in data:
            return jsonify({"error": "Message field is required."}), 400

        message = data["message"].strip()
        if not message:
            return jsonify({"error": "Message cannot be empty."}), 400

        history = data.get("history", [])

        # Delegate to AI service
        ai_service = AIService()
        response_text = ai_service.generate_response(message, history)

        return jsonify({"response": response_text}), 200

    except AIServiceError as e:
        return jsonify({"error": str(e)}), 503

    except Exception as e:
        return jsonify({"error": "An unexpected error occurred."}), 500


@api_bp.route("/leads", methods=["POST"])
def create_lead():
    """
    Save a new lead to the database.
    Expects JSON: {"name": "...", "phone": "...", "message": "..."}
    Returns JSON: {"success": true, "lead_id": ...}
    """
    try:
        data = request.get_json()

        # Validate required fields
        if not data:
            return jsonify({"error": "Request body is required."}), 400

        name = data.get("name", "").strip()
        phone = data.get("phone", "").strip()
        message = data.get("message", "").strip()

        if not name or not phone:
            return jsonify({"error": "Name and phone fields are required."}), 400

        # Delegate to database layer
        lead_id = add_lead(name, phone, message)

        return jsonify({"success": True, "lead_id": lead_id}), 201

    except Exception as e:
        return jsonify({"error": "Failed to save lead."}), 500


@api_bp.route("/leads", methods=["GET"])
def list_leads():
    """
    Retrieve all leads from the database.
    Returns JSON: {"leads": [...], "count": ...}
    """
    try:
        leads = get_all_leads()
        return jsonify({"leads": leads, "count": len(leads)}), 200

    except Exception as e:
        return jsonify({"error": "Failed to retrieve leads."}), 500
