#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Navigate to Auditor agent directory
cd agents/auditor

# Run Auditor agent with auto-reload
echo "🔍 Starting Auditor Agent on http://localhost:8001"
echo ""
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
