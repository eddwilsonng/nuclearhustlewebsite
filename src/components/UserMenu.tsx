"use client";

import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { signOut } from "@/lib/auth/actions";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

interface UserMenuProps {
  user: User;
  profile: Profile;
}

export function UserMenu({ profile }: UserMenuProps) {
  const initials = (profile.full_name || profile.email || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Account menu"
        className="inline-flex min-h-11 items-center gap-2 px-1 hover:bg-surface"
      >
        <span className="inline-flex size-8 items-center justify-center bg-signal font-mono text-xs font-bold text-ink">
          {initials}
        </span>
        <span aria-hidden="true" className="text-xs text-secondary">
          ▾
        </span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="end" className="z-50">
          <Menu.Popup className="card-raised w-64 border border-control bg-raised py-1 outline-none">
            <div className="border-b border-rule px-4 py-3">
              <p className="truncate font-sans text-sm font-semibold text-ink">
                {profile.full_name || profile.email}
              </p>
              <p className="truncate font-mono text-xs text-secondary">
                {profile.email}
              </p>
              <p className="mt-2 font-mono text-xs uppercase tracking-widest text-secondary">
                {profile.role === "employer" ? "Employer" : "Job seeker"}
              </p>
            </div>
            <Menu.Item
              render={
                <Link
                  href="/dashboard"
                  className="block px-4 py-3 font-sans text-sm text-ink no-underline outline-none data-highlighted:bg-surface"
                />
              }
            >
              Dashboard
            </Menu.Item>
            <Menu.Item
              render={
                <Link
                  href="/dashboard/profile"
                  className="block px-4 py-3 font-sans text-sm text-ink no-underline outline-none data-highlighted:bg-surface"
                />
              }
            >
              Profile
            </Menu.Item>
            {profile.role === "job_seeker" && (
              <Menu.Item
                render={
                  <Link
                    href="/dashboard/saved"
                    className="block px-4 py-3 font-sans text-sm text-ink no-underline outline-none data-highlighted:bg-surface"
                  />
                }
              >
                Saved jobs
              </Menu.Item>
            )}
            {profile.role === "employer" && (
              <Menu.Item
                render={
                  <Link
                    href="/dashboard/jobs"
                    className="block px-4 py-3 font-sans text-sm text-ink no-underline outline-none data-highlighted:bg-surface"
                  />
                }
              >
                Manage jobs
              </Menu.Item>
            )}
            <div className="border-t border-rule">
              <form action={signOut}>
                <button
                  type="submit"
                  className="w-full px-4 py-3 text-left font-sans text-sm text-danger hover:bg-surface"
                >
                  Sign out
                </button>
              </form>
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
