"""
# ============================================================================
# Facts & Fakes v2 — config.py
# Version: 2.0.0
# Date: April 15, 2026
# Author: Claude (Architect + Builder)
#
# PURPOSE:
#   Central configuration management. Reads all API keys and settings
#   from environment variables. API keys are NEVER stored in code —
#   they live in Render environment variables only.
#
# CHANGELOG:
#   v2.0.0 (2026-04-15): Initial build for v2 rebuild. Clean slate.
#                        Removed all legacy config (debate arena, quiz, etc.)
#                        Added SWARM_BASE_URL, SWARM_ENABLED, SWARM_TIMEOUT.
# ============================================================================
"""

import os


class Config:
    """
    Central configuration class.
    All values read from environment variables.
    Sensible defaults provided where safe to do so.
    """

    # -------------------------------------------------------------------------
    # Flask
    # -------------------------------------------------------------------------
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    TESTING = False

    # -------------------------------------------------------------------------
    # Database
    # -------------------------------------------------------------------------
    DATABASE_URL = os.environ.get('DATABASE_URL', '')
    # Render provides DATABASE_URL starting with "postgres://"
    # SQLAlchemy requires "postgresql://" — fix it if needed
    if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    SQLALCHEMY_DATABASE_URI = DATABASE_URL or 'sqlite:///factsandfakes.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # -------------------------------------------------------------------------
    # AI Providers — Orchestrator
    # -------------------------------------------------------------------------
    ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')

    # -------------------------------------------------------------------------
    # AI Providers — Specialists (multi_ai_service.py)
    # -------------------------------------------------------------------------
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY')
    COHERE_API_KEY = os.environ.get('COHERE_API_KEY')
    GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
    MISTRAL_API_KEY = os.environ.get('MISTRAL_API_KEY')   # optional
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY')         # optional

    # -------------------------------------------------------------------------
    # Google Fact Check API
    # -------------------------------------------------------------------------
    GOOGLE_FACT_CHECK_API_KEY = os.environ.get('GOOGLE_FACT_CHECK_API_KEY')

    # -------------------------------------------------------------------------
    # ScrapingBee — Article extraction for JS-rendered sites
    # Note: Subscription currently lapsed. YouTube feature parked until renewed.
    # -------------------------------------------------------------------------
    SCRAPINGBEE_API_KEY = os.environ.get('SCRAPINGBEE_API_KEY')
    SCRAPINGBEE_ENABLED = bool(os.environ.get('SCRAPINGBEE_API_KEY'))

    # -------------------------------------------------------------------------
    # AI Swarm Orchestrator — Read-only connection
    # -------------------------------------------------------------------------
    SWARM_BASE_URL = os.environ.get(
        'SWARM_BASE_URL',
        'https://ai-swarm-orchestrator.onrender.com'
    )
    SWARM_ENABLED = os.environ.get('SWARM_ENABLED', 'true').lower() == 'true'
    SWARM_TIMEOUT = 3  # seconds — NEVER slow down the user for this

    # -------------------------------------------------------------------------
    # Application Settings
    # -------------------------------------------------------------------------
    APP_VERSION = '2.0.0'
    APP_NAME = 'Facts & Fakes'
    APP_DOMAIN = os.environ.get('APP_DOMAIN', 'factsandfakes.ai')

    # Maximum article length to process (characters)
    MAX_ARTICLE_LENGTH = 50000

    # Maximum claims to verify per article (Layer 2)
    MAX_CLAIMS_PER_ARTICLE = 8

    # Request timeout for article scraping (seconds)
    SCRAPER_TIMEOUT = 15

    # -------------------------------------------------------------------------
    # CORS — Development + Production
    # -------------------------------------------------------------------------
    CORS_ORIGINS = [
        'http://localhost:5000',
        'http://localhost:3000',
        'http://127.0.0.1:5000',
        f'https://{APP_DOMAIN}',
        f'https://www.{APP_DOMAIN}',
    ]


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False


# Active config — switches based on FLASK_ENV environment variable
config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': ProductionConfig
}

ActiveConfig = config_map.get(
    os.environ.get('FLASK_ENV', 'production'),
    ProductionConfig
)

# I did no harm and this file is not truncated
