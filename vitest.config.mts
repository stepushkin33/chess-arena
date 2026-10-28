import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@chess/shared': fileURLToPath(new URL('./shared/src/index.ts', import.meta.url)) },
  },
  test: {
    include: ['shared/src/**/*.test.ts', 'server/src/**/*.test.ts', 'client/**/*.test.ts'],
    passWithNoTests: false,
  },
});
