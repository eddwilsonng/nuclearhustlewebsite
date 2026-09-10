"use client";

import { useState } from "react";

export function FeaturedSuccessBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="status"
      className="mb-6 flex items-start justify-between gap-3 border border-success bg-success-surface px-4 py-3"
    >
      <p className="font-sans text-sm text-success">
        This job is now featured. It stays at the top of the board for 30 days.
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
