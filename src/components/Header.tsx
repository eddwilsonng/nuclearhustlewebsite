import Link from "next/link";
import { MobileNav } from "./MobileNav";
import { UserMenu } from "./UserMenu";
import { DesktopNav } from "./DesktopNav";
import { StickyHeader } from "./StickyHeader";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = (data as Profile) ?? null;
  }

  const isAuthed = !!(user && profile);

  return (
    <StickyHeader>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="font-sans text-sm font-semibold tracking-tight text-ink"
        >
          Nuclear Hustle
        </Link>

        <DesktopNav isAuthed={isAuthed}>
          {isAuthed ? <UserMenu user={user!} profile={profile!} /> : null}
        </DesktopNav>

        <MobileNav isAuthed={isAuthed} />
      </div>
    </StickyHeader>
  );
}
