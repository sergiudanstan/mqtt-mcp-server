#!/bin/bash

# Quick run script for MQTT MCP Web Server

echo "🎨 Starting MQTT MCP Color Changer Web Server"
echo "=============================================="
echo ""

# Check if build exists
if [ ! -d "build" ]; then
    echo "⚠️  Build directory not found. Building..."
    npm run build
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed. Installing..."
    npm install
    echo ""
fi

echo "🚀 Starting web server..."
echo "📡 MQTT Broker: ${MQTT_BROKER:-mqtt://broker.hivemq.com:1883}"
echo "📌 Topic: ${MQTT_TOPIC:-color/change}"
echo "🌐 Port: ${PORT:-3000}"
echo ""
echo "💡 Press Ctrl+C to stop the server"
echo ""

npm run start:web
