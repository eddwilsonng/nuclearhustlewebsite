import type { EmployerJob } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;
export const EXPIRY_SOON_DAYS = 7;

export type ListingStatus = {
  key: "live" | "paused" | "expired";
  label: string;
  /** Whole days until expiry; negative once expired, null with no expiry. */
  daysLeft: number | null;
  expiringSoon: boolean;
  featuredUntil: Date | null;
};

/**
 * What an employer's listing is doing right now. An expired listing reads as
 * Expired even if `is_active` is still true: it no longer takes applications.
 */
export function getListingStatus(job: EmployerJob, now = new Date()): ListingStatus {
  const daysLeft = job.expires_at ? Math.ceil((new Date(job.expires_at).getTime() - now.getTime()) / DAY_MS) : null;
  const expired = daysLeft !== null && daysLeft <= 0;
  const featuredUntil =
    job.is_featured && job.featured_until && new Date(job.featured_until) > now ? new Date(job.featured_until) : null;

  if (expired) return { key: "expired", label: "Expired", daysLeft, expiringSoon: false, featuredUntil };
  if (!job.is_active) return { key: "paused", label: "Paused", daysLeft, expiringSoon: false, featuredUntil };
  return {
    key: "live",
    label: "Live",
    daysLeft,
    expiringSoon: daysLeft !== null && daysLeft <= EXPIRY_SOON_DAYS,
    featuredUntil,
  };
}

export function formatShortDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
