import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { isAdmin } from '@/lib/admin';
import type { Profile } from '@/lib/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Authenticated but no profile row yet (e.g. a Google user who hasn't finished
  // onboarding). Send them to onboarding, NOT /login — middleware bounces
  // authenticated users off /login, which would create a redirect loop.
  if (!profile) {
    redirect('/onboarding');
  }

  return (
    <div className="flex flex-col md:flex-row min-w-0">
      <DashboardSidebar profile={profile as Profile} isAdmin={isAdmin(user.email)} />
      <main className="flex-1 min-w-0 p-4 md:p-8 bg-[#E5DFD5] min-h-[calc(100vh-3.5rem)]">
        {children}
      </main>
    </div>
  );
}
