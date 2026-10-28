/* global AbortSignal, console, fetch, setTimeout, clearTimeout */
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { startServer } from './smoke/server.mjs';
import { Peer } from './smoke/peer.mjs';
import { WebSocket } from 'ws';

// Test the same production entrypoint used by Render, with real browser and socket routes.
const { child, origin, logs } = await startServer();
const socketUrl = origin.replace('http:', 'ws:') + '/ws';
const peers = [];
const connect = () => {
  const peer = new Peer(socketUrl, origin);
  peers.push(peer);
  return peer;
};

try {
  let healthy = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${origin}/health`, { signal: AbortSignal.timeout(500) });
      healthy = response.ok && (await response.json()).status === 'ok';
    } catch {
      /* startup */
    }
    if (healthy) break;
    if (child.exitCode !== null) throw new Error(logs());
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(healthy, 'Nest health endpoint must be ready');
  const page = await fetch(origin);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /text\/html/);
  assert.equal(page.headers.get('cache-control'), 'no-cache');
  const html = await page.text();
  assert.match(html, /id="root"/);
  const invitation = await fetch(origin + '/room/ABC123');
  assert.equal(await invitation.text(), html, 'Direct invitation navigation must return the app');
  const asset = html.match(/src="([^"]+\.js)"/)?.[1];
  assert.ok(asset, 'Built page must reference a JavaScript bundle');
  const bundle = await fetch(origin + asset);
  assert.equal(bundle.status, 200);
  assert.match(bundle.headers.get('cache-control'), /immutable/);
  const piece = await fetch(origin + '/pieces/cburnett/wK.svg');
  assert.match(await piece.text(), /<svg/);
  for (const path of ['/assets/missing.js', '/api/missing', '/not-a-page']) {
    assert.equal((await fetch(origin + path)).status, 404, path + ' must not return the app shell');
  }
  const blocked = new WebSocket(socketUrl, {
    origin: 'https://untrusted.example',
  });
  await new Promise((resolve, reject) => {
    blocked.once('open', () => {
      blocked.close();
      reject(new Error('An untrusted origin was accepted'));
    });
    blocked.once('error', (error) => {
      if (/40[13]/.test(error.message)) resolve();
      else reject(error);
    });
  });
  const white = connect();
  await white.next((message) => message.event === 'connected');
  white.send('create_room', { name: 'White', playerId: 'smoke-white' });
  const created = await white.next((message) => message.event === 'room_created');
  const roomId = created.data.roomId;
  assert.equal(created.data.inviteUrl, `/room/${roomId}`);
  const black = connect();
  await black.next((message) => message.event === 'connected');
  black.send('join_room', { name: 'Black', playerId: 'smoke-black', roomId });
  await black.next((message) => message.event === 'room_joined');
  await white.state((room) => room.playersCount === 2);
  const third = connect();
  await third.next((message) => message.event === 'connected');
  third.send('join_room', { name: 'Third', roomId });
  assert.equal((await third.next((message) => message.event === 'error')).data.code, 'ROOM_FULL');
  black.send('move', { move: { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } } });
  await black.next((message) => message.event === 'error');
  white.send('move', { move: { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } } });
  await black.state((room) => room.state.moveHistory.length === 1);
  black.send('move', { move: { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } } });
  await white.state((room) => room.state.moveHistory.length === 2);
  white.send('move', { move: { from: { row: 4, col: 4 }, to: { row: 3, col: 3 } } });
  const capture = await black.state((room) => room.state.moveHistory.length === 3);
  assert.equal(capture.data.state.moveHistory[2].captured, 'p');
  black.send('offer_draw');
  await white.state((room) => room.drawOfferFrom?.name === 'Black');
  black.send('cancel_draw');
  await white.state((room) => room.state.moveHistory.length === 3 && room.drawOfferFrom === null);
  black.send('offer_draw');
  await white.state((room) => Boolean(room.drawOfferFrom));
  white.send('respond_draw', { accept: true });
  await black.state((room) => room.state.status === 'draw');
  black.send('rematch');
  await white.state((room) => room.rematchOfferFrom?.name === 'Black');
  white.send('respond_rematch', { accept: true });
  await black.state(
    (room) => room.state.status === 'playing' && room.state.moveHistory.length === 0,
  );
  black.send('resign');
  const result = await white.state((room) => room.state.status === 'resigned');
  assert.equal(result.data.you.wins, 1);
  console.log(
    'Smoke passed: app, direct invite, asset caching, real 404s, health, origin check, invite, full room, illegal turn, capture, draw/cancel, rematch, resign, score.',
  );
} catch (error) {
  console.error(logs());
  throw error;
} finally {
  for (const peer of peers) {
    for (const waiter of peer.waiters) clearTimeout(waiter.timer);
    peer.socket.terminate();
  }
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM');
    await once(child, 'exit');
  }
}
