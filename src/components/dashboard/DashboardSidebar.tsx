"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { signOut, setAdminViewRole } from "@/lib/auth/actions";
import { cn } from "@/lib/cn";
import type { Profile } from "@/lib/types";
import type { AdminViewRole } from "@/lib/admin";

interface DashboardSidebarProps {
  profile: Profile;
  isAdmin?: boolean;
  viewRole?: AdminViewRole;
}

type NavLink = { href: string; label: string; exact?: boolean };

function isActivePath(pathname: string, path: string, exact?: boolean) {
  return exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
}

function NavLinks({
  links,
  pathname,
  onNavigate,
}: {
  links: NavLink[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {links.map((link) => {
        const active = isActivePath(pathname, link.href, link.exact);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center border-l-2 pl-3 font-sans text-sm transition-colors duration-150",
              active
                ? "border-signal bg-surface font-semibold text-ink"
                : "border-transparent text-secondary hover:bg-surface hover:text-ink",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

function SidebarBody({
  profile,
  isAdmin,
  viewRole,
  pathname,
  onNavigate,
}: DashboardSidebarProps & { pathname: string; onNavigate?: () => void }) {
  const jobSeekerLinks: NavLink[] = [
    { href: "/dashboard", label: "Overview", exact: true },
    { href: "/dashboard/profile", label: "My Profile" },
    { href: "/dashboard/saved", label: "Saved Jobs" },
  ];

  const employerLinks: NavLink[] = [
    { href: "/dashboard", label: "Overview", exact: true },
    { href: "/dashboard/profile", label: "Company Profile" },
    { href: "/dashboard/jobs", label: "Job Postings" },
    { href: "/dashboard/jobs/new", label: "Post a Job" },
  ];

  const adminLinks: NavLink[] = [
    { href: "/dashboard/admin", label: "Operations", exact: true },
    { href: "/dashboard/admin/review", label: "Content Review" },
    { href: "/dashboard/admin/scrape", label: "Scraper" },
    { href: "/dashboard/admin/jobs", label: "Manage Jobs" },
    { href: "/dashboard/admin/email", label: "Email Health" },
    { href: "/dashboard/admin/linkedin", label: "Weekly Picks" },
  ];

  const effectiveRole = isAdmin ? (viewRole ?? profile.role) : profile.role;
  const links = effectiveRole === "employer" ? employerLinks : jobSeekerLinks;

  return (
    <div className="flex h-full w-full flex-col p-6">
      <Link
        href="/"
        onClick={onNavigate}
        className="inline-flex min-h-11 items-center font-sans text-base font-bold tracking-tight text-ink"
      >
        Nuclear Hustle
      </Link>
      <p className="mt-1 font-mono text-xs uppercase tracking-widest text-secondary">
        {effectiveRole === "employer" ? "Employer" : "Job seeker"}
      </p>

      {isAdmin && (
        <div className="mt-6 flex gap-1 border border-control p-1">
          <button
            type="button"
            onClick={() => setAdminViewRole("employer", pathname)}
            className={cn(
              "min-h-11 flex-1 font-sans text-sm transition-colors duration-150",
              effectiveRole === "employer"
                ? "bg-signal font-semibold text-ink"
                : "text-secondary hover:text-ink",
            )}
          >
            Employer
          </button>
          <button
            type="button"
            onClick={() => setAdminViewRole("job_seeker", pathname)}
            className={cn(
              "min-h-11 flex-1 font-sans text-sm transition-colors duration-150",
              effectiveRole === "job_seeker"
                ? "bg-signal font-semibold text-ink"
                : "text-secondary hover:text-ink",
            )}
          >
            Job seeker
          </button>
        </div>
      )}

      <nav className="mt-6 space-y-1" aria-label="Account">
        <NavLinks links={links} pathname={pathname} onNavigate={onNavigate} />
      </nav>

      {isAdmin && (
        <>
          <div className="my-6 border-t border-rule" />
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-secondary">
            Operations
          </p>
          <nav className="space-y-1" aria-label="Operations">
            <NavLinks links={adminLinks} pathname={pathname} onNavigate={onNavigate} />
          </nav>
        </>
      )}

      <div className="mt-auto space-y-1 border-t border-rule pt-6">
        <Link
          href="/jobs"
          onClick={onNavigate}
          className="flex min-h-11 items-center border-l-2 border-transparent pl-3 font-sans text-sm text-secondary hover:bg-surface hover:text-ink"
        >
          Browse jobs
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="flex min-h-11 w-full items-center border-l-2 border-transparent pl-3 text-left font-sans text-sm text-danger hover:bg-surface"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export function DashboardSidebar({ profile, isAdmin, viewRole }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-rule bg-raised px-4 py-3 md:hidden">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-sans text-sm font-bold tracking-tight text-ink"
        >
          Nuclear Hustle
        </Link>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger
            aria-label="Open account menu"
            className="inline-flex min-h-11 items-center px-2 font-sans text-sm text-secondary hover:text-ink"
          >
            Menu
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/45 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 md:hidden" />
            <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,100%)] flex-col border-r border-rule bg-raised text-ink outline-none transition-[transform] duration-180 data-ending-style:-translate-x-4 data-ending-style:opacity-0 data-starting-style:-translate-x-4 data-starting-style:opacity-0 md:hidden">
              <div className="flex items-center justify-between border-b border-rule px-6 py-3">
                <Dialog.Title className="font-sans text-sm font-semibold">
                  Account
                </Dialog.Title>
                <Dialog.Close
                  aria-label="Close account menu"
                  className="inline-flex min-h-11 items-center px-2 font-sans text-sm text-secondary hover:text-ink"
                >
                  Close
                </Dialog.Close>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarBody
                  profile={profile}
                  isAdmin={isAdmin}
                  viewRole={viewRole}
                  pathname={pathname}
                  onNavigate={close}
                />
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <aside className="hidden w-60 shrink-0 border-r border-rule bg-raised md:flex md:min-h-screen md:flex-col">
        <SidebarBody
          profile={profile}
          isAdmin={isAdmin}
          viewRole={viewRole}
          pathname={pathname}
        />
      </aside>
    </>
  );
}
