#!/bin/bash

# MQTT MCP Color Changer - Quick Launcher
# This script starts the web server and opens the browser

echo "🚀 Starting MQTT MCP Color Changer..."
echo ""

# Check if build exists
if [ ! -d "build" ]; then
    echo "⚠️  Build not found. Building project..."
    npm run build
fi

# Check if dependencies exist
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed. Installing..."
    npm install
fi

echo "🌐 Starting web server on http://localhost:3000"
echo "🎨 Opening browser..."
echo ""

# Open browser (works on macOS, Linux, Windows WSL)
if command -v open &> /dev/null; then
    # macOS
    open http://localhost:3000 &
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://localhost:3000 &
elif command -v start &> /dev/null; then
    # Windows
    start http://localhost:3000 &
fi

# Start the web server
npm run start:web
