#!/usr/bin/env node

import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import * as mqtt from "mqtt";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3000;
const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://test.mosquitto.org:1883";
const MQTT_TOPIC = process.env.MQTT_TOPIC || "color/change";

// Create Express app
const app = express();
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// MQTT client
let mqttClient: mqtt.MqttClient;

// Store connected WebSocket clients
const clients = new Set<WebSocket>();

// Serve static files
app.use(express.static(join(__dirname, "../public")));

// API endpoint to get current connection status
app.get("/api/status", (req, res) => {
  res.json({
    mqtt: {
      connected: mqttClient?.connected || false,
      broker: MQTT_BROKER,
      topic: MQTT_TOPIC,
    },
    websocket: {
      clients: clients.size,
    },
  });
});

// API endpoint to publish a color
app.post("/api/publish", express.json(), (req, res) => {
  const { color } = req.body;

  if (!color) {
    return res.status(400).json({ error: "Color is required" });
  }

  if (!mqttClient || !mqttClient.connected) {
    return res.status(503).json({ error: "MQTT client not connected" });
  }

  mqttClient.publish(MQTT_TOPIC, color, (error) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true, color });
  });
});

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("New WebSocket client connected");
  clients.add(ws);

  // Send current status
  ws.send(
    JSON.stringify({
      type: "status",
      data: {
        connected: mqttClient?.connected || false,
        broker: MQTT_BROKER,
        topic: MQTT_TOPIC,
      },
    })
  );

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
    clients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    clients.delete(ws);
  });
});

// Broadcast message to all connected WebSocket clients
function broadcast(message: any) {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Connect to MQTT broker
function connectMQTT() {
  console.log(`Connecting to MQTT broker: ${MQTT_BROKER}`);

  mqttClient = mqtt.connect(MQTT_BROKER, {
    reconnectPeriod: 5000,
    connectTimeout: 10000,
  });

  mqttClient.on("connect", () => {
    console.log(`Connected to MQTT broker: ${MQTT_BROKER}`);
    console.log(`Subscribing to topic: ${MQTT_TOPIC}`);

    mqttClient.subscribe(MQTT_TOPIC, (error) => {
      if (error) {
        console.error("Failed to subscribe:", error);
      } else {
        console.log(`Successfully subscribed to ${MQTT_TOPIC}`);
        broadcast({
          type: "status",
          data: { connected: true, broker: MQTT_BROKER, topic: MQTT_TOPIC },
        });
      }
    });
  });

  mqttClient.on("message", (topic, message) => {
    const color = message.toString();
    console.log(`Received color on topic "${topic}": ${color}`);

    // Broadcast the color change to all connected WebSocket clients
    broadcast({
      type: "color",
      data: { color, topic },
    });
  });

  mqttClient.on("error", (error) => {
    console.error("MQTT error:", error);
    broadcast({
      type: "error",
      data: { message: error.message },
    });
  });

  mqttClient.on("disconnect", () => {
    console.log("Disconnected from MQTT broker");
    broadcast({
      type: "status",
      data: { connected: false },
    });
  });

  mqttClient.on("reconnect", () => {
    console.log("Reconnecting to MQTT broker...");
  });
}

// Start the server
server.listen(PORT, () => {
  console.log(`Web server running on http://localhost:${PORT}`);
  console.log(`WebSocket server ready`);
  console.log(`MQTT Topic: ${MQTT_TOPIC}`);
  console.log(`\nSend a color name or hex code to the MQTT topic to change the background!`);
  console.log(`Example: red, blue, #FF5733, rgb(255, 87, 51)`);
  connectMQTT();
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down gracefully...");

  if (mqttClient) {
    mqttClient.end();
  }

  wss.close(() => {
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
});
