import type { ClientCommand, ServerMessage } from '@chess/shared';
import { parseServerMessage } from './server-message';

export type SendCommand = (command: ClientCommand) => boolean;
interface ConnectionCallbacks {
  onMessage: (message: ServerMessage) => void;
  onReady: (ready: boolean) => void;
  onReconnect: (send: SendCommand) => void;
}

/** One disposable transport. React can mount/clean up/remount it without aborting a handshake. */
export function createGameConnection(
  url: string,
  callbacks: ConnectionCallbacks,
  createSocket = (address: string): WebSocket => new WebSocket(address),
) {
  let socket: WebSocket | null = null;
  let stopped = false;
  let connectedBefore = false;
  let timer: ReturnType<typeof setTimeout>;

  const send: SendCommand = (command) => {
    if (stopped || socket?.readyState !== WebSocket.OPEN) return false;
    try {
      socket.send(JSON.stringify({ ...command, data: command.data ?? {} }));
      return true;
    } catch {
      return false;
    }
  };
  const connect = (): void => {
    if (stopped) return;
    const client = createSocket(url);
    socket = client;
    const current = () => !stopped && socket === client;
    client.onopen = () => {
      if (!current()) {
        client.close(1000, 'Session disposed');
        return;
      }
      callbacks.onReady(true);
      if (connectedBefore) callbacks.onReconnect(send);
      connectedBefore = true;
    };
    client.onmessage = (event) => {
      if (!current()) return;
      const message = parseServerMessage(String(event.data));
      if (message) callbacks.onMessage(message);
    };
    client.onclose = () => {
      if (!current()) return;
      socket = null;
      callbacks.onReady(false);
      timer = setTimeout(connect, 1500);
    };
    client.onerror = () => {
      if (current()) callbacks.onReady(false);
    };
  };

  // StrictMode's initial cleanup cancels this task before it opens an unnecessary socket.
  timer = setTimeout(connect, 0);
  return {
    send,
    dispose: (): void => {
      stopped = true;
      clearTimeout(timer);
      // close() during CONNECTING aborts the HTTP upgrade and can produce Vite EPIPE.
      // A pending handshake instead finishes in onopen, which immediately closes it cleanly.
      if (socket?.readyState === WebSocket.OPEN) socket.close(1000, 'Session disposed');
      socket = null;
    },
  };
}
