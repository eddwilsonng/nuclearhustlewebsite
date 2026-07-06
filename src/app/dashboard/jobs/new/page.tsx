import { JobPostingForm } from '@/components/dashboard/JobPostingForm';

export const metadata = {
  title: 'Post a Job - Nuclear Hustle',
};

export default function NewJobPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-mono text-3xl md:text-4xl font-bold leading-tight text-stone-900 mb-6">Post a New Job</h1>

      <div className="bg-[#EDE8DF] border border-[#CFC8BC] p-6">
        <JobPostingForm mode="create" />
      </div>
    </div>
  );
}
