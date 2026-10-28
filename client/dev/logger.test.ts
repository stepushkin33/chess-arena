import { describe, expect, it, vi } from 'vitest';
import { createLogger } from 'vite';
import { createDevLogger } from './logger';

function setup() {
  const base = createLogger();
  const info = vi.spyOn(base, 'info').mockImplementation(() => {});
  const error = vi.spyOn(base, 'error').mockImplementation(() => {});
  return { logger: createDevLogger(base), info, error };
}
describe('Vite WebSocket diagnostics', () => {
  it.each(['EPIPE', 'ECONNRESET'])(
    'reports a disconnected browser (%s) without an error stack',
    (code) => {
      const { logger, info, error } = setup();
      logger.error('ws proxy socket error:', {
        error: Object.assign(new Error('closed'), { code }),
      });
      expect(info).toHaveBeenCalledOnce();
      expect(error).not.toHaveBeenCalled();
    },
  );
  it.each(['ECONNREFUSED', 'EPIPE', 'ECONNRESET'])(
    'preserves upstream server errors (%s)',
    (code) => {
      const { logger, error } = setup();
      const options = { error: Object.assign(new Error('upstream failed'), { code }) };
      logger.error('ws proxy error:', options);
      expect(error).toHaveBeenCalledWith('ws proxy error:', options);
    },
  );
  it('preserves unrelated browser socket errors', () => {
    const { logger, error } = setup();
    logger.error('ws proxy socket error:', { error: new Error('unexpected') });
    expect(error).toHaveBeenCalledOnce();
  });
});
