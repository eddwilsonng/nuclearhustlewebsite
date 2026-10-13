"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { LinkButton } from "@/components/ui/LinkButton";
import { isNavActive, PRIMARY_NAV, RESOURCE_NAV } from "@/components/site-nav";

function ResourcesMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const active = RESOURCE_NAV.some(({ href }) => isNavActive(pathname, href));

  return (
    <Menu.Root onOpenChange={setOpen}>
      <Menu.Trigger
        className={`relative inline-flex h-16 items-center gap-1.5 px-3 font-sans text-sm font-medium transition-colors duration-150 data-popup-open:text-ink ${
          active ? "text-ink" : "text-secondary hover:text-ink"
        }`}
      >
        Resources
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden="true"
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
          />
        </svg>
        {active ? (
          <span
            aria-hidden="true"
            className="absolute inset-x-3 bottom-0 h-0.5 bg-ink"
          />
        ) : null}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="start" className="z-50">
          <Menu.Popup className="card-raised min-w-44 border border-control bg-raised py-1 outline-none">
            {RESOURCE_NAV.map(({ href, label }) => {
              const itemActive = isNavActive(pathname, href);
              return (
                <Menu.Item
                  key={href}
                  render={
                    <Link
                      href={href}
                      aria-current={itemActive ? "page" : undefined}
                      className={`block px-4 py-3 font-sans text-sm no-underline outline-none data-highlighted:bg-surface ${
                        itemActive
                          ? "font-medium text-ink"
                          : "text-secondary data-highlighted:text-ink"
                      }`}
                    />
                  }
                >
                  {label}
                </Menu.Item>
              );
            })}
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
        {PRIMARY_NAV.map(({ href, label }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            active={isNavActive(pathname, href)}
          />
        ))}
        <ResourcesMenu pathname={pathname} />
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
