#!/usr/bin/env python3
"""
MQTT MCP Server - Python version for FastMCP Cloud
Provides MQTT client functionality through Model Context Protocol
"""

import asyncio
from typing import Optional, Dict, Set
import paho.mqtt.client as mqtt
from fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("MQTT MCP Server")

# Global MQTT client and state
mqtt_client: Optional[mqtt.Client] = None
mqtt_connected: bool = False
mqtt_subscriptions: Set[str] = set()
mqtt_broker_url: str = ""
message_callbacks: Dict[str, callable] = {}


def on_connect(client, userdata, flags, rc, properties=None):
    """Callback when MQTT client connects"""
    global mqtt_connected
    if rc == 0:
        mqtt_connected = True
        print(f"Connected to MQTT broker with result code {rc}")
    else:
        mqtt_connected = False
        print(f"Failed to connect to MQTT broker with result code {rc}")


def on_disconnect(client, userdata, rc, properties=None):
    """Callback when MQTT client disconnects"""
    global mqtt_connected
    mqtt_connected = False
    print(f"Disconnected from MQTT broker with result code {rc}")


def on_message(client, userdata, msg):
    """Callback when MQTT message is received"""
    topic = msg.topic
    payload = msg.payload.decode('utf-8', errors='ignore')
    print(f"Received message on topic '{topic}': {payload}")


@mcp.tool()
async def mqtt_connect(
    broker_url: str,
    client_id: Optional[str] = None,
    username: Optional[str] = None,
    password: Optional[str] = None,
    port: int = 1883
) -> str:
    """
    Connect to an MQTT broker.

    Args:
        broker_url: MQTT broker hostname or IP (e.g., 'test.mosquitto.org')
        client_id: Optional client ID for the connection
        username: Optional username for authentication
        password: Optional password for authentication
        port: MQTT broker port (default: 1883)

    Returns:
        Connection status message
    """
    global mqtt_client, mqtt_connected, mqtt_broker_url

    if mqtt_client and mqtt_connected:
        return "Already connected to MQTT broker. Disconnect first if you want to connect to a different broker."

    try:
        # Create MQTT client
        if client_id:
            mqtt_client = mqtt.Client(client_id=client_id, protocol=mqtt.MQTTv5)
        else:
            mqtt_client = mqtt.Client(protocol=mqtt.MQTTv5)

        # Set callbacks
        mqtt_client.on_connect = on_connect
        mqtt_client.on_disconnect = on_disconnect
        mqtt_client.on_message = on_message

        # Set authentication if provided
        if username:
            mqtt_client.username_pw_set(username, password)

        # Connect to broker
        mqtt_broker_url = f"{broker_url}:{port}"
        mqtt_client.connect(broker_url, port, keepalive=60)

        # Start network loop in background
        mqtt_client.loop_start()

        # Wait a bit for connection to establish
        await asyncio.sleep(1)

        if mqtt_connected:
            return f"Successfully connected to MQTT broker at {mqtt_broker_url}"
        else:
            return f"Connection initiated to {mqtt_broker_url}, but not yet confirmed. Please check broker availability."

    except Exception as e:
        mqtt_connected = False
        return f"Failed to connect to MQTT broker: {str(e)}"


@mcp.tool()
async def mqtt_publish(
    topic: str,
    message: str,
    qos: int = 0,
    retain: bool = False
) -> str:
    """
    Publish a message to an MQTT topic.

    Args:
        topic: The MQTT topic to publish to
        message: The message payload to publish
        qos: Quality of Service level (0, 1, or 2). Default is 0
        retain: Whether to retain the message on the broker. Default is False

    Returns:
        Publication status message
    """
    global mqtt_client, mqtt_connected

    if not mqtt_client or not mqtt_connected:
        return "Not connected to MQTT broker. Use mqtt_connect first."

    if qos not in [0, 1, 2]:
        return "QoS must be 0, 1, or 2"

    try:
        result = mqtt_client.publish(topic, message, qos=qos, retain=retain)

        # Wait for publish to complete
        result.wait_for_publish()

        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            return f"Successfully published message to topic '{topic}'"
        else:
            return f"Failed to publish message: {mqtt.error_string(result.rc)}"

    except Exception as e:
        return f"Failed to publish message: {str(e)}"


@mcp.tool()
async def mqtt_subscribe(
    topic: str,
    qos: int = 0
) -> str:
    """
    Subscribe to an MQTT topic to receive messages.

    Args:
        topic: The MQTT topic to subscribe to (supports wildcards: + for single level, # for multi-level)
        qos: Quality of Service level (0, 1, or 2). Default is 0

    Returns:
        Subscription status message
    """
    global mqtt_client, mqtt_connected, mqtt_subscriptions

    if not mqtt_client or not mqtt_connected:
        return "Not connected to MQTT broker. Use mqtt_connect first."

    if qos not in [0, 1, 2]:
        return "QoS must be 0, 1, or 2"

    try:
        result, mid = mqtt_client.subscribe(topic, qos=qos)

        if result == mqtt.MQTT_ERR_SUCCESS:
            mqtt_subscriptions.add(topic)
            return f"Successfully subscribed to topic '{topic}'. Messages will be logged to stderr."
        else:
            return f"Failed to subscribe to topic: {mqtt.error_string(result)}"

    except Exception as e:
        return f"Failed to subscribe to topic: {str(e)}"


@mcp.tool()
async def mqtt_unsubscribe(topic: str) -> str:
    """
    Unsubscribe from an MQTT topic.

    Args:
        topic: The MQTT topic to unsubscribe from

    Returns:
        Unsubscription status message
    """
    global mqtt_client, mqtt_connected, mqtt_subscriptions

    if not mqtt_client or not mqtt_connected:
        return "Not connected to MQTT broker."

    try:
        result, mid = mqtt_client.unsubscribe(topic)

        if result == mqtt.MQTT_ERR_SUCCESS:
            mqtt_subscriptions.discard(topic)
            return f"Successfully unsubscribed from topic '{topic}'"
        else:
            return f"Failed to unsubscribe from topic: {mqtt.error_string(result)}"

    except Exception as e:
        return f"Failed to unsubscribe from topic: {str(e)}"


@mcp.tool()
async def mqtt_disconnect() -> str:
    """
    Disconnect from the MQTT broker.

    Returns:
        Disconnection status message
    """
    global mqtt_client, mqtt_connected, mqtt_subscriptions

    if not mqtt_client:
        return "No active MQTT connection."

    try:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        mqtt_connected = False
        mqtt_subscriptions.clear()
        mqtt_client = None

        return "Successfully disconnected from MQTT broker."

    except Exception as e:
        return f"Error during disconnect: {str(e)}"


@mcp.tool()
async def mqtt_status() -> str:
    """
    Get the current MQTT connection status.

    Returns:
        JSON string with connection status and active subscriptions
    """
    global mqtt_client, mqtt_connected, mqtt_subscriptions, mqtt_broker_url

    import json

    status = {
        "connected": mqtt_connected,
        "broker": mqtt_broker_url if mqtt_connected else None,
        "subscriptions": list(mqtt_subscriptions)
    }

    return json.dumps(status, indent=2)


if __name__ == "__main__":
    # Run the MCP server
    mcp.run()
