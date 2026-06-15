import Script from 'next/script';

// Clicky analytics via the anti-adblock reverse proxy. The `src` points at the
// same-origin proxied path (see `rewrites` in next.config.ts), which forwards
// to static.getclicky.com with `?in=` set to our beacon path — so the tracker
// and all beacons stay on our domain and survive ad-blockers + the strict CSP.
export function Clicky() {
  return (
    <Script
      id="clicky-analytics"
      src="/cf37ad9ead3cac1.js"
      data-id="101507375"
      strategy="afterInteractive"
    />
  );
}
