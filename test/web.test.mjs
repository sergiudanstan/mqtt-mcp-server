import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { WebSocket } from 'ws';
import { startBroker, freePort, waitFor } from './helpers.mjs';

const entry = fileURLToPath(new URL('../build/web-server.js', import.meta.url));
let broker;
let child;
let base;
let port;

before(async () => {
  broker = await startBroker();
  port = await freePort();
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, [entry], {
    env: { ...process.env, PORT: String(port), MQTT_BROKER: broker.url, MQTT_TOPIC: 'test/color' },
    stdio: 'ignore',
  });
  await waitFor(async () => (await (await fetch(`${base}/api/status`)).json()).mqtt.connected);
});

after(async () => {
  // SIGINT triggers the server's graceful shutdown, which waits for open sockets;
  // fall back to SIGKILL so a failed test can never hang the run.
  const exited = new Promise((resolve) => child.once('exit', resolve));
  child.kill('SIGINT');
  const timer = setTimeout(() => child.kill('SIGKILL'), 3000);
  await exited;
  clearTimeout(timer);
  await broker.close();
});

test('serves the static page', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /<html/i);
});

test('POST /api/publish validates input', async () => {
  const res = await fetch(`${base}/api/publish`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  assert.equal(res.status, 400);
});

test('a color published over HTTP reaches the broker and every WebSocket client', async () => {
  const ws = new WebSocket(`ws://127.0.0.1:${port}`);
  const messages = [];
  ws.on('message', (data) => messages.push(JSON.parse(data.toString())));
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });

  const res = await fetch(`${base}/api/publish`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ color: '#FF5733' }),
  });
  assert.equal(res.status, 200);

  try {
    const color = await waitFor(async () => messages.find((m) => m.type === 'color'), { timeout: 5000 });
    assert.deepEqual(color.data, { color: '#FF5733', topic: 'test/color' });
    assert.ok(broker.published.some((p) => p.topic === 'test/color' && p.payload === '#FF5733'));
  } finally {
    ws.terminate();
  }
});
