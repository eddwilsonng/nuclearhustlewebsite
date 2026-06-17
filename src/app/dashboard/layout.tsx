import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { isAdmin, ADMIN_VIEW_COOKIE, type AdminViewRole } from '@/lib/admin';
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

  const adminUser = isAdmin(user.email);

  // Admin can flip a cookie to preview the job-seeker side of the dashboard
  // without needing a second account. Defaults to the admin's real profile role.
  let viewRole = (profile as Profile).role as AdminViewRole;
  if (adminUser) {
    const cookieStore = await cookies();
    const override = cookieStore.get(ADMIN_VIEW_COOKIE)?.value as AdminViewRole | undefined;
    if (override === 'employer' || override === 'job_seeker') {
      viewRole = override;
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-w-0">
      <DashboardSidebar
        profile={profile as Profile}
        isAdmin={adminUser}
        viewRole={viewRole}
      />
      <main className="flex-1 min-w-0 p-4 md:p-8 bg-[#E5DFD5] min-h-[calc(100vh-3.5rem)]">
        {children}
      </main>
    </div>
  );
}
