"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { useState } from "react";
import { signOut } from "@/lib/auth/actions";
import { LinkButton } from "@/components/ui/LinkButton";
import { isNavActive, PRIMARY_NAV, RESOURCE_NAV } from "@/components/site-nav";

function MenuLink({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
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
      {label}
    </Link>
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
            {PRIMARY_NAV.map(({ href, label }) => (
              <MenuLink
                key={href}
                href={href}
                label={label}
                active={isNavActive(pathname, href)}
                onNavigate={close}
              />
            ))}

            <p className="pt-6 pb-1 font-mono text-xs uppercase tracking-widest text-secondary">
              Resources
            </p>
            {RESOURCE_NAV.map(({ href, label }) => (
              <MenuLink
                key={href}
                href={href}
                label={label}
                active={isNavActive(pathname, href)}
                onNavigate={close}
              />
            ))}
            <MenuLink
              href="/about"
              label="About"
              active={isNavActive(pathname, "/about")}
              onNavigate={close}
            />

            <div className="mt-8">
              {isAuthed ? (
                <>
                  {[
                    { href: "/dashboard", label: "Dashboard" },
                    { href: "/dashboard/profile", label: "Profile" },
                    { href: "/dashboard/saved", label: "Saved jobs" },
                  ].map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={close}
                      className="flex min-h-12 items-center border-b border-rule font-sans text-base text-secondary hover:text-ink"
                    >
                      {label}
                    </Link>
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
