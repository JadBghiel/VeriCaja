#!/bin/bash

# veriaja run both frontend and backend servers

# colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # no color

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}VeriCaja - Starting Services${NC}"
echo -e "${GREEN}=====================================${NC}"

# get the project root dir
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/src/backend"
FRONTEND_DIR="${PROJECT_ROOT}/src/frontend"

# check if dir exist
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}Error: Backend directory not found at $BACKEND_DIR${NC}"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Error: Frontend directory not found at $FRONTEND_DIR${NC}"
    exit 1
fi

# find virtual environment (check both .venv and venv in root and backend)
VENV_DIR=""
if [ -d "$PROJECT_ROOT/.venv" ]; then
    VENV_DIR="$PROJECT_ROOT/.venv"
elif [ -d "$PROJECT_ROOT/venv" ]; then
    VENV_DIR="$PROJECT_ROOT/venv"
elif [ -d "$BACKEND_DIR/.venv" ]; then
    VENV_DIR="$BACKEND_DIR/.venv"
elif [ -d "$BACKEND_DIR/venv" ]; then
    VENV_DIR="$BACKEND_DIR/venv"
fi

# install backend dependencies if needed
if [ -z "$VENV_DIR" ]; then
    echo -e "${YELLOW}No virtual environment found. Setting up Python virtual environment at root...${NC}"
    VENV_DIR="$PROJECT_ROOT/.venv"
    cd "$PROJECT_ROOT"
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r "$BACKEND_DIR/requirements.txt"
    deactivate
fi

# install frontend dependencies if needed
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd "$FRONTEND_DIR"
    npm install
fi

# start backend server
echo -e "${GREEN}Starting backend server...${NC}"
cd "$BACKEND_DIR"
source "$VENV_DIR/bin/activate"
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# give backend time to start
sleep 3

# start frontend server
echo -e "${GREEN}Starting frontend server...${NC}"
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Services started successfully!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo -e "${YELLOW}Backend: ${NC}http://localhost:8000"
echo -e "${YELLOW}Frontend: ${NC}http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# function to handle ctrl+c
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}Services stopped${NC}"
    exit 0
}

# set trap to handle ctrl+c
trap cleanup SIGINT SIGTERM

# wait for both processes
wait
