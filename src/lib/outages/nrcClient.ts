import { NRC_MIN_INTERVAL_MS, NRC_USER_AGENT } from './config';

const MAX_ATTEMPTS = 5;

let queue: Promise<unknown> = Promise.resolve();
let lastStart = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAccessDenied(text: string): boolean {
  return /<html/i.test(text.slice(0, 300)) && /access denied/i.test(text.slice(0, 500));
}

/**
 * One NRC request at a time, at least 2 seconds apart, with backoff on blocks.
 * A 404 is returned to the caller. Access-denied HTML is retried.
 */
export function fetchNrc(url: string): Promise<{ status: number; text: string }> {
  const run = queue.then(() => fetchOnce(url));
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function fetchOnce(url: string): Promise<{ status: number; text: string }> {
  let lastStatus = 0;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const wait = NRC_MIN_INTERVAL_MS - (Date.now() - lastStart);
    if (wait > 0) await sleep(wait);
    lastStart = Date.now();

    const backoff = 4000 * 2 ** (attempt - 1);
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'text/plain,text/html;q=0.9',
          'User-Agent': NRC_USER_AGENT,
        },
        signal: AbortSignal.timeout(30_000),
      });
      const text = await response.text();
      lastStatus = response.status;

      if (response.status === 404) return { status: 404, text };
      if (response.ok && !isAccessDenied(text)) return { status: response.status, text };

      console.warn(`NRC ${response.status} for ${url}, retry in ${backoff}ms`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`NRC fetch failed for ${url} (${message}), retry in ${backoff}ms`);
    }
    await sleep(backoff);
    lastStart = Date.now();
  }

  throw new Error(`NRC request failed (${lastStatus}) for ${url}`);
}
