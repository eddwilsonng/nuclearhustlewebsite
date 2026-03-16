import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { UserMenu } from './UserMenu';

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-mono text-gray-300 text-sm select-none">##</span>
          <span className="font-mono font-bold text-xs tracking-widest uppercase text-gray-900">
            nuclearhustle
          </span>
        </Link>

        <nav className="flex items-center gap-8">
          <Link href="/jobs" className="font-mono text-xs tracking-widest uppercase text-gray-400 hover:text-gray-900 transition-colors">
            Jobs
          </Link>
          <Link href="/companies" className="font-mono text-xs tracking-widest uppercase text-gray-400 hover:text-gray-900 transition-colors">
            Companies
          </Link>
          {user && profile ? (
            <UserMenu user={user} profile={profile} />
          ) : (
            <>
              <Link href="/login" className="font-mono text-xs tracking-widest uppercase text-gray-400 hover:text-gray-900 transition-colors">
                Log In
              </Link>
              <Link href="/signup" className="font-mono text-xs tracking-widest uppercase px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
