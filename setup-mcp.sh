#!/bin/bash

# MQTT MCP Server Setup Script for Claude Desktop
# This script automatically adds the MCP server to Claude Desktop configuration

set -e

echo "🚀 MQTT MCP Server Setup for Claude Desktop"
echo "============================================="
echo ""

# Determine the Claude Desktop config path based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CONFIG_DIR="$HOME/Library/Application Support/Claude"
    CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
    echo "📍 Detected macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    CONFIG_DIR="$HOME/.config/Claude"
    CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
    echo "📍 Detected Linux"
else
    echo "❌ Unsupported OS. Please use setup-mcp.ps1 for Windows."
    exit 1
fi

echo "📂 Config file location: $CONFIG_FILE"
echo ""

# Get the absolute path to the build directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BUILD_PATH="$SCRIPT_DIR/build/index.js"

echo "🔧 MCP Server path: $BUILD_PATH"
echo ""

# Check if build directory exists
if [ ! -f "$BUILD_PATH" ]; then
    echo "⚠️  Build file not found. Building the project first..."
    npm run build
    echo "✅ Build completed"
    echo ""
fi

# Create config directory if it doesn't exist
mkdir -p "$CONFIG_DIR"

# Backup existing config if it exists
if [ -f "$CONFIG_FILE" ]; then
    BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "💾 Backing up existing config to: $BACKUP_FILE"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
fi

# Read existing config or create new one
if [ -f "$CONFIG_FILE" ]; then
    EXISTING_CONFIG=$(cat "$CONFIG_FILE")
else
    EXISTING_CONFIG="{}"
fi

# Check if jq is available for JSON manipulation
if command -v jq &> /dev/null; then
    echo "✨ Using jq for JSON manipulation"

    # Add or update the mqtt server configuration using jq
    echo "$EXISTING_CONFIG" | jq --arg path "$BUILD_PATH" \
        '.mcpServers.mqtt = {
            "command": "node",
            "args": [$path]
        }' > "$CONFIG_FILE"
else
    echo "⚠️  jq not found, using manual JSON update"

    # Manual JSON construction (simpler approach)
    cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "mqtt": {
      "command": "node",
      "args": ["$BUILD_PATH"]
    }
  }
}
EOF
fi

echo "✅ Configuration updated successfully!"
echo ""
echo "📝 Configuration content:"
cat "$CONFIG_FILE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📌 Next Steps:"
echo "   1. Restart Claude Desktop completely (Quit and reopen)"
echo "   2. Start the web server: npm run start:web"
echo "   3. Open http://localhost:3000 in your browser"
echo "   4. In Claude Desktop, ask: 'Connect to mqtt://test.mosquitto.org:1883 and publish \"blue\" to topic \"color/change\"'"
echo "   5. Watch the background change! 🎨"
echo ""
echo "💡 Tip: You can verify the MCP server is loaded by checking the"
echo "   tools available in Claude Desktop after restart."
echo ""
