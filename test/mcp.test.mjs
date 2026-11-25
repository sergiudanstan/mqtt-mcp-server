import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { startBroker, waitFor } from './helpers.mjs';

const entry = fileURLToPath(new URL('../build/index.js', import.meta.url));
let client;
let broker;

before(async () => {
  broker = await startBroker();
  client = new Client({ name: 'mqtt-mcp-test', version: '0.0.0' });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [entry], stderr: 'pipe' }));
});

after(async () => {
  await client.close();
  await broker.close();
});

const text = (res) => res.content.map((c) => c.text).join('\n');
const call = (name, args = {}) => client.callTool({ name, arguments: args });

test('lists the six documented tools', async () => {
  const { tools } = await client.listTools();
  assert.deepEqual(
    tools.map((t) => t.name).sort(),
    ['mqtt_connect', 'mqtt_disconnect', 'mqtt_publish', 'mqtt_status', 'mqtt_subscribe', 'mqtt_unsubscribe'],
  );
});

test('unknown tools and calls before connecting are errors', async () => {
  assert.equal((await call('mqtt_nope')).isError, true);
  const pub = await call('mqtt_publish', { topic: 't', message: 'm' });
  assert.equal(pub.isError, true);
  assert.match(text(pub), /Not connected/);
});

test('connect, subscribe, publish (QoS 1, retained), status, unsubscribe, disconnect against a real broker', async () => {
  const connected = await call('mqtt_connect', { broker_url: broker.url, client_id: 'mcp-test' });
  assert.notEqual(connected.isError, true, text(connected));
  assert.match(text(connected), /Successfully connected/);

  assert.match(text(await call('mqtt_subscribe', { topic: 'sensors/#' })), /Successfully subscribed/);
  assert.deepEqual(JSON.parse(text(await call('mqtt_status'))).subscriptions, ['sensors/#']);

  const pub = await call('mqtt_publish', { topic: 'sensors/temp', message: '21.5', qos: 1, retain: true });
  assert.match(text(pub), /Successfully published/);
  // aedes emits its 'publish' event asynchronously with respect to the client's ack
  const seen = await waitFor(async () => broker.published.find((p) => p.topic === 'sensors/temp'));
  assert.deepEqual(seen, { topic: 'sensors/temp', payload: '21.5', retain: true });

  assert.match(text(await call('mqtt_unsubscribe', { topic: 'sensors/#' })), /Successfully unsubscribed/);
  assert.deepEqual(JSON.parse(text(await call('mqtt_status'))).subscriptions, []);

  assert.match(text(await call('mqtt_disconnect')), /Successfully disconnected/);
  assert.match(text(await call('mqtt_status')), /No MQTT client initialized/);
});

test('connecting to a closed port reports an error instead of hanging', async () => {
  await call('mqtt_disconnect'); // start from a clean state even if an earlier test failed midway
  const res = await call('mqtt_connect', { broker_url: 'mqtt://127.0.0.1:1' });
  assert.equal(res.isError, true);
  assert.match(text(res), /Failed to connect|timeout/i);
  await call('mqtt_disconnect');
});
