'use client';

import { useEffect, useRef } from 'react';

/**
 * Fires a single best-effort view increment for an employer job. Runs on mount
 * (not during prefetch/SSR) so bot prefetches and RSC payloads don't inflate
 * the count. `jobId` is the raw employer_jobs UUID.
 */
export function ViewTracker({ jobId }: { jobId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    fetch(`/api/jobs/${jobId}/view`, {
      method: 'POST',
      keepalive: true,
    }).catch(() => {});
  }, [jobId]);

  return null;
}
