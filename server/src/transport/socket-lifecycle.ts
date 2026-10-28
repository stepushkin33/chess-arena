import type { WebSocket } from 'ws';

/** Detect half-open connections without leaking a timer after the socket closes. */
export function watchHeartbeat(client: WebSocket): void {
  let alive = true;
  client.on('pong', () => {
    alive = true;
  });
  const timer = setInterval(() => {
    if (!alive) {
      client.terminate();
      return;
    }
    if (client.readyState !== 1) return;
    alive = false;
    client.ping();
  }, 30_000);
  timer.unref();
  client.once('close', () => clearInterval(timer));
}

export class MessageRateLimit {
  private readonly windows = new WeakMap<object, { started: number; count: number }>();
  allows(client: object): boolean {
    const now = Date.now();
    let window = this.windows.get(client);
    if (!window || now - window.started > 10_000) {
      window = { started: now, count: 0 };
      this.windows.set(client, window);
    }
    return ++window.count <= 60;
  }
}
