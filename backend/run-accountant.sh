#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Navigate to Accountant agent directory
cd agents/accountant

# Run Accountant agent with auto-reload
echo "🧮 Starting Accountant Agent on http://localhost:8002"
echo ""
uvicorn main:app --host 0.0.0.0 --port 8002 --reload

source venv/bin/activate && cd agents/accountant && python3 main.py