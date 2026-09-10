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
  workspaceName?: string;
  isAdmin?: boolean;
  viewRole?: AdminViewRole;
}

type NavLink = { href: string; label: string; exact?: boolean };

function isActivePath(pathname: string, path: string, exact?: boolean) {
  return exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
}

const navItemClass = (active: boolean) =>
  cn(
    "flex min-h-9 items-center px-2 font-sans text-sm transition-colors duration-150",
    active
      ? "bg-canvas font-medium text-ink"
      : "text-secondary hover:bg-canvas/70 hover:text-ink",
  );

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
            className={navItemClass(active)}
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
  workspaceName,
  isAdmin,
  viewRole,
  pathname,
  onNavigate,
}: DashboardSidebarProps & { pathname: string; onNavigate?: () => void }) {
  const jobSeekerLinks: NavLink[] = [
    { href: "/dashboard", label: "Overview", exact: true },
    { href: "/dashboard/profile", label: "Profile" },
    { href: "/dashboard/saved", label: "Saved" },
  ];

  const employerLinks: NavLink[] = [
    { href: "/dashboard", label: "Overview", exact: true },
    { href: "/dashboard/profile", label: "Company" },
    { href: "/dashboard/jobs", label: "Jobs" },
    { href: "/dashboard/jobs/new", label: "New job" },
  ];

  const adminLinks: NavLink[] = [
    { href: "/dashboard/admin", label: "Operations", exact: true },
    { href: "/dashboard/admin/review", label: "Review" },
    { href: "/dashboard/admin/scrape", label: "Scraper" },
    { href: "/dashboard/admin/jobs", label: "All jobs" },
    { href: "/dashboard/admin/email", label: "Email" },
    { href: "/dashboard/admin/linkedin", label: "Weekly picks" },
  ];

  const effectiveRole = isAdmin ? (viewRole ?? profile.role) : profile.role;
  const links = effectiveRole === "employer" ? employerLinks : jobSeekerLinks;
  const workspace =
    workspaceName ||
    (effectiveRole === "employer" ? "Employer" : profile.full_name.split(" ")[0]);

  return (
    <div className="flex h-full w-full flex-col px-3 py-4">
      <Link
        href="/"
        onClick={onNavigate}
        className="px-2 font-sans text-sm font-semibold tracking-tight text-ink"
      >
        Nuclear Hustle
      </Link>
      <p className="mt-0.5 truncate px-2 font-sans text-sm text-secondary">{workspace}</p>

      {isAdmin && (
        <div className="mt-4 flex border border-rule">
          <button
            type="button"
            onClick={() => setAdminViewRole("employer", pathname)}
            className={cn(
              "min-h-9 flex-1 font-sans text-sm",
              effectiveRole === "employer"
                ? "bg-canvas font-medium text-ink"
                : "text-secondary hover:text-ink",
            )}
          >
            Employer
          </button>
          <button
            type="button"
            onClick={() => setAdminViewRole("job_seeker", pathname)}
            className={cn(
              "min-h-9 flex-1 font-sans text-sm",
              effectiveRole === "job_seeker"
                ? "bg-canvas font-medium text-ink"
                : "text-secondary hover:text-ink",
            )}
          >
            Seeker
          </button>
        </div>
      )}

      <nav className="mt-5 flex flex-col gap-0.5" aria-label="Account">
        <NavLinks links={links} pathname={pathname} onNavigate={onNavigate} />
      </nav>

      {isAdmin && (
        <>
          <div className="my-4 border-t border-rule" />
          <p className="mb-1 px-2 font-mono text-xs uppercase tracking-widest text-secondary">
            Ops
          </p>
          <nav className="flex flex-col gap-0.5" aria-label="Operations">
            <NavLinks links={adminLinks} pathname={pathname} onNavigate={onNavigate} />
          </nav>
        </>
      )}

      <div className="mt-auto flex flex-col gap-0.5 border-t border-rule pt-3">
        <Link href="/jobs" onClick={onNavigate} className={navItemClass(false)}>
          Browse board
        </Link>
        <form action={signOut}>
          <button type="submit" className={cn(navItemClass(false), "w-full text-left")}>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export function DashboardSidebar({
  profile,
  workspaceName,
  isAdmin,
  viewRole,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-rule bg-surface px-4 md:hidden">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-sans text-sm font-semibold tracking-tight text-ink"
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
            <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,100%)] flex-col border-r border-rule bg-surface text-ink outline-none transition-[transform] duration-180 data-ending-style:-translate-x-4 data-ending-style:opacity-0 data-starting-style:-translate-x-4 data-starting-style:opacity-0 md:hidden">
              <div className="flex items-center justify-between border-b border-rule px-3 py-2">
                <Dialog.Title className="font-sans text-sm font-semibold">Menu</Dialog.Title>
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
                  workspaceName={workspaceName}
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

      <aside className="hidden w-52 shrink-0 border-r border-rule bg-surface md:flex md:h-dvh md:flex-col">
        <SidebarBody
          profile={profile}
          workspaceName={workspaceName}
          isAdmin={isAdmin}
          viewRole={viewRole}
          pathname={pathname}
        />
      </aside>
    </>
  );
}
