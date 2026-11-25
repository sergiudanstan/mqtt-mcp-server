import net from 'node:net';
import { Aedes } from 'aedes';

// A real in-process MQTT broker on a free local port, so the tests exercise the
// actual mqtt client libraries over TCP without any external service.
export async function startBroker() {
  const aedes = await Aedes.createBroker();
  const server = net.createServer(aedes.handle);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const published = [];
  aedes.on('publish', (packet) => {
    if (!packet.topic.startsWith('$SYS')) published.push({ topic: packet.topic, payload: packet.payload.toString(), retain: packet.retain });
  });
  return {
    url: `mqtt://127.0.0.1:${port}`,
    published,
    async close() {
      await new Promise((resolve) => aedes.close(resolve));
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

export async function freePort() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

export async function waitFor(fn, { timeout = 10000, interval = 100 } = {}) {
  const end = Date.now() + timeout;
  for (;;) {
    const value = await fn().catch(() => undefined);
    if (value) return value;
    if (Date.now() > end) throw new Error('waitFor timed out');
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}
