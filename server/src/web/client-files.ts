import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';

// Resolve relative to this module, not process.cwd(): npm workspaces change the cwd.
export const clientDirectory = fileURLToPath(new URL('../../../client/dist/', import.meta.url));
export const clientEntry = join(clientDirectory, 'index.html');

export function serveClientFiles(app: NestExpressApplication, production: boolean): void {
  if (production && !existsSync(clientEntry)) {
    throw new Error('Client build is missing. Run npm run build before npm start.');
  }
  app.disable('x-powered-by');
  app.useStaticAssets(clientDirectory, {
    index: false,
    redirect: false,
    setHeaders(response, filePath) {
      const hashedAsset = filePath.includes('/assets/');
      response.setHeader(
        'Cache-Control',
        hashedAsset ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
      );
      response.setHeader('X-Content-Type-Options', 'nosniff');
    },
  });
}
