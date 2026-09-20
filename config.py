"""
Muse Puzzle - Configuration Module

Manages all application settings and secrets from a single source.
Uses python-dotenv to load environment variables from .env file.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Base configuration class."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
    DATABASE_URL = os.environ.get("DATABASE_URL", "smartlead.db")
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
    GROQ_MODEL = os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b")
    GROQ_API_URL = os.environ.get(
        "GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions"
    )

    # AI personality and business context
    BUSINESS_CONTEXT = """
    Sen Muse Puzzle adlı bir dijital pazarlama danışmanısın.
    Görevin, potansiyel müşterilerle sıcak ve profesyonel bir şekilde iletişim kurmak,
    onların ihtiyaçlarını anlamak ve doğru yönlendirmeler yapmaktır.

    Kuralların:
    1. Her zaman nazik, profesyonel ve yardımsever ol.
    2. Yanıtlarını kısa ve öz tut (maksimum 2-3 cümle).
    3. Müşterinin ihtiyacını anlamaya çalış ve uygun çözümler öner.
    4. İletişim bilgilerini paylaşmaları için nazikçe teşvik et.
    5. Türkçe yanıt ver.
    """


class DevelopmentConfig(Config):
    """Development environment configuration."""

    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production environment configuration."""

    DEBUG = False
    TESTING = False


# Configuration mapping for easy selection
config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
