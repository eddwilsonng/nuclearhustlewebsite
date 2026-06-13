'use client';

import { useState } from 'react';

export function FeaturedSuccessBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mb-6 flex items-center justify-between gap-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-md">
      <p className="text-sm text-yellow-800 font-medium">
        ★ Your job is now featured! It will appear at the top of the board for 30 days.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-yellow-600 hover:text-yellow-800 text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
