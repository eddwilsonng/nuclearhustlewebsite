"use client";

import { useState } from "react";
import { FEATURED_DURATION_DAYS } from "@/lib/jobs/featuredOffer";

export function FeaturedSuccessBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="status"
      className="mb-6 flex items-start justify-between gap-3 border border-success bg-success-surface px-4 py-3"
    >
      <p className="font-sans text-sm text-success">
        This job is now featured. For {FEATURED_DURATION_DAYS} days it stays at the top of the jobs board and on the homepage, and in every Monday digest sent during that time.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="inline-flex size-11 shrink-0 items-center justify-center text-success hover:text-ink"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
