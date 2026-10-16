"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  COMPANIES_NAV,
  EMPLOYER_NAV,
  FIND_WORK_NAV,
  JOBS_NAV_GROUPS,
  isNavItemActive,
  type NavItem,
} from "@/components/site-nav";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={`transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}

function NavMenu({
  label,
  pathname,
  groups,
}: {
  label: string;
  pathname: string;
  groups: readonly (readonly NavItem[])[];
}) {
  const [open, setOpen] = useState(false);
  const active = groups.some((group) =>
    group.some((item) => isNavItemActive(pathname, item)),
  );

  return (
    <Menu.Root onOpenChange={setOpen}>
      <Menu.Trigger
        className={`relative inline-flex h-16 items-center gap-1.5 px-3 font-sans text-sm font-medium transition-colors duration-150 data-popup-open:text-ink ${
          active ? "text-ink" : "text-secondary hover:text-ink"
        }`}
      >
        {label}
        <Chevron open={open} />
        {active ? (
          <span
            aria-hidden="true"
            className="absolute inset-x-3 bottom-0 h-0.5 bg-ink"
          />
        ) : null}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="start" className="z-50">
          <Menu.Popup className="card-raised max-h-[min(32rem,70vh)] min-w-56 overflow-y-auto border border-control bg-raised py-1 outline-none">
            {groups.map((group, index) => (
              <Menu.Group key={group[0]?.href ?? index}>
                {index > 0 ? (
                  <div
                    role="separator"
                    className="mx-3 my-1 border-t border-rule"
                  />
                ) : null}
                {group.map((item) => {
                  const itemActive = isNavItemActive(pathname, item);
                  return (
                    <Menu.Item
                      key={item.href}
                      render={
                        <Link
                          href={item.href}
                          aria-current={itemActive ? "page" : undefined}
                          className={`block px-4 py-3 font-sans text-sm no-underline outline-none data-highlighted:bg-surface ${
                            itemActive
                              ? "font-medium text-ink"
                              : "text-secondary data-highlighted:text-ink"
                          }`}
                        />
                      }
                    >
                      {item.label}
                    </Menu.Item>
                  );
                })}
              </Menu.Group>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative inline-flex h-16 items-center px-3 font-sans text-sm font-medium transition-colors duration-150 ${
        active ? "text-ink" : "text-secondary hover:text-ink"
      }`}
    >
      {label}
      {active ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-3 bottom-0 h-0.5 bg-ink"
        />
      ) : null}
    </Link>
  );
}

export function DesktopNav({
  isAuthed,
  children,
}: {
  isAuthed: boolean;
  children?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="hidden h-16 min-w-0 flex-1 items-center lg:flex"
    >
      <div className="flex h-full items-center">
        <NavMenu label="Find work" pathname={pathname} groups={[FIND_WORK_NAV]} />
        <NavMenu label="Employers" pathname={pathname} groups={[EMPLOYER_NAV]} />
        <NavLink
          href={COMPANIES_NAV.href}
          label={COMPANIES_NAV.label}
          active={isNavItemActive(pathname, COMPANIES_NAV)}
        />
        <NavMenu label="Jobs" pathname={pathname} groups={JOBS_NAV_GROUPS} />
      </div>

      <div className="ml-auto flex items-center gap-2 pl-6">
        {isAuthed ? (
          children
        ) : (
          <>
            {pathname !== "/login" && (
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center px-3 font-sans text-sm font-medium text-ink"
              >
                Log in
              </Link>
            )}
            <LinkButton href="/signup/employer" variant="secondary">
              Post a job
            </LinkButton>
          </>
        )}
      </div>
    </nav>
  );
}
