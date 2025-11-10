#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as mqtt from "mqtt";

// MQTT client instance
let mqttClient: mqtt.MqttClient | null = null;
const subscriptions = new Map<string, (topic: string, message: Buffer) => void>();

// Available tools
const TOOLS: Tool[] = [
  {
    name: "mqtt_connect",
    description: "Connect to an MQTT broker",
    inputSchema: {
      type: "object",
      properties: {
        broker_url: {
          type: "string",
          description: "MQTT broker URL (e.g., mqtt://localhost:1883 or mqtts://broker.example.com:8883)",
        },
        client_id: {
          type: "string",
          description: "Optional client ID for the connection",
        },
        username: {
          type: "string",
          description: "Optional username for authentication",
        },
        password: {
          type: "string",
          description: "Optional password for authentication",
        },
      },
      required: ["broker_url"],
    },
  },
  {
    name: "mqtt_publish",
    description: "Publish a message to an MQTT topic",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "The MQTT topic to publish to",
        },
        message: {
          type: "string",
          description: "The message payload to publish",
        },
        qos: {
          type: "number",
          description: "Quality of Service level (0, 1, or 2). Default is 0",
          enum: [0, 1, 2],
        },
        retain: {
          type: "boolean",
          description: "Whether to retain the message on the broker. Default is false",
        },
      },
      required: ["topic", "message"],
    },
  },
  {
    name: "mqtt_subscribe",
    description: "Subscribe to an MQTT topic to receive messages",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "The MQTT topic to subscribe to (supports wildcards: + for single level, # for multi-level)",
        },
        qos: {
          type: "number",
          description: "Quality of Service level (0, 1, or 2). Default is 0",
          enum: [0, 1, 2],
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "mqtt_unsubscribe",
    description: "Unsubscribe from an MQTT topic",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "The MQTT topic to unsubscribe from",
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "mqtt_disconnect",
    description: "Disconnect from the MQTT broker",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "mqtt_status",
    description: "Get the current MQTT connection status",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// Create server instance
const server = new Server(
  {
    name: "mqtt-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "mqtt_connect": {
        if (mqttClient && mqttClient.connected) {
          return {
            content: [
              {
                type: "text",
                text: "Already connected to MQTT broker. Disconnect first if you want to connect to a different broker.",
              },
            ],
          };
        }

        const { broker_url, client_id, username, password } = args as {
          broker_url: string;
          client_id?: string;
          username?: string;
          password?: string;
        };

        const options: mqtt.IClientOptions = {};
        if (client_id) options.clientId = client_id;
        if (username) options.username = username;
        if (password) options.password = password;

        mqttClient = mqtt.connect(broker_url, options);

        return new Promise((resolve) => {
          mqttClient!.on("connect", () => {
            resolve({
              content: [
                {
                  type: "text",
                  text: `Successfully connected to MQTT broker at ${broker_url}`,
                },
              ],
            });
          });

          mqttClient!.on("error", (error) => {
            resolve({
              content: [
                {
                  type: "text",
                  text: `Failed to connect to MQTT broker: ${error.message}`,
                },
              ],
              isError: true,
            });
          });

          // Setup message handler for subscriptions
          mqttClient!.on("message", (topic, message) => {
            const handler = subscriptions.get(topic);
            if (handler) {
              handler(topic, message);
            }
          });

          // Timeout after 10 seconds
          setTimeout(() => {
            if (mqttClient && !mqttClient.connected) {
              resolve({
                content: [
                  {
                    type: "text",
                    text: "Connection timeout after 10 seconds",
                  },
                ],
                isError: true,
              });
            }
          }, 10000);
        });
      }

      case "mqtt_publish": {
        if (!mqttClient || !mqttClient.connected) {
          return {
            content: [
              {
                type: "text",
                text: "Not connected to MQTT broker. Use mqtt_connect first.",
              },
            ],
            isError: true,
          };
        }

        const { topic, message, qos = 0, retain = false } = args as {
          topic: string;
          message: string;
          qos?: 0 | 1 | 2;
          retain?: boolean;
        };

        return new Promise((resolve) => {
          mqttClient!.publish(topic, message, { qos, retain }, (error) => {
            if (error) {
              resolve({
                content: [
                  {
                    type: "text",
                    text: `Failed to publish message: ${error.message}`,
                  },
                ],
                isError: true,
              });
            } else {
              resolve({
                content: [
                  {
                    type: "text",
                    text: `Successfully published message to topic "${topic}"`,
                  },
                ],
              });
            }
          });
        });
      }

      case "mqtt_subscribe": {
        if (!mqttClient || !mqttClient.connected) {
          return {
            content: [
              {
                type: "text",
                text: "Not connected to MQTT broker. Use mqtt_connect first.",
              },
            ],
            isError: true,
          };
        }

        const { topic, qos = 0 } = args as {
          topic: string;
          qos?: 0 | 1 | 2;
        };

        return new Promise((resolve) => {
          mqttClient!.subscribe(topic, { qos }, (error) => {
            if (error) {
              resolve({
                content: [
                  {
                    type: "text",
                    text: `Failed to subscribe to topic: ${error.message}`,
                  },
                ],
                isError: true,
              });
            } else {
              // Store subscription handler
              subscriptions.set(topic, (receivedTopic, message) => {
                console.error(
                  `Received message on topic "${receivedTopic}": ${message.toString()}`
                );
              });

              resolve({
                content: [
                  {
                    type: "text",
                    text: `Successfully subscribed to topic "${topic}". Messages will be logged to stderr.`,
                  },
                ],
              });
            }
          });
        });
      }

      case "mqtt_unsubscribe": {
        if (!mqttClient || !mqttClient.connected) {
          return {
            content: [
              {
                type: "text",
                text: "Not connected to MQTT broker.",
              },
            ],
            isError: true,
          };
        }

        const { topic } = args as { topic: string };

        return new Promise((resolve) => {
          mqttClient!.unsubscribe(topic, (error) => {
            if (error) {
              resolve({
                content: [
                  {
                    type: "text",
                    text: `Failed to unsubscribe from topic: ${error.message}`,
                  },
                ],
                isError: true,
              });
            } else {
              subscriptions.delete(topic);
              resolve({
                content: [
                  {
                    type: "text",
                    text: `Successfully unsubscribed from topic "${topic}"`,
                  },
                ],
              });
            }
          });
        });
      }

      case "mqtt_disconnect": {
        if (!mqttClient) {
          return {
            content: [
              {
                type: "text",
                text: "No active MQTT connection.",
              },
            ],
          };
        }

        return new Promise((resolve) => {
          mqttClient!.end(false, {}, () => {
            subscriptions.clear();
            mqttClient = null;
            resolve({
              content: [
                {
                  type: "text",
                  text: "Successfully disconnected from MQTT broker.",
                },
              ],
            });
          });
        });
      }

      case "mqtt_status": {
        if (!mqttClient) {
          return {
            content: [
              {
                type: "text",
                text: "No MQTT client initialized.",
              },
            ],
          };
        }

        const status = {
          connected: mqttClient.connected,
          reconnecting: mqttClient.reconnecting,
          subscriptions: Array.from(subscriptions.keys()),
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error executing tool: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MQTT MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
