import { JobPostingForm } from '@/components/dashboard/JobPostingForm';

export const metadata = {
  title: 'Post a Job - Nuclear Hustle',
};

export default function NewJobPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Post a New Job</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <JobPostingForm mode="create" />
      </div>
    </div>
  );
}
