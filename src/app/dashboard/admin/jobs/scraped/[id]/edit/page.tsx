import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { getJobById } from '@/lib/data/jobs-full';
import { ScrapedJobForm } from '@/components/admin/ScrapedJobForm';
import { ExternalLinkButton, LinkButton } from '@/components/ui/LinkButton';
import { DashboardBody, DashboardPageHeader } from '@/components/dashboard/DashboardChrome';

export const metadata = {
  title: 'Admin Edit Scraped Job - Nuclear Hustle',
};

export default async function AdminEditScrapedJobPage({
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

  const job = getJobById(id);

  if (!job) {
    notFound();
  }

  // The public job page only serves published scraped jobs.
  const published = !job.status || job.status === 'published';

  return (
    <>
      <DashboardPageHeader
        title={job.title}
        description={`${job.company?.name ?? job.company_id} · scraped listing. Manual edits are kept when the scraper runs again.`}
        back={{ href: '/dashboard/admin/jobs', label: 'All jobs' }}
        action={
          <>
            {published ? (
              <LinkButton href={`/job/${job.slug}`} variant="secondary" size="compact">
                View listing
              </LinkButton>
            ) : null}
            {job.url ? (
              <ExternalLinkButton href={job.url} target="_blank" variant="secondary" size="compact">
                Original posting
                <span className="sr-only"> (opens in a new tab)</span>
              </ExternalLinkButton>
            ) : null}
          </>
        }
      />
      <DashboardBody width="form">
        <ScrapedJobForm
          job={{
            id: job.id,
            title: job.title,
            location: job.location,
            category: job.category,
            url: job.url,
            description: job.description,
          }}
        />
      </DashboardBody>
    </>
  );
}
