#!/bin/bash

# Script to start the funding rate cron job with proper environment setup

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "Starting funding rate cron job..."
echo "Project root: $PROJECT_ROOT"

# Change to project root directory
cd "$PROJECT_ROOT"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found in $PROJECT_ROOT"
    echo "Please create a .env file with your MONGODB_URI"
    echo "You can copy .env.example as a starting point:"
    echo "  cp .env.example .env"
    exit 1
fi

# Check if MONGODB_URI is set in .env
if ! grep -q "MONGODB_URI=" .env; then
    echo "ERROR: MONGODB_URI not found in .env file"
    echo "Please add your MongoDB connection string to the .env file"
    exit 1
fi

echo "Environment file found and validated"

# Run the cron job
echo "Starting cron scheduler..."
npm run cron