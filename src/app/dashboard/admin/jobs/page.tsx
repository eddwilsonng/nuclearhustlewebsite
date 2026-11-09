import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/admin';
import { getAllScrapedJobs } from '@/lib/data/jobs-full';
import { getCompanyById } from '@/lib/data/static';
import { getListingStatus } from '@/lib/jobs/listingStatus';
import { AdminJobTable, type AdminJob } from '@/components/admin/AdminJobTable';
import {
  DashboardAlert,
  DashboardBody,
  DashboardPageHeader,
} from '@/components/dashboard/DashboardChrome';
import type { EmployerJob, Job } from '@/lib/types';

export const metadata = {
  title: 'All jobs - Nuclear Hustle',
};

type Status = Pick<AdminJob, 'statusKey' | 'statusLabel' | 'statusTone'>;

const LISTING_STATUS: Record<'live' | 'paused' | 'expired', Status> = {
  live: { statusKey: 'live', statusLabel: 'Live', statusTone: 'success' },
  paused: { statusKey: 'paused', statusLabel: 'Paused', statusTone: 'neutral' },
  expired: { statusKey: 'expired', statusLabel: 'Expired', statusTone: 'danger' },
};

const SCRAPED_STATUS: Record<NonNullable<Job['status']>, Status> = {
  published: LISTING_STATUS.live,
  pending_review: { statusKey: 'pending_review', statusLabel: 'Pending review', statusTone: 'neutral' },
  rejected: { statusKey: 'rejected', statusLabel: 'Rejected', statusTone: 'danger' },
  expired: LISTING_STATUS.expired,
  duplicate: { statusKey: 'duplicate', statusLabel: 'Duplicate', statusTone: 'neutral' },
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// Service client: RLS would hide other employers' inactive jobs. Only called
// after the isAdmin() check below.
async function getAllEmployerJobs() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('employer_jobs')
    .select(`
      *,
      employer:employer_profiles(company_name)
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as (EmployerJob & { employer: { company_name: string } | null })[];
}

export default async function AdminJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    redirect('/dashboard');
  }

  const scrapedJobs = getAllScrapedJobs();
  let employerJobs: Awaited<ReturnType<typeof getAllEmployerJobs>> = [];
  let employerFailed = false;
  try {
    employerJobs = await getAllEmployerJobs();
  } catch {
    employerFailed = true;
  }

  const now = new Date();
  const tableJobs: AdminJob[] = [
    ...employerJobs.map((job): AdminJob => {
      const listing = getListingStatus(job, now);
      return {
        id: job.id,
        title: job.title,
        company: job.employer?.company_name || 'Unknown employer',
        location: job.location,
        source: 'employer',
        date: job.created_at,
        dateLabel: formatDate(job.created_at),
        ...LISTING_STATUS[listing.key],
        // An expired listing can't be made live by toggling; it needs renewing.
        toggle: listing.key === 'expired' ? undefined : { isActive: job.is_active },
        // /job/[slug] only serves active, unexpired employer listings.
        publicHref: listing.key === 'live' ? `/job/${job.slug}` : null,
        editHref: `/dashboard/admin/jobs/${job.id}/edit`,
      };
    }),
    ...scrapedJobs.map((job): AdminJob => {
      const company = getCompanyById(job.company_id);
      const status = SCRAPED_STATUS[job.status ?? 'published'];
      return {
        id: job.id,
        title: job.title,
        company: company?.name || job.company_id,
        location: job.location,
        source: 'scraped',
        date: job.scraped_at,
        dateLabel: formatDate(job.scraped_at),
        ...status,
        // /job/[slug] only serves published scraped jobs.
        publicHref: status.statusKey === 'live' ? `/job/${job.slug}` : null,
        editHref: `/dashboard/admin/jobs/scraped/${job.id}/edit`,
      };
    }),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <DashboardPageHeader
        title="All jobs"
        description={`${employerJobs.length.toLocaleString('en-US')} employer · ${scrapedJobs.length.toLocaleString('en-US')} scraped. Employer listings can be paused; any listing can be edited or deleted.`}
      />
      <DashboardBody>
        {employerFailed ? (
          <div className="mb-6">
            <DashboardAlert tone="error">
              Employer listings couldn&apos;t load, so only scraped jobs are shown. Check SUPABASE_SERVICE_ROLE_KEY, then refresh.
            </DashboardAlert>
          </div>
        ) : null}
        <AdminJobTable jobs={tableJobs} />
      </DashboardBody>
    </>
  );
}
