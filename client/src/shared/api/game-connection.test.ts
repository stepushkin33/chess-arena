import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGameConnection } from './game-connection';

class FakeSocket {
  readyState: number = WebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = WebSocket.CLOSED;
  });
  open(): void {
    this.readyState = WebSocket.OPEN;
    this.onopen?.();
  }
  disconnect(): void {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.();
  }
}

const transports: Array<ReturnType<typeof createGameConnection>> = [];
function setup() {
  const sockets: FakeSocket[] = [];
  const callbacks = { onReady: vi.fn(), onMessage: vi.fn(), onReconnect: vi.fn() };
  const createSocket = () => {
    const socket = new FakeSocket();
    sockets.push(socket);
    return socket as unknown as WebSocket;
  };
  const transport = createGameConnection('ws://chess.example/ws', callbacks, createSocket);
  transports.push(transport);
  return { transport, sockets, callbacks };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  for (const transport of transports.splice(0)) transport.dispose();
  vi.useRealTimers();
});

describe('game connection lifecycle', () => {
  it('does not open the disposable connection from a StrictMode setup/cleanup cycle', () => {
    const first = setup();
    first.transport.dispose();
    const second = setup();
    vi.advanceTimersByTime(0);
    expect(first.sockets).toHaveLength(0);
    expect(second.sockets).toHaveLength(1);
  });
  it('finishes an in-flight handshake before closing and ignores its late callbacks', () => {
    const { transport, sockets, callbacks } = setup();
    vi.advanceTimersByTime(0);
    transport.dispose();
    expect(sockets[0].close).not.toHaveBeenCalled();
    sockets[0].open();
    expect(sockets[0].close).toHaveBeenCalledWith(1000, 'Session disposed');
    expect(callbacks.onReady).not.toHaveBeenCalled();
    sockets[0].disconnect();
    vi.advanceTimersByTime(5000);
    expect(sockets).toHaveLength(1);
  });
  it('closes an established connection normally and cancels future reconnects', () => {
    const { transport, sockets } = setup();
    vi.advanceTimersByTime(0);
    sockets[0].open();
    transport.dispose();
    expect(sockets[0].close).toHaveBeenCalledWith(1000, 'Session disposed');
    sockets[0].disconnect();
    vi.advanceTimersByTime(5000);
    expect(sockets).toHaveLength(1);
    expect(transport.send({ event: 'leave_room' })).toBe(false);
  });
  it('reconnects once, rejects commands while offline and ignores the old socket', () => {
    const { transport, sockets, callbacks } = setup();
    vi.advanceTimersByTime(0);
    sockets[0].open();
    sockets[0].disconnect();
    expect(callbacks.onReady).toHaveBeenLastCalledWith(false);
    expect(transport.send({ event: 'resign' })).toBe(false);
    vi.advanceTimersByTime(1500);
    sockets[1].open();
    expect(callbacks.onReconnect).toHaveBeenCalledOnce();
    sockets[0].onclose?.();
    vi.advanceTimersByTime(5000);
    expect(sockets).toHaveLength(2);
    expect(transport.send({ event: 'leave_room' })).toBe(true);
    expect(sockets[1].send).toHaveBeenCalledWith('{"event":"leave_room","data":{}}');
  });
  it('retries an unsuccessful first handshake without treating it as a room reconnect', () => {
    const { sockets, callbacks } = setup();
    vi.advanceTimersByTime(0);
    sockets[0].onerror?.();
    sockets[0].disconnect();
    vi.advanceTimersByTime(1500);
    sockets[1].open();
    expect(callbacks.onReady).toHaveBeenLastCalledWith(true);
    expect(callbacks.onReconnect).not.toHaveBeenCalled();
  });
  it('handles malformed input and a send failure without throwing or queuing stale commands', () => {
    const { transport, sockets, callbacks } = setup();
    vi.advanceTimersByTime(0);
    sockets[0].open();
    sockets[0].onmessage?.({ data: 'not JSON' });
    expect(callbacks.onMessage).not.toHaveBeenCalled();
    sockets[0].send.mockImplementation(() => {
      throw new Error('connection closed');
    });
    expect(transport.send({ event: 'resign' })).toBe(false);
    transport.dispose();
    sockets[0].onmessage?.({ data: '{"event":"connected","data":{"connectionId":"late"}}' });
    expect(callbacks.onMessage).not.toHaveBeenCalled();
  });
});
