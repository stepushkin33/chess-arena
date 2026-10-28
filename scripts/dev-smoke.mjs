/* global AbortSignal, console, fetch, setTimeout, clearTimeout */
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { connect } from 'node:net';
import { randomBytes } from 'node:crypto';
import { fileURLToPath, URL } from 'node:url';
import { createServer, createLogger } from 'vite';
import { WebSocket } from 'ws';
import { createDevLogger } from '../client/dev/logger.ts';
import { createGameConnection } from '../client/src/shared/api/game-connection.ts';
import { startServer } from './smoke/server.mjs';
import { Peer } from './smoke/peer.mjs';

const { child, origin, logs } = await startServer({ production: false });
const errors = [];
const logger = createLogger('silent');
logger.error = (message, options) => errors.push({ message, code: options?.error?.code });
const peers = [];
let vite;
let transport;
let joinTimer;

try {
  let healthy = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      healthy = (await fetch(origin + '/health', { signal: AbortSignal.timeout(500) })).ok;
    } catch {
      /* startup */
    }
    if (healthy) break;
    if (child.exitCode !== null) throw new Error(logs());
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(healthy, 'Nest must be ready');
  vite = await createServer({
    root: fileURLToPath(new URL('../client', import.meta.url)),
    configFile: fileURLToPath(new URL('../client/vite.config.ts', import.meta.url)),
    customLogger: createDevLogger(logger),
    server: {
      host: '127.0.0.1',
      port: 0,
      proxy: {
        '/ws': { target: origin, ws: true, changeOrigin: true },
        '/health': { target: origin },
      },
    },
  });
  await vite.listen();
  const port = vite.httpServer.address().port;
  const devOrigin = `http://127.0.0.1:${port}`;
  assert.equal((await fetch(devOrigin + '/health')).status, 200);
  assert.equal((await fetch(devOrigin + '/src/App.tsx')).status, 200);

  // Reproduce a tab refresh or network loss during an HTTP upgrade, including TCP resets.
  for (let index = 0; index < 100; index++)
    await new Promise((resolve) => {
      const socket = connect(port, '127.0.0.1', () => {
        socket.write(
          `GET /ws HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: ${randomBytes(16).toString('base64')}\r\n\r\n`,
        );
        if (index % 2) socket.end();
        else setTimeout(() => socket.destroy(), index % 5);
      });
      socket.on('error', () => {});
      socket.on('data', () => {});
      socket.once('close', resolve);
    });
  const joinPeer = async () => {
    const peer = new Peer(`ws://127.0.0.1:${port}/ws`, devOrigin);
    peers.push(peer);
    await peer.next((message) => message.event === 'connected');
    return peer;
  };
  const white = await joinPeer();
  white.send('create_room', { name: 'White', playerId: 'dev-white' });
  const {
    data: { roomId },
  } = await white.next((message) => message.event === 'room_created');
  const black = await joinPeer();
  black.send('join_room', { roomId, name: 'Black', playerId: 'dev-black' });
  await black.next((message) => message.event === 'room_joined');
  await white.state((room) => room.playersCount === 2);
  white.send('move', { move: { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } } });
  await black.state((room) => room.state.moveHistory.length === 1);
  black.socket.close();
  await white.next((message) => message.event === 'opponent_left');
  // Exercise the actual browser transport, including its automatic rejoin callback.
  const sockets = [];
  const joinCommand = {
    event: 'join_room',
    data: { roomId, name: 'Black', playerId: 'dev-black' },
  };
  let joined;
  const nextJoin = () =>
    new Promise((resolve, reject) => {
      joinTimer = setTimeout(() => reject(new Error('Client transport did not rejoin')), 5000);
      joined = (room) => {
        clearTimeout(joinTimer);
        resolve(room);
      };
    });
  let firstConnection = true;
  const firstJoin = nextJoin();
  transport = createGameConnection(
    `ws://127.0.0.1:${port}/ws`,
    {
      onReady(ready) {
        if (ready && firstConnection) {
          firstConnection = false;
          transport.send(joinCommand);
        }
      },
      onReconnect: (send) => send(joinCommand),
      onMessage: (message) => {
        if (message.event === 'room_joined') joined(message.data);
      },
    },
    (address) => {
      const socket = new WebSocket(address, { origin: devOrigin });
      sockets.push(socket);
      return socket;
    },
  );
  await firstJoin;
  const afterDisconnect = nextJoin();
  sockets[0].terminate();
  const rejoined = await afterDisconnect;
  assert.equal(sockets.length, 2);
  assert.equal(rejoined.state.moveHistory.length, 1);
  assert.equal(rejoined.you.color, 'black');
  assert.deepEqual(errors, [], 'Expected browser disconnects must not be logged as server errors');

  transport.dispose();
  for (const peer of peers) peer.socket.terminate();
  child.kill('SIGTERM');
  await once(child, 'exit');
  const unavailable = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  await new Promise((resolve, reject) => {
    unavailable.once('error', resolve);
    unavailable.once('open', () => {
      unavailable.terminate();
      reject(new Error('Stopped backend accepted a connection'));
    });
  });
  assert.ok(
    errors.some((error) => error.code === 'ECONNREFUSED'),
    'A genuine unavailable backend must stay visible',
  );
  console.log(
    'Dev smoke passed: 100 interrupted handshakes, Vite transform, two players, move, room reconnect, real backend failure diagnostics.',
  );
} catch (error) {
  console.error(logs(), errors);
  throw error;
} finally {
  transport?.dispose();
  clearTimeout(joinTimer);
  for (const peer of peers) {
    for (const waiter of peer.waiters) clearTimeout(waiter.timer);
    peer.socket.terminate();
  }
  await vite?.close();
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM');
    await once(child, 'exit');
  }
}
