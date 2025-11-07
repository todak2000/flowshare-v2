#!/bin/bash
# Start all agent services with emulator configuration
# This script starts the agents in the background and logs output to files

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOGS_DIR="$BACKEND_DIR/logs"

# Activate virtual environment if it exists
if [ -d "$BACKEND_DIR/venv" ]; then
    source "$BACKEND_DIR/venv/bin/activate"
    echo -e "${GREEN}✓${NC} Using virtual environment"
fi

# Create logs directory
mkdir -p "$LOGS_DIR"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}FlowShare - Agent Launcher${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Export emulator environment variables
export FIRESTORE_EMULATOR_HOST=localhost:8080
export PUBSUB_EMULATOR_HOST=localhost:8085

echo -e "${GREEN}✓${NC} Emulator configuration:"
echo "  FIRESTORE_EMULATOR_HOST=$FIRESTORE_EMULATOR_HOST"
echo "  PUBSUB_EMULATOR_HOST=$PUBSUB_EMULATOR_HOST"
echo ""

# Function to check if a port is in use
check_port() {
    lsof -i:$1 >/dev/null 2>&1
}

# Function to start an agent
start_agent() {
    local agent_name=$1
    local agent_dir=$2
    local port=$3
    local log_file="$LOGS_DIR/${agent_name}.log"

    echo -e "${BLUE}Starting ${agent_name}...${NC}"

    # Check if already running
    if check_port $port; then
        echo -e "${YELLOW}⚠${NC}  Port $port already in use. ${agent_name} may already be running."
        echo "   To stop it: kill \$(lsof -t -i:$port)"
        return 1
    fi

    # Change to agent directory
    cd "$agent_dir"

    # Start the agent in background
    nohup python main.py > "$log_file" 2>&1 &
    local pid=$!

    # Save PID to file
    echo $pid > "$LOGS_DIR/${agent_name}.pid"

    # Wait a moment and check if it's still running
    sleep 2
    if ps -p $pid > /dev/null; then
        echo -e "${GREEN}✓${NC} ${agent_name} started (PID: $pid, Port: $port)"
        echo "   Logs: $log_file"
        return 0
    else
        echo -e "${RED}✗${NC} ${agent_name} failed to start. Check logs: $log_file"
        return 1
    fi
}

# Start agents
echo ""
start_agent "auditor-agent" "$BACKEND_DIR/agents/auditor" 8001
start_agent "accountant-agent" "$BACKEND_DIR/agents/accountant" 8002
start_agent "communicator-agent" "$BACKEND_DIR/agents/communicator" 8003

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Agent Services Started${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Health check URLs:"
echo "  Auditor:      http://localhost:8001/"
echo "  Accountant:   http://localhost:8002/"
echo "  Communicator: http://localhost:8003/"
echo ""
echo "To view logs:"
echo "  tail -f $LOGS_DIR/auditor-agent.log"
echo "  tail -f $LOGS_DIR/accountant-agent.log"
echo "  tail -f $LOGS_DIR/communicator-agent.log"
echo ""
echo "To stop all agents:"
echo "  $SCRIPT_DIR/stop_agents.sh"
echo ""
