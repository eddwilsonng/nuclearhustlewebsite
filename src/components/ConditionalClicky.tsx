"use client";

import { usePathname } from "next/navigation";
import { Clicky } from "@/components/Clicky";
import { setAnalyticsChoice, useAnalyticsChoice } from "@/components/analyticsConsent";

const EXCLUDE_PREFIXES = ["/dashboard", "/onboarding"];

export function ConditionalClicky() {
  const pathname = usePathname();
  const choice = useAnalyticsChoice();
  const excluded = EXCLUDE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (excluded) return null;

  const onJob = pathname.startsWith("/job/");

  return (
    <>
      {choice === "granted" ? <Clicky /> : null}
      {choice === null ? (
        <div
          role="dialog"
          aria-labelledby="analytics-title"
          className={`fixed inset-x-0 z-50 border-t border-rule bg-canvas px-6 py-4 ${onJob ? "bottom-20 md:bottom-0" : "bottom-0"}`}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p id="analytics-title" className="font-sans text-sm font-semibold text-ink">
                Analytics
              </p>
              <p className="mt-1 font-sans text-sm leading-relaxed text-secondary">
                We count visits with Clicky after you allow it. Sign-in cookies
                are set either way. You can change this on the privacy policy.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => setAnalyticsChoice("denied")}
                className="inline-flex min-h-11 items-center border border-ink bg-raised px-4 font-sans text-sm font-semibold text-ink hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Reject
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
        </div>
      ) : null}
    </>
  );
}
