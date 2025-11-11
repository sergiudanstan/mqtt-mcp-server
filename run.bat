@echo off
REM Quick run script for MQTT MCP Web Server (Windows)

echo 🎨 Starting MQTT MCP Color Changer Web Server
echo ==============================================
echo.

REM Check if build exists
if not exist "build" (
    echo ⚠️  Build directory not found. Building...
    call npm run build
    echo.
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo ⚠️  Dependencies not installed. Installing...
    call npm install
    echo.
)

echo 🚀 Starting web server...
echo 📡 MQTT Broker: %MQTT_BROKER% (default: mqtt://broker.hivemq.com:1883)
echo 📌 Topic: %MQTT_TOPIC% (default: color/change)
echo 🌐 Port: %PORT% (default: 3000)
echo.
echo 💡 Press Ctrl+C to stop the server
echo.

call npm run start:web
