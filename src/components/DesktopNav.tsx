"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import { LinkButton } from "@/components/ui/LinkButton";

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
      {BROWSE_LINKS.map(({ href, label }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 items-center ${navLinkClass(active)}`}
          >
            {label}
          </Link>
        );
      })}
      <ResourcesMenu active={resourcesActive} />

      <span className="h-4 w-px bg-rule" aria-hidden="true" />

      {isAuthed ? (
        children
      ) : (
        <div className="flex items-center gap-3">
          <Link
            href="/signup/employer"
            className="inline-flex min-h-11 items-center font-sans text-sm text-secondary hover:text-ink"
          >
            Post a job
          </Link>
          {pathname !== "/login" && (
            <LinkButton href="/login" variant="secondary" size="compact">
              Log in
            </LinkButton>
          )}
        </div>
      )}
    </nav>
  );
}
