#!/bin/bash
set -e

echo "Building frontend..."
cd frontend && npm install && npm run build && cd ..

echo "Starting server..."
uv run uvicorn main:app --host 0.0.0.0 --port 8000
