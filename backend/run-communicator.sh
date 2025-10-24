#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Navigate to Communicator agent directory
cd agents/communicator

# Run Communicator agent with auto-reload
echo "📧 Starting Communicator Agent on http://localhost:8003"
echo ""
uvicorn main:app --host 0.0.0.0 --port 8003 --reload
