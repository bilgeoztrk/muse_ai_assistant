"""
Muse Puzzle - AI Service Module

Handles ALL AI/LLM interactions. AI-related code exists ONLY in this file.
Uses Groq API with the Llama 3.1 model for generating responses.
Falls back to demo mode if API key is not configured.
"""

import requests
from flask import current_app


class AIServiceError(Exception):
    """Custom exception for AI service errors."""

    pass


class AIService:
    """
    Service class for interacting with the Groq AI API.
    Encapsulates all AI logic including request building,
    error handling, and demo mode fallback.
    """

    def __init__(self):
        """Initialize AIService with configuration from Flask app config."""
        self.api_key = current_app.config.get("GROQ_API_KEY", "")
        self.model = current_app.config.get("GROQ_MODEL", "qwen/qwen3.8-27b")
        self.api_url = current_app.config.get(
            "GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions"
        )
        self.business_context = current_app.config.get("BUSINESS_CONTEXT", "")

    def generate_response(self, message, history=None):
        """
        Generate an AI response for the given message.

        If API key is not configured, returns a demo mode response.
        Otherwise, sends the message to Groq API with conversation history.

        Args:
            message (str): The user's message.
            history (list[dict], optional): Previous conversation messages.
                Each dict should have 'role' and 'content' keys.

        Returns:
            str: The AI-generated response text.

        Raises:
            AIServiceError: If the API call fails.
        """
        # Demo mode fallback when API key is not available or is a placeholder
        if not self.api_key or self.api_key.startswith("your-"):
            return self._demo_response(message)

        try:
            # Build the messages array with system context and history
            messages = self._build_messages(message, history)

            # Make the API request
            response = requests.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 300,
                },
                timeout=30,
            )

            # Check for HTTP errors
            response.raise_for_status()

            # Parse and return the response
            data = response.json()
            return data["choices"][0]["message"]["content"]

        except requests.exceptions.Timeout:
            raise AIServiceError(
                "AI servisi yanıt vermedi. Lütfen tekrar deneyin."
            )
        except requests.exceptions.ConnectionError:
            raise AIServiceError(
                "AI servisine bağlanılamadı. İnternet bağlantınızı kontrol edin."
            )
        except requests.exceptions.HTTPError as e:
            raise AIServiceError(
                f"AI servisi hata döndürdü: {e.response.status_code}"
            )
        except (KeyError, IndexError):
            raise AIServiceError(
                "AI servisinden beklenmeyen bir yanıt alındı."
            )

    def _build_messages(self, message, history=None):
        """
        Build the messages array for the API request.

        Args:
            message (str): The current user message.
            history (list[dict], optional): Previous conversation messages.

        Returns:
            list[dict]: Formatted messages array for the API.
        """
        messages = [{"role": "system", "content": self.business_context}]

        # Add conversation history if provided
        if history:
            for entry in history:
                messages.append(
                    {
                        "role": entry.get("role", "user"),
                        "content": entry.get("content", ""),
                    }
                )
            # If history already ends with the current user message, don't re-append
            if messages[-1]["role"] == "user" and messages[-1]["content"] == message:
                return messages

        # Add the current user message
        messages.append({"role": "user", "content": message})

        return messages

    def _demo_response(self, message):
        """
        Generate a demo response when API key is not configured.

        Args:
            message (str): The user's message (used for context-aware demo).

        Returns:
            str: A static demo response message.
        """
        return (
            "🤖 [Demo Modu] Merhaba! Ben Muse Puzzle asistanıyım. "
            "Şu anda demo modunda çalışıyorum çünkü API anahtarı yapılandırılmamış. "
            "Gerçek AI yanıtları için lütfen .env dosyasına GROQ_API_KEY ekleyin."
        )
