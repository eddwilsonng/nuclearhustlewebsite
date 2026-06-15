import Link from 'next/link';
import { MobileNav } from './MobileNav';
import { UserMenu } from './UserMenu';
import { DesktopNav } from './DesktopNav';
import { StickyHeader } from './StickyHeader';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = (data as Profile) ?? null;
  }

  const isAuthed = !!(user && profile);

  return (
    <StickyHeader>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-mono font-bold text-xs tracking-widest uppercase text-stone-900">
            nuclearhustle
          </span>
        </Link>

        <DesktopNav isAuthed={isAuthed}>
          {isAuthed ? <UserMenu user={user!} profile={profile!} /> : null}
        </DesktopNav>

        <MobileNav isAuthed={isAuthed} />
      </div>
    </StickyHeader>
  );
}
