import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { readEnvironment } from './config/environment.js';
import { SecureWsAdapter } from './transport/secure-ws.adapter.js';
import { serveClientFiles } from './web/client-files.js';

async function bootstrap(): Promise<void> {
  const config = readEnvironment();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  serveClientFiles(app, config.production);
  app.enableCors({ origin: config.origins.length ? config.origins : !config.production });
  app.useWebSocketAdapter(new SecureWsAdapter(app, config.origins));
  app.enableShutdownHooks();
  await app.listen(config.port, config.host);
  console.log(`Chess Arena started on port ${config.port}`);
}

void bootstrap();
