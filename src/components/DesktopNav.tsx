"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "@base-ui/react/menu";

const BROWSE_LINKS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/companies", label: "Companies" },
  { href: "/status", label: "Fleet Status" },
  { href: "/about", label: "About" },
];

const RESOURCES_LINKS = [
  {
    href: "/nuclear-salary",
    label: "Nuclear Salary Guide",
    desc: "Pay ranges by role and state",
  },
  {
    href: "/nuclear-skills",
    label: "Nuclear Skills Report",
    desc: "In-demand skills and credentials",
  },
];

function navLinkClass(active: boolean) {
  return `relative font-sans text-sm transition-colors duration-150 ${
    active ? "font-semibold text-ink" : "text-secondary hover:text-ink"
  }`;
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
      className={`inline-flex min-h-11 items-center ${navLinkClass(active)}`}
    >
      {label}
    </Link>
  );
}

function ResourcesMenu({ active }: { active: boolean }) {
  return (
    <Menu.Root>
      <Menu.Trigger
        className={`${navLinkClass(active)} inline-flex min-h-11 items-center gap-1`}
      >
        Resources
        <span aria-hidden="true" className="text-xs">
          ▾
        </span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} className="z-50">
          <Menu.Popup className="card-raised min-w-64 border border-control bg-raised py-1 outline-none">
            {RESOURCES_LINKS.map(({ href, label, desc }) => (
              <Menu.Item
                key={href}
                render={
                  <Link
                    href={href}
                    className="block px-4 py-3 no-underline outline-none data-highlighted:bg-surface"
                  />
                }
              >
                <span className="block font-sans text-sm font-semibold text-ink">
                  {label}
                </span>
                <span className="mt-0.5 block font-sans text-sm text-secondary">
                  {desc}
                </span>
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
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
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const resourcesActive = RESOURCES_LINKS.some(({ href }) => isActive(href));

  return (
    <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
      {BROWSE_LINKS.map(({ href, label }) => (
        <NavLink
          key={href}
          href={href}
          label={label}
          active={isActive(href)}
        />
      ))}
      <ResourcesMenu active={resourcesActive} />

      {isAuthed ? (
        children
      ) : (
        <>
          <NavLink
            href="/signup/employer"
            label="Post a job"
            active={isActive("/signup/employer")}
          />
          {pathname !== "/login" && (
            <NavLink href="/login" label="Log in" active={isActive("/login")} />
          )}
        </>
      )}
    </nav>
  );
}
