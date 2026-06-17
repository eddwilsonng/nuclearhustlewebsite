import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isAdmin, ADMIN_VIEW_COOKIE, type AdminViewRole } from '@/lib/admin';
import { JobSeekerProfileForm } from '@/components/dashboard/JobSeekerProfileForm';
import { EmployerProfileForm } from '@/components/dashboard/EmployerProfileForm';
import type { Profile, JobSeekerProfile, EmployerProfile } from '@/lib/types';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  const typedProfile = profile as Profile;
  let viewRole: AdminViewRole = typedProfile.role as AdminViewRole;

  if (isAdmin(user.email)) {
    const cookieStore = await cookies();
    const override = cookieStore.get(ADMIN_VIEW_COOKIE)?.value as AdminViewRole | undefined;
    if (override === 'employer' || override === 'job_seeker') {
      viewRole = override;
    }
  }

  if (viewRole === 'job_seeker') {
    const { data: jobSeekerProfile } = await supabase
      .from('job_seeker_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return (
      <JobSeekerProfileForm
        profile={typedProfile}
        jobSeekerProfile={jobSeekerProfile as JobSeekerProfile | null}
      />
    );
  }

  const { data: employerProfile } = await supabase
    .from('employer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <EmployerProfileForm
      profile={typedProfile}
      employerProfile={employerProfile as EmployerProfile | null}
    />
  );
}
