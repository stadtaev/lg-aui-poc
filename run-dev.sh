#!/bin/bash

echo "Starting backend on :8000..."
uv run uvicorn main:app --reload --log-level info &
BACKEND_PID=$!

echo "Starting frontend on :5173..."
cd frontend && npm install && npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

wait
