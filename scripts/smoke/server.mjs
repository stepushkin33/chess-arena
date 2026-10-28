/* global process */
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { fileURLToPath, URL } from 'node:url';

export async function startServer({ production = true } = {}) {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const environment = {
    ...process.env,
    NODE_ENV: production ? 'production' : 'development',
    PORT: String(port),
    RENDER_EXTERNAL_URL: origin,
  };
  delete environment.PUBLIC_URL;
  delete environment.ALLOWED_ORIGINS;
  delete environment.HOST;
  if (!production) delete environment.RENDER_EXTERNAL_URL;
  const entry = fileURLToPath(new URL('../../server/dist/main.js', import.meta.url));
  // A different cwd verifies that serving the client never depends on the shell directory.
  const child = spawn(process.execPath, [entry], {
    cwd: fileURLToPath(new URL('../../server/', import.meta.url)),
    env: environment,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk;
  });
  child.stderr.on('data', (chunk) => {
    output += chunk;
  });
  return { child, origin, logs: () => output };
}
