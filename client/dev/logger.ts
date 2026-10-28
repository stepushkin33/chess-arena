import { createLogger, type Logger } from 'vite';

/** A browser closing its TCP socket is expected; upstream/server failures remain errors. */
export function createDevLogger(logger: Logger = createLogger()): Logger {
  return {
    ...logger,
    error(message, options) {
      const code = (options?.error as NodeJS.ErrnoException | undefined)?.code;
      const closedClient =
        message.includes('ws proxy socket error:') && (code === 'EPIPE' || code === 'ECONNRESET');
      if (closedClient) {
        logger.info('[ws] Клиент закрыл соединение.', { timestamp: true });
        return;
      }
      logger.error(message, options);
    },
  };
}
