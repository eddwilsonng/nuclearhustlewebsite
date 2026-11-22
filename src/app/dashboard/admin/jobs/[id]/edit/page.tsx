import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/admin';
import { JobPostingForm } from '@/components/dashboard/JobPostingForm';
import { adminUpdateJob } from '@/lib/admin/actions';
import { getListingStatus } from '@/lib/jobs/listingStatus';
import { LinkButton } from '@/components/ui/LinkButton';
import { DashboardBody, DashboardPageHeader } from '@/components/dashboard/DashboardChrome';
import type { EmployerJob } from '@/lib/types';

export const metadata = {
  title: 'Admin Edit Job - Nuclear Hustle',
};

export default async function AdminEditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    redirect('/dashboard');
  }

  // Service client so the admin can open any employer's job, active or not.
  const { data: job } = await createAdminClient()
    .from('employer_jobs')
    .select('*, employer:employer_profiles(company_name)')
    .eq('id', id)
    .maybeSingle();

  if (!job) {
    notFound();
  }

  const { employer, ...rest } = job as EmployerJob & { employer: { company_name: string } | null };
  const typedJob = rest as EmployerJob;
  const live = getListingStatus(typedJob).key === 'live';

  return (
    <>
      <DashboardPageHeader
        title={typedJob.title}
        description={`${employer?.company_name ?? 'Unknown employer'} · editing as admin. Changes go live on the public listing as soon as you save.`}
        back={{ href: '/dashboard/admin/jobs', label: 'All jobs' }}
        action={
          live ? (
            <LinkButton href={`/job/${typedJob.slug}`} variant="secondary" size="compact">
              View listing
            </LinkButton>
          ) : null
        }
      />
      <DashboardBody width="form">
        <JobPostingForm job={typedJob} mode="edit" customAction={adminUpdateJob} />
      </DashboardBody>
    </>
  );
}
