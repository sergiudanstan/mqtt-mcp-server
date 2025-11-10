# FastMCP Cloud Deployment Guide

This guide will help you deploy the Python version of the MQTT MCP Server to FastMCP Cloud in under 5 minutes!

## Prerequisites

- GitHub account
- Your repository pushed to GitHub

## Deployment Steps

### 1. Visit FastMCP Cloud

Go to [https://fastmcp.cloud](https://fastmcp.cloud) and sign in with your GitHub account.

### 2. Create a New Project

1. Click **"New Project"** or **"Create Project"**
2. Select your GitHub repository: `mqtt-mcp-server`
3. Configure the project:
   - **Name**: `mqtt-mcp-server`
   - **Entrypoint**: `mqtt_mcp_server.py`
   - **Description**: MQTT MCP Server with real-time messaging

### 3. Deploy

Click **"Deploy"** and FastMCP Cloud will:
- ✅ Detect your dependencies from `requirements.txt`
- ✅ Install `fastmcp` and `paho-mqtt`
- ✅ Build and deploy your MCP server
- ✅ Generate a secure endpoint

### 4. Get Your MCP Server URL

Once deployed, FastMCP Cloud will provide you with:
- A secure HTTPS endpoint URL
- Authentication credentials (if needed)
- Access to ChatMCP for testing

## Testing Your Deployment

### Option 1: Use ChatMCP (Built-in)

FastMCP Cloud includes ChatMCP for instant testing:

1. Click on your deployed project
2. Open **ChatMCP**
3. Try these commands:
   - "Connect to mqtt://test.mosquitto.org"
   - "Publish 'Hello from FastMCP Cloud!' to topic 'test/demo'"
   - "Subscribe to topic 'test/#'"
   - "Check the MQTT status"

### Option 2: Configure Claude Desktop

Add your FastMCP Cloud deployment to Claude Desktop:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mqtt-cloud": {
      "url": "https://YOUR-DEPLOYMENT-URL.fastmcp.cloud",
      "apiKey": "YOUR-API-KEY"
    }
  }
}
```

Replace:
- `YOUR-DEPLOYMENT-URL` with your actual FastMCP Cloud URL
- `YOUR-API-KEY` with your API key (if authentication is enabled)

Then restart Claude Desktop!

## Testing the Color Changing Web App

1. **Start your local web server** (the TypeScript version):
   ```bash
   npm run start:web
   ```

2. **Open browser** to http://localhost:3000

3. **In Claude Desktop**, ask:
   ```
   Connect to mqtt://test.mosquitto.org and publish "purple" to topic "color/change"
   ```

4. **Watch the background change** in real-time! 🎨

## Available MQTT Tools

Your FastMCP Cloud deployment includes all 6 MQTT tools:

1. **mqtt_connect** - Connect to MQTT brokers
2. **mqtt_publish** - Publish messages to topics
3. **mqtt_subscribe** - Subscribe to topics (with wildcards)
4. **mqtt_unsubscribe** - Unsubscribe from topics
5. **mqtt_disconnect** - Disconnect from broker
6. **mqtt_status** - Check connection status

## Features

✅ **Zero Configuration** - FastMCP Cloud handles all infrastructure
✅ **Auto-Deploy** - New commits automatically trigger deployments
✅ **Built-in Testing** - ChatMCP included with every deployment
✅ **Secure** - HTTPS endpoints with authentication
✅ **Scalable** - Automatically scales based on usage
✅ **Global** - Fast response times worldwide

## Troubleshooting

### Deployment Failed

- Check that `mqtt_mcp_server.py` is in the root of your repository
- Verify `requirements.txt` exists and contains the correct dependencies
- Check the deployment logs in FastMCP Cloud dashboard

### Connection Issues

- Ensure the MQTT broker URL is accessible from FastMCP Cloud's infrastructure
- Public brokers like `test.mosquitto.org` work best
- For private brokers, ensure they allow external connections

### Tools Not Showing in Claude Desktop

- Verify your Claude Desktop config file has the correct URL
- Restart Claude Desktop completely (quit and reopen)
- Check that the deployment status is "Running" in FastMCP Cloud

## Monitoring

FastMCP Cloud provides:
- Real-time deployment status
- Request logs
- Error tracking
- Performance metrics

Access these in your project dashboard.

## Support

- FastMCP Documentation: https://gofastmcp.com
- FastMCP Cloud: https://fastmcp.cloud
- GitHub Issues: Create an issue in your repository

## Next Steps

1. ✅ Deploy to FastMCP Cloud
2. ✅ Test with ChatMCP
3. ✅ Configure Claude Desktop
4. ✅ Test with the color-changing web app
5. 🎨 Start building amazing MQTT integrations!

---

**Pro Tip**: FastMCP Cloud automatically redeploys when you push changes to GitHub. Just commit, push, and your MCP server updates automatically!
