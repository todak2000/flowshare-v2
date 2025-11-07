#!/bin/bash
# Stop all agent services

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOGS_DIR="$BACKEND_DIR/logs"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Stopping Agent Services${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to stop an agent by PID file
stop_agent() {
    local agent_name=$1
    local pid_file="$LOGS_DIR/${agent_name}.pid"

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null; then
            echo -e "${BLUE}Stopping ${agent_name} (PID: $pid)...${NC}"
            kill $pid
            sleep 1

            # Force kill if still running
            if ps -p $pid > /dev/null; then
                echo -e "${BLUE}Force killing ${agent_name}...${NC}"
                kill -9 $pid
            fi

            echo -e "${GREEN}✓${NC} ${agent_name} stopped"
        else
            echo -e "${BLUE}${agent_name} not running${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${BLUE}${agent_name} PID file not found${NC}"
    fi
}

# Stop agents by PID files
stop_agent "auditor-agent"
stop_agent "accountant-agent"
stop_agent "communicator-agent"

# Also stop by port (in case PID files are missing)
echo ""
echo -e "${BLUE}Checking ports...${NC}"

for port in 8001 8002 8003; do
    pid=$(lsof -t -i:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo -e "${BLUE}Killing process on port $port (PID: $pid)...${NC}"
        kill $pid 2>/dev/null || kill -9 $pid 2>/dev/null
        echo -e "${GREEN}✓${NC} Port $port cleared"
    fi
done

echo ""
echo -e "${GREEN}All agents stopped${NC}"
echo ""
