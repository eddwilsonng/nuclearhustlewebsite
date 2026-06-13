import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { JobPostingForm } from '@/components/dashboard/JobPostingForm';
import type { EmployerJob } from '@/lib/types';

export const metadata = {
  title: 'Edit Job - Nuclear Hustle',
};

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Get employer profile
  const { data: employerProfile } = await supabase
    .from('employer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!employerProfile) {
    notFound();
  }

  // Get job and verify ownership
  const { data: job } = await supabase
    .from('employer_jobs')
    .select('*')
    .eq('id', id)
    .eq('employer_id', employerProfile.id)
    .single();

  if (!job) {
    notFound();
  }

  const typedJob = job as EmployerJob;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/jobs"
          className="text-stone-500 hover:text-stone-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">Edit Job</h1>
      </div>

      <div className="bg-[#EDE8DF] rounded-lg border border-[#CFC8BC] p-6">
        <JobPostingForm job={typedJob} mode="edit" />
      </div>
    </div>
  );
}
