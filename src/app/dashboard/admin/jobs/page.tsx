import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { getJobs } from '@/lib/data/static';
import { getCompanyById } from '@/lib/data/static';
import { AdminJobTable } from '@/components/admin/AdminJobTable';

async function getAllEmployerJobs() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('employer_jobs')
    .select(`
      *,
      employer:employer_profiles(company_name)
    `)
    .order('created_at', { ascending: false });
  return data || [];
}

export default async function AdminJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    redirect('/dashboard');
  }

  const scrapedJobs = getJobs();
  const employerJobs = await getAllEmployerJobs();

  const tableJobs = [
    ...employerJobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.employer?.company_name || 'Unknown',
      location: job.location,
      category: job.category,
      date: job.created_at,
      source: 'employer' as const,
      isActive: job.is_active,
      slug: job.slug,
    })),
    ...scrapedJobs.map((job) => {
      const company = getCompanyById(job.company_id);
      return {
        id: job.id,
        title: job.title,
        company: company?.name || job.company_id,
        location: job.location,
        category: job.category,
        date: job.scraped_at,
        source: 'scraped' as const,
        isActive: undefined,
        slug: job.slug,
      };
    }),
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Manage Jobs</h1>
      <p className="text-sm text-gray-500 mb-8 font-mono">
        All job postings across the site. Employer jobs can be edited or deleted.
      </p>
      <AdminJobTable jobs={tableJobs} />
    </div>
  );
}
