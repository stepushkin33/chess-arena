import { describe, expect, it } from 'vitest';
import { readEnvironment } from './environment.js';

describe('production environment', () => {
  it('uses the public address supplied by Render without manual domain configuration', () => {
    const config = readEnvironment({
      NODE_ENV: 'production',
      RENDER_EXTERNAL_URL: 'https://chess-arena.onrender.com',
      PORT: '10000',
    });
    expect(config).toMatchObject({
      production: true,
      port: 10000,
      host: '0.0.0.0',
      origins: ['https://chess-arena.onrender.com'],
    });
  });
  it('lets a custom domain override the Render address and supports explicitly listed origins', () => {
    const config = readEnvironment({
      NODE_ENV: 'production',
      RENDER_EXTERNAL_URL: 'https://chess-arena.onrender.com',
      PUBLIC_URL: 'https://chess.example',
    });
    expect(config.origins).toEqual(['https://chess.example']);
    expect(
      readEnvironment({
        NODE_ENV: 'production',
        PUBLIC_URL: 'https://chess.example',
        ALLOWED_ORIGINS: 'https://chess.example,https://chess-arena.onrender.com',
      }).origins,
    ).toHaveLength(2);
  });
  it('requires a public URL and non-empty exact origins', () => {
    expect(() => readEnvironment({ NODE_ENV: 'production' })).toThrow('PUBLIC_URL');
    expect(() =>
      readEnvironment({
        NODE_ENV: 'production',
        PUBLIC_URL: 'https://chess.example',
        ALLOWED_ORIGINS: '',
      }),
    ).toThrow('origin');
    expect(() =>
      readEnvironment({
        NODE_ENV: 'production',
        PUBLIC_URL: 'https://chess.example',
        ALLOWED_ORIGINS: 'https://chess.example/path',
      }),
    ).toThrow('origins');
    expect(
      readEnvironment({ NODE_ENV: 'production', PUBLIC_URL: 'https://chess.example' }).origins,
    ).toEqual(['https://chess.example']);
  });
  it('validates port values and allows local development without a configured domain', () => {
    expect(() => readEnvironment({ PORT: 'not-a-number' })).toThrow('PORT');
    expect(() => readEnvironment({ PORT: '70000' })).toThrow('PORT');
    expect(readEnvironment({}).port).toBe(3000);
  });
});
