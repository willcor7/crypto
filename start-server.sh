#!/bin/bash

echo "========================================"
echo " Crypto Dashboard - Local Server"
echo "========================================"
echo ""
echo "Starting HTTP server on http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "========================================"

# Try Python 3 first
if command -v python3 &> /dev/null; then
    echo "Using Python 3..."
    python3 -m http.server 8000
# Try Python 2
elif command -v python &> /dev/null; then
    echo "Using Python 2..."
    python -m SimpleHTTPServer 8000
else
    echo "ERROR: Python is not installed"
    echo ""
    echo "Please install Python:"
    echo "  - Ubuntu/Debian: sudo apt-get install python3"
    echo "  - macOS: brew install python3"
    exit 1
fi
