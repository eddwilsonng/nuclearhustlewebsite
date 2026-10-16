"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { useState } from "react";
import { signOut } from "@/lib/auth/actions";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  COMPANIES_NAV,
  EMPLOYER_NAV,
  FIND_WORK_NAV,
  JOBS_NAV_GROUPS,
  isNavItemActive,
  type NavItem,
} from "@/components/site-nav";

function MenuLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isNavItemActive(pathname, item);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={`relative flex min-h-14 items-center border-b border-rule font-sans text-lg font-medium ${
        active ? "text-ink" : "text-secondary"
      }`}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute top-1/2 -left-4 h-4 w-0.5 -translate-y-1/2 bg-ink"
        />
      ) : null}
      {item.label}
    </Link>
  );
}

function Section({
  label,
  items,
  pathname,
  onNavigate,
  first = false,
}: {
  label: string;
  items: readonly NavItem[];
  pathname: string;
  onNavigate: () => void;
  first?: boolean;
}) {
  return (
    <div>
      <p
        className={`pb-1 font-mono text-xs uppercase tracking-widest text-secondary ${first ? "pt-2" : "pt-6"}`}
      >
        {label}
      </p>
      {items.map((item) => (
        <MenuLink
          key={item.href}
          item={item}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

export function MobileNav({ isAuthed = false }: { isAuthed?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Open menu"
        className="ml-auto inline-flex size-11 items-center justify-center text-ink lg:hidden"
      >
        <span className="flex flex-col gap-1.5" aria-hidden="true">
          <span className="block h-px w-5 bg-ink" />
          <span className="block h-px w-5 bg-ink" />
          <span className="block h-px w-5 bg-ink" />
        </span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Popup className="fixed inset-0 z-50 flex flex-col bg-canvas text-ink outline-none">
          <div className="flex h-16 items-center justify-between border-b border-rule px-6">
            <Dialog.Title className="font-sans text-base font-bold tracking-tight">
              <Link href="/" onClick={close}>
                Nuclear Hustle
              </Link>
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close menu"
              className="inline-flex min-h-11 items-center px-2 font-sans text-sm font-medium text-secondary hover:text-ink"
            >
              Close
            </Dialog.Close>
          </div>

          <nav
            aria-label="Mobile"
            className="flex flex-1 flex-col overflow-y-auto px-6 py-2"
          >
            <Section
              label="Find work"
              items={FIND_WORK_NAV}
              pathname={pathname}
              onNavigate={close}
              first
            />
            <Section
              label="Employers"
              items={EMPLOYER_NAV}
              pathname={pathname}
              onNavigate={close}
            />
            <div className="pt-6">
              <MenuLink
                item={COMPANIES_NAV}
                pathname={pathname}
                onNavigate={close}
              />
            </div>
            {JOBS_NAV_GROUPS.map((group, index) => (
              <Section
                key={group[0]?.href ?? index}
                label={index === 0 ? "Jobs" : index === 1 ? "By state" : "Fleet"}
                items={group}
                pathname={pathname}
                onNavigate={close}
              />
            ))}

            <div className="mt-8">
              {isAuthed ? (
                <>
                  {(
                    [
                      { href: "/dashboard", label: "Dashboard", match: "exact" },
                      {
                        href: "/dashboard/profile",
                        label: "Profile",
                        match: "exact",
                      },
                      {
                        href: "/dashboard/saved",
                        label: "Saved jobs",
                        match: "exact",
                      },
                    ] as const satisfies readonly NavItem[]
                  ).map((item) => (
                    <MenuLink
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      onNavigate={close}
                    />
                  ))}
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="flex min-h-12 w-full items-center border-b border-rule font-sans text-base text-danger"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                pathname !== "/login" && (
                  <Link
                    href="/login"
                    onClick={close}
                    className="flex min-h-12 items-center border-b border-rule font-sans text-base text-ink"
                  >
                    Log in
                  </Link>
                )
              )}
            </div>
          </nav>

          <div className="flex flex-col gap-3 border-t border-rule px-6 py-5">
            <LinkButton href="/jobs" variant="primary" fullWidth onClick={close}>
              Browse jobs
            </LinkButton>
            <LinkButton
              href="/signup/employer"
              variant="secondary"
              fullWidth
              onClick={close}
            >
              Post a job
            </LinkButton>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
