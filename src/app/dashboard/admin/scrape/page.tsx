import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { getCompanies } from '@/lib/data/static';
import { getAllScrapedJobs } from '@/lib/data/jobs-full';
import { ScrapePanel } from '@/components/admin/ScrapePanel';
import { DashboardBody, DashboardPageHeader } from '@/components/dashboard/DashboardChrome';

export const metadata = {
  title: 'Scraper - Nuclear Hustle',
};

export default async function AdminScrapePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    redirect('/dashboard');
  }

  const companies = getCompanies();
  const jobs = getAllScrapedJobs();

  const companyCards = companies.map((c) => {
    const jobCount = jobs.filter((j) => j.company_id === c.id).length;
    return {
      id: c.id,
      name: c.name,
      careersUrl: c.careers_url,
      // Formatted here so server and browser render the same text.
      lastScraped: c.last_scraped
        ? new Date(c.last_scraped).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC',
          })
        : null,
      jobCount,
    };
  });

  return (
    <>
      <DashboardPageHeader
        title="Scraper"
        description="Run a crawl for one operator. New jobs are merged in, existing jobs are updated and manual edits are kept."
      />
      <DashboardBody>
        <ScrapePanel companies={companyCards} />
      </DashboardBody>
    </>
  );
}
