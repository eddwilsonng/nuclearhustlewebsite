import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { getCompanies } from '@/lib/data/static';
import { getAllScrapedJobs } from '@/lib/data/jobs-full';
import { ScrapePanel } from '@/components/admin/ScrapePanel';

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
      lastScraped: c.last_scraped,
      jobCount,
    };
  });

  return (
    <div>
      <h1 className="font-mono text-3xl md:text-4xl font-bold leading-tight text-stone-900 mb-1">Scrape Jobs</h1>
      <p className="text-sm text-stone-500 mb-8 font-mono">
        Trigger per-company scrapes. New jobs are merged, existing jobs are updated, manual edits are preserved.
      </p>
      <ScrapePanel companies={companyCards} />
    </div>
  );
}
