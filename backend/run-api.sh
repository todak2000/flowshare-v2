#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Navigate to API directory
cd api

# Run API server with auto-reload
echo "🚀 Starting FlowShare API on http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
