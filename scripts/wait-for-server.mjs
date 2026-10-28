/* global AbortSignal, console, fetch, process, setTimeout */

const url = process.env.CHESS_SERVER_URL ?? `http://127.0.0.1:${process.env.PORT ?? 3000}/health`;
const attempts = 60;

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(500) });
    if (response.ok && (await response.json()).status === 'ok') process.exit(0);
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

console.error(`Chess Arena server did not become ready at ${url}`);
process.exit(1);
