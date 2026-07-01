/**
 * IndexNow: pushes new/updated/deleted URLs to Bing, Yandex, and other
 * participating search engines so they crawl on our schedule instead of
 * waiting for a periodic sweep. Google does not participate in IndexNow —
 * GSC submission (mcp__gsc__submit_url) is separate and still needed for it.
 *
 * Key file lives at /public/<key>.txt so it's served at the site root, which
 * is what proves domain ownership to the API.
 */

const INDEXNOW_KEY = 'ff501f90bf1276adca12d1a966444d6f';
const BASE_URL = 'https://www.nuclearhustle.com';
const HOST = 'www.nuclearhustle.com';

export function jobUrl(slug: string): string {
  return `${BASE_URL}/job/${slug}`;
}

/** Fire-and-forget notify; never throws so a failed ping can't break a publish/scrape run. */
export async function submitToIndexNow(urls: string[]): Promise<void> {
  if (urls.length === 0) return;

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });
    if (!res.ok) {
      console.error(`[indexnow] submit failed: ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error('[indexnow] submit error:', err);
  }
}
