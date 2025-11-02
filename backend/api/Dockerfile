FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared modules
COPY shared /app/shared

# Copy API code
COPY api /app/api

# Set Python path to include /app for shared imports
ENV PYTHONPATH=/app

WORKDIR /app/api

# Expose port
EXPOSE 8000

# Run the application
# Use shell form to allow environment variable expansion
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
