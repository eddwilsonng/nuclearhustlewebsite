"use client";

import { setAnalyticsChoice, useAnalyticsChoice } from "@/components/analyticsConsent";

export function AnalyticsPreference() {
  const choice = useAnalyticsChoice();

  const label =
    choice === "granted"
      ? "Analytics are on for this browser."
      : choice === "denied"
        ? "Analytics are off for this browser."
        : "You have not chosen yet. The banner is still showing.";

  return (
    <div className="border border-rule p-4">
      <p className="text-sm text-ink">{label}</p>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={() => setAnalyticsChoice("denied")}
          className="inline-flex min-h-11 items-center border border-ink bg-raised px-4 font-sans text-sm font-semibold text-ink hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Reject analytics
        </button>
        <button
          type="button"
          onClick={() => setAnalyticsChoice("granted")}
          className="inline-flex min-h-11 items-center border border-ink bg-ink px-4 font-sans text-sm font-semibold text-canvas hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Allow analytics
        </button>
      </div>
    </div>
  );
}
