@echo off
REM MQTT MCP Color Changer - Quick Launcher (Windows)

echo 🚀 Starting MQTT MCP Color Changer...
echo.

REM Check if build exists
if not exist "build" (
    echo ⚠️  Build not found. Building project...
    call npm run build
)

REM Check if dependencies exist
if not exist "node_modules" (
    echo ⚠️  Dependencies not installed. Installing...
    call npm install
)

echo 🌐 Starting web server on http://localhost:3000
echo 🎨 Opening browser...
echo.

REM Open browser
start http://localhost:3000

REM Start the web server
call npm run start:web
