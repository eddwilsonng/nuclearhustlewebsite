'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleJobStatus, deleteJobPosting } from '@/lib/auth/actions';

export function JobStatusToggle({ jobId, isActive }: { jobId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleJobStatus(jobId, !isActive);
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
        isActive
          ? 'text-orange-700 hover:bg-orange-50'
          : 'text-green-700 hover:bg-green-50'
      }`}
    >
      {isPending ? '...' : isActive ? 'Deactivate' : 'Activate'}
    </button>
  );
}

export function DeleteJobButton({ jobId }: { jobId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return;
    }

    startTransition(async () => {
      await deleteJobPosting(jobId);
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
    >
      {isPending ? '...' : 'Delete'}
    </button>
  );
}
