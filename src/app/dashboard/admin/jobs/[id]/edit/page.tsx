import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { JobPostingForm } from '@/components/dashboard/JobPostingForm';
import { adminUpdateJob } from '@/lib/admin/actions';
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

  const { data: job } = await supabase
    .from('employer_jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (!job) {
    notFound();
  }

  const typedJob = job as EmployerJob;

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
          Edit Job
          <span className="ml-2 text-xs font-mono text-yellow-700 bg-yellow-50 px-2 py-0.5">
            admin
          </span>
        </h1>
      </div>

      <div className="bg-white border border-[#CFC8BC] p-6">
        <JobPostingForm job={typedJob} mode="edit" customAction={adminUpdateJob} />
      </div>
    </div>
  );
}
