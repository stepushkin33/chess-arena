import { WsAdapter } from '@nestjs/platform-ws';
import type { INestApplication } from '@nestjs/common';
import type { ServerOptions } from 'ws';

/** Browser WebSockets do not enforce CORS; validate Origin at the upgrade handshake. */
export class SecureWsAdapter extends WsAdapter {
  constructor(
    app: INestApplication,
    private readonly allowedOrigins: string[],
  ) {
    super(app);
  }
  create(port: number, options?: ServerOptions) {
    return super.create(port, {
      ...options,
      verifyClient: (info: { origin: string }) =>
        this.allowedOrigins.length === 0 || this.allowedOrigins.includes(info.origin),
    });
  }
}
