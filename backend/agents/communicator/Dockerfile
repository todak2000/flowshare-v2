FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared modules
COPY shared /app/shared

# Copy agent code
COPY agents/communicator /app/agent

# Note: Firebase credentials are loaded from:
#   1. firebase-credentials.json (if available locally)
#   2. Environment variables (production with Secret Manager)
#   3. Application Default Credentials (ADC fallback)

# Set Python path to include /app for shared imports
ENV PYTHONPATH=/app

WORKDIR /app/agent

# Run the agent
CMD ["python", "main.py"]
