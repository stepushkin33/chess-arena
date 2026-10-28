import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createDevLogger } from './dev/logger';

const chessServerPort = process.env.CHESS_SERVER_PORT ?? process.env.PORT ?? '3000';

export default defineConfig({
  customLogger: createDevLogger(),
  plugins: [react()],
  build: { rollupOptions: { output: { manualChunks: { pixi: ['pixi.js'] } } } },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/ws': {
        target: `ws://127.0.0.1:${chessServerPort}`,
        ws: true,
        changeOrigin: true,
      },
      '/health': { target: `http://127.0.0.1:${chessServerPort}` },
    },
  },
});
