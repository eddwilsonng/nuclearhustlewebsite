import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { getJobs } from '@/lib/data/static';
import { ScrapedJobForm } from '@/components/admin/ScrapedJobForm';

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

  const jobs = getJobs();
  const job = jobs.find((j) => j.id === id);

  if (!job) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/admin/jobs"
          className="text-stone-500 hover:text-stone-900"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h1 className="font-mono text-3xl md:text-4xl font-bold leading-tight text-stone-900">
          Edit Scraped Job
          <span className="ml-2 text-xs font-mono text-stone-500 bg-[#E5DFD5] px-2 py-0.5">
            scraped
          </span>
        </h1>
      </div>

      <div className="bg-white border border-[#CFC8BC] p-6">
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
      </div>
    </div>
  );
}
