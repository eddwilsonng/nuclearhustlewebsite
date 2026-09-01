"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { useState } from "react";
import { signOut } from "@/lib/auth/actions";
import { LinkButton } from "@/components/ui/LinkButton";

const PRIMARY_LINKS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/companies", label: "Companies" },
  { href: "/status", label: "Fleet Status" },
  { href: "/about", label: "About" },
];

const RESOURCES_LINKS = [
  { href: "/nuclear-salary", label: "Nuclear Salary Guide" },
  { href: "/nuclear-skills", label: "Nuclear Skills Report" },
];

export function MobileNav({ isAuthed = false }: { isAuthed?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Open menu"
        className="inline-flex size-11 items-center justify-center border border-transparent text-ink md:hidden"
      >
        <span className="flex flex-col gap-1.5" aria-hidden="true">
          <span className="block h-px w-5 bg-ink" />
          <span className="block h-px w-5 bg-ink" />
          <span className="block h-px w-5 bg-ink" />
        </span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Popup className="fixed inset-0 z-50 flex flex-col bg-canvas text-ink outline-none">
          <div className="flex items-center justify-between border-b border-rule px-6 py-3">
            <Dialog.Title className="font-sans text-sm font-semibold">
              Menu
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close menu"
              className="inline-flex min-h-11 items-center px-2 font-sans text-sm text-secondary hover:text-ink"
            >
              Close
            </Dialog.Close>
          </div>

          <nav
            aria-label="Mobile"
            className="flex flex-1 flex-col overflow-y-auto px-6 py-4"
          >
            {PRIMARY_LINKS.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-14 items-center justify-between border-b border-rule font-sans text-lg font-semibold ${
                    active ? "text-ink" : "text-secondary"
                  }`}
                >
                  {label}
                  <span aria-hidden="true">→</span>
                </Link>
              );
            })}

            <p className="pt-6 pb-2 font-mono text-xs uppercase tracking-widest text-secondary">
              Resources
            </p>
            {RESOURCES_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center justify-between border-b border-rule font-sans text-sm text-secondary hover:text-ink"
              >
                {label}
                <span aria-hidden="true">→</span>
              </Link>
            ))}

            <div className="mt-6">
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
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center justify-between border-b border-rule font-sans text-sm text-secondary hover:text-ink"
                    >
                      {label}
                    </Link>
                  ))}
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="flex min-h-12 w-full items-center justify-between border-b border-rule font-sans text-sm text-danger"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                pathname !== "/login" && (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center justify-between border-b border-rule font-sans text-sm text-secondary hover:text-ink"
                  >
                    Log in
                    <span aria-hidden="true">→</span>
                  </Link>
                )
              )}
            </div>
          </nav>

          <div className="flex flex-col gap-3 border-t border-rule px-6 py-5">
            <LinkButton
              href="/jobs"
              variant="primary"
              fullWidth
              onClick={() => setOpen(false)}
            >
              Browse jobs
            </LinkButton>
            <LinkButton
              href="/signup/employer"
              variant="secondary"
              fullWidth
              onClick={() => setOpen(false)}
            >
              Post a job
            </LinkButton>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
