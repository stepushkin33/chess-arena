import { useCallback, useEffect, useRef, useState } from 'react';
import type { ServerMessage } from '@chess/shared';
import { createGameConnection, type SendCommand } from './game-connection';

export type { SendCommand } from './game-connection';

/** React adapter only; the transport owns socket lifecycle and reconnect timers. */
export function useGameSocket(
  onMessage: (message: ServerMessage) => void,
  onReconnect: (send: SendCommand) => void,
) {
  const connection = useRef<ReturnType<typeof createGameConnection>>();
  const callbacks = useRef({ onMessage, onReconnect });
  callbacks.current = { onMessage, onReconnect };
  const [ready, setReady] = useState(false);
  const send: SendCommand = useCallback(
    (command) => connection.current?.send(command) ?? false,
    [],
  );

  useEffect(() => {
    setReady(false);
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const transport = createGameConnection(`${protocol}//${location.host}/ws`, {
      onMessage: (message) => callbacks.current.onMessage(message),
      onReady: setReady,
      onReconnect: (reconnectSend) => callbacks.current.onReconnect(reconnectSend),
    });
    connection.current = transport;
    return () => {
      connection.current = undefined;
      transport.dispose();
    };
  }, []);
  return { ready, send };
}
