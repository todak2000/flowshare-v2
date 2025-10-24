FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY ../../requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared modules
COPY ../../shared /app/shared

# Copy agent code
COPY . /app/agent

WORKDIR /app/agent

# Run the agent
CMD ["python", "main.py"]
