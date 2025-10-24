FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY ../requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared modules
COPY ../shared /app/shared

# Copy API code
COPY . /app/api

WORKDIR /app/api

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
