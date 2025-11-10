# MQTT MCP Server

An MCP (Model Context Protocol) server that provides MQTT client functionality. This allows Claude to interact with MQTT brokers - publishing messages, subscribing to topics, and managing connections.

Available in **both TypeScript (Node.js)** and **Python (FastMCP)** versions!

## Features

- **MCP Server**: Connect to MQTT brokers through Claude
- **Web Application**: Real-time background color changes via MQTT
- **Dual Implementation**: TypeScript (local) + Python (cloud deployment)
- Connect to MQTT brokers (supports mqtt:// and mqtts://)
- Publish messages to topics with QoS and retain options
- Subscribe to topics (including wildcard subscriptions)
- Unsubscribe from topics
- Check connection status
- Disconnect from brokers
- WebSocket real-time updates
- Interactive web UI with color presets
- FastMCP Cloud ready for one-click deployment

## Quick Start

### TypeScript Version (Local)

```bash
npm install
npm run build
```

### Python Version (FastMCP Cloud)

See [FASTMCP_DEPLOYMENT.md](FASTMCP_DEPLOYMENT.md) for one-click cloud deployment!

## Usage

### As a Claude Desktop MCP Server

#### Option 1: TypeScript Version (Local - Easy Setup)

Run the automated setup script:

```bash
npm run setup  # macOS/Linux
npm run setup:windows  # Windows
```

Or manually add this to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mqtt": {
      "command": "node",
      "args": ["/Users/sara/TestAlin/build/index.js"]
    }
  }
}
```

After adding this configuration, restart Claude Desktop.

#### Option 2: Python Version (FastMCP Cloud - Recommended)

Deploy to FastMCP Cloud for cloud-hosted MQTT MCP server:

1. Visit [https://fastmcp.cloud](https://fastmcp.cloud)
2. Create a project from this GitHub repository
3. Set entrypoint to `mqtt_mcp_server.py`
4. Deploy with one click!

See [FASTMCP_DEPLOYMENT.md](FASTMCP_DEPLOYMENT.md) for detailed instructions.

### Web Application with Color Changing Background

The web application subscribes to MQTT messages and changes its background color in real-time!

```bash
# Start the web server (defaults to port 3000)
npm run start:web

# Or specify custom settings
MQTT_BROKER=mqtt://test.mosquitto.org:1883 MQTT_TOPIC=color/change PORT=3000 npm run start:web
```

Then open your browser to `http://localhost:3000`

**How it works:**
1. The web app connects to the MQTT broker and subscribes to the configured topic (default: `color/change`)
2. When any MQTT client publishes a color to that topic, the background changes instantly
3. You can test it from the web UI or ask Claude to publish colors via the MCP server

**Environment Variables:**
- `MQTT_BROKER`: MQTT broker URL (default: `mqtt://test.mosquitto.org:1883`)
- `MQTT_TOPIC`: Topic to subscribe to (default: `color/change`)
- `PORT`: Web server port (default: `3000`)

### MCP Server Standalone

```bash
npm start
```

## Available Tools

### mqtt_connect

Connect to an MQTT broker.

**Parameters:**
- `broker_url` (required): MQTT broker URL (e.g., `mqtt://localhost:1883` or `mqtts://broker.hivemq.com:8883`)
- `client_id` (optional): Client ID for the connection
- `username` (optional): Username for authentication
- `password` (optional): Password for authentication

**Example:**
```
Connect to mqtt://test.mosquitto.org:1883
```

### mqtt_publish

Publish a message to an MQTT topic.

**Parameters:**
- `topic` (required): The MQTT topic to publish to
- `message` (required): The message payload
- `qos` (optional): Quality of Service level (0, 1, or 2). Default: 0
- `retain` (optional): Whether to retain the message. Default: false

**Example:**
```
Publish "Hello World" to topic "test/example"
```

### mqtt_subscribe

Subscribe to an MQTT topic to receive messages.

**Parameters:**
- `topic` (required): The MQTT topic (supports `+` for single-level and `#` for multi-level wildcards)
- `qos` (optional): Quality of Service level (0, 1, or 2). Default: 0

**Example:**
```
Subscribe to topic "sensors/#"
```

Note: Received messages are logged to stderr and will appear in Claude's context.

### mqtt_unsubscribe

Unsubscribe from an MQTT topic.

**Parameters:**
- `topic` (required): The MQTT topic to unsubscribe from

### mqtt_disconnect

Disconnect from the MQTT broker.

### mqtt_status

Get the current connection status including active subscriptions.

## Example Workflow

### Using the Web App with Claude's MCP Server

1. **Start the web application:**
   ```bash
   npm run start:web
   ```

2. **Open your browser** to `http://localhost:3000`

3. **Ask Claude to publish colors** (via MCP):
   ```
   Connect to mqtt://test.mosquitto.org:1883 and publish "red" to topic "color/change"
   ```

4. **Watch the background change** in real-time!

5. **Try different colors:**
   ```
   Publish "#FF5733" to topic "color/change"
   Publish "blue" to topic "color/change"
   Publish "rgb(46, 204, 113)" to topic "color/change"
   ```

### Using the MCP Server Only

1. Connect to a broker:
   ```
   Connect to the public MQTT broker at mqtt://test.mosquitto.org:1883
   ```

2. Subscribe to a topic:
   ```
   Subscribe to topic "test/demo"
   ```

3. Publish a message:
   ```
   Publish "Hello from Claude!" to topic "test/demo"
   ```

4. Check status:
   ```
   What's the MQTT connection status?
   ```

5. Disconnect:
   ```
   Disconnect from the MQTT broker
   ```

## Public Test Brokers

For testing, you can use these public MQTT brokers:

- `mqtt://test.mosquitto.org:1883` (Eclipse Mosquitto)
- `mqtt://broker.hivemq.com:1883` (HiveMQ)
- `mqtt://mqtt.eclipseprojects.io:1883` (Eclipse IoT)

**Note:** Do not send sensitive data to public brokers.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run watch
```

## License

MIT
