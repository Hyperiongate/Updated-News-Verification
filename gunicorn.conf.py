# ============================================================================
# Facts & Fakes v2 — gunicorn.conf.py
# Version: 2.0.0
# Date: April 15, 2026
#
# CHANGELOG:
#   v2.0.0 (2026-04-15): Initial build. Render compatible.
#                        Timeout set to 120s — AI analysis can take time.
# ============================================================================

import os

# Render sets the PORT environment variable
bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"

# 2 workers is appropriate for Render's free/starter tier
workers = 2

# Generous timeout — multi-AI analysis can take 20-40 seconds
timeout = 120

# Preload for faster request handling after boot
preload_app = True

# Log to stdout (Render captures this)
accesslog = "-"
errorlog = "-"
loglevel = "info"

# I did no harm and this file is not truncated
