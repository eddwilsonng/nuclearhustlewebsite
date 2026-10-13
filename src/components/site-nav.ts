export const PRIMARY_NAV = [
  { href: "/jobs", label: "Jobs" },
  { href: "/companies", label: "Companies" },
  { href: "/status", label: "Fleet status" },
] as const;

export const RESOURCE_NAV = [
  { href: "/nuclear-salary", label: "Salary guide" },
  { href: "/nuclear-skills", label: "Skills" },
] as const;

export function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
