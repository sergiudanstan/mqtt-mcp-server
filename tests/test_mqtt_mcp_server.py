"""Tests for the Python (FastMCP) server. No broker is needed: paho's Client is
replaced by a recording fake, and everything goes through the MCP protocol layer
(fastmcp's in-memory Client), the same path an LLM-chosen tool call takes."""

import asyncio
import json
import os
import sys

import pytest
from fastmcp import Client

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import mqtt_mcp_server as srv  # noqa: E402

EXPECTED_TOOLS = {
    "mqtt_connect",
    "mqtt_publish",
    "mqtt_subscribe",
    "mqtt_unsubscribe",
    "mqtt_disconnect",
    "mqtt_status",
}


class FakeClient:
    """Stands in for paho.mqtt.client.Client; records calls, 'connects' at once."""

    instances = []

    def __init__(self, *args, **kwargs):
        self.kwargs = kwargs
        self.published = []
        self.subscribed = []
        self.auth = None
        self.on_connect = None
        FakeClient.instances.append(self)

    def username_pw_set(self, username, password=None):
        self.auth = (username, password)

    def reconnect_delay_set(self, **kwargs):
        pass

    def connect(self, host, port, keepalive=60):
        self.host, self.port = host, port

    def loop_start(self):
        self.on_connect(self, None, None, 0, None)

    def loop_stop(self):
        pass

    def disconnect(self):
        pass

    def publish(self, topic, message, qos=0, retain=False):
        self.published.append((topic, message, qos, retain))

        class Result:
            rc = 0

            def wait_for_publish(self):
                pass

        return Result()

    def subscribe(self, topic, qos=0):
        self.subscribed.append((topic, qos))
        return 0, 1

    def unsubscribe(self, topic):
        return 0, 2


@pytest.fixture(autouse=True)
def fresh_state(monkeypatch):
    FakeClient.instances.clear()
    monkeypatch.setattr(srv.mqtt, "Client", FakeClient)

    async def no_sleep(_):
        return None

    monkeypatch.setattr(srv.asyncio, "sleep", no_sleep)
    srv.mqtt_client = None
    srv.mqtt_connected = False
    srv.mqtt_subscriptions.clear()
    srv.mqtt_broker_url = ""
    yield


def call(name, **args):
    async def run():
        async with Client(srv.mcp) as client:
            result = await client.call_tool(name, args, raise_on_error=False)
            return result

    return asyncio.run(run())


def text(result):
    return "".join(part.text for part in result.content)


def test_registers_exactly_the_documented_tools():
    async def run():
        async with Client(srv.mcp) as client:
            return await client.list_tools()

    tools = asyncio.run(run())
    assert {t.name for t in tools} == EXPECTED_TOOLS


def test_publish_and_subscribe_refuse_when_not_connected():
    assert "Not connected" in text(call("mqtt_publish", topic="t", message="m"))
    assert "Not connected" in text(call("mqtt_subscribe", topic="t"))


def test_connect_then_publish_subscribe_status_disconnect():
    assert "Successfully connected" in text(
        call("mqtt_connect", broker_url="broker.example", port=8883, username="u", password="p")
    )
    fake = FakeClient.instances[-1]
    assert (fake.host, fake.port, fake.auth) == ("broker.example", 8883, ("u", "p"))

    assert "Successfully published" in text(
        call("mqtt_publish", topic="a/b", message="hello", qos=1, retain=True)
    )
    assert fake.published == [("a/b", "hello", 1, True)]

    assert "Successfully subscribed" in text(call("mqtt_subscribe", topic="a/#", qos=2))
    status = json.loads(text(call("mqtt_status")))
    assert status == {"connected": True, "broker": "broker.example:8883", "subscriptions": ["a/#"]}

    assert "Successfully disconnected" in text(call("mqtt_disconnect"))
    assert json.loads(text(call("mqtt_status")))["connected"] is False


def test_invalid_qos_is_rejected_without_publishing():
    call("mqtt_connect", broker_url="broker.example")
    fake = FakeClient.instances[-1]
    assert "QoS must be 0, 1, or 2" in text(call("mqtt_publish", topic="t", message="m", qos=7))
    assert fake.published == []


def test_wrongly_typed_arguments_are_rejected_by_the_protocol_layer():
    result = call("mqtt_connect", broker_url="broker.example", port="not-a-number")
    assert result.is_error
    assert not FakeClient.instances


def test_callbacks_write_nothing_to_stdout(capfd):
    class Msg:
        topic = "t"
        payload = b"hello"

    srv.on_connect(None, None, None, 0)
    srv.on_connect(None, None, None, 5)
    srv.on_message(None, None, Msg())
    srv.on_disconnect(None, None, None, 0)
    out, err = capfd.readouterr()
    assert out == ""
    assert "Connected to MQTT broker" in err


def test_server_startup_writes_only_json_rpc_to_stdout():
    import subprocess

    init = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {
        "protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "t", "version": "0"}}})
    proc = subprocess.run(
        [sys.executable, os.path.join(os.path.dirname(__file__), "..", "mqtt_mcp_server.py")],
        input=init + "\n", capture_output=True, text=True, timeout=60,
    )
    lines = [ln for ln in proc.stdout.splitlines() if ln.strip()]
    assert lines, proc.stderr
    for ln in lines:
        assert json.loads(ln)["jsonrpc"] == "2.0"
