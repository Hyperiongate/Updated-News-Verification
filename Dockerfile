# ============================================================================
# Facts & Fakes v2 — Dockerfile
# Version: 2.0.0
# Date: April 15, 2026
#
# CHANGELOG:
#   v2.0.0 (2026-04-15): Initial build. Standard Python 3.11 Flask on Render.
# ============================================================================

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for lxml and psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Render sets $PORT at runtime)
EXPOSE 10000

# Start with Gunicorn
CMD ["gunicorn", "app:app", "--config", "gunicorn.conf.py"]

# I did no harm and this file is not truncated
