export type NavMatch = "exact" | "prefix";

/**
 * "Post a job" everywhere. Signed out, it starts employer signup and lands on
 * the job form afterwards; signed in, middleware forwards straight to the form.
 */
export const POST_JOB_HREF = "/signup/employer?redirect=%2Fdashboard%2Fjobs%2Fnew";

/** Email-only Monday digest signup. No account needed. */
export const JOB_ALERTS_HREF = "/alerts";

export type NavItem = {
  href: string;
  label: string;
  match: NavMatch;
  /** Action links that also appear elsewhere. Visiting them does not mark this item current. */
  current?: boolean;
};

export const FIND_WORK_NAV = [
  { href: "/jobs", label: "Search nuclear jobs", match: "exact", current: false },
  { href: "/signup/job-seeker", label: "Build a profile", match: "exact" },
  { href: "/plants", label: "Browse plants", match: "prefix" },
  { href: "/outages", label: "Outage schedule", match: "prefix" },
] as const satisfies readonly NavItem[];

export const EMPLOYER_NAV = [
  { href: POST_JOB_HREF, label: "Post a job", match: "exact" },
  { href: "/pricing", label: "Pricing", match: "exact" },
  { href: "/contact", label: "Contact", match: "prefix" },
] as const satisfies readonly NavItem[];

export const COMPANIES_NAV = {
  href: "/companies",
  label: "Companies",
  match: "prefix",
} as const satisfies NavItem;

export const JOBS_NAV_GROUPS = [
  [
    { href: "/jobs", label: "All nuclear jobs", match: "exact" },
    { href: "/jobs/role/operations", label: "Operations", match: "prefix" },
    { href: "/jobs/role/engineering", label: "Engineering", match: "prefix" },
    { href: "/jobs/role/maintenance", label: "Maintenance", match: "prefix" },
    { href: "/jobs/role/health-physics", label: "Health physics", match: "prefix" },
    { href: "/jobs/role/training", label: "Training & licensing", match: "prefix" },
  ],
  [
    { href: "/jobs/illinois", label: "Illinois", match: "prefix" },
    { href: "/jobs/pennsylvania", label: "Pennsylvania", match: "prefix" },
    { href: "/jobs/south-carolina", label: "South Carolina", match: "prefix" },
    { href: "/jobs/arizona", label: "Arizona", match: "prefix" },
  ],
] as const satisfies readonly (readonly NavItem[])[];

export function isNavItemActive(pathname: string, item: NavItem) {
  if (item.current === false) return false;
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
