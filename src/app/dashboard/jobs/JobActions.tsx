'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toggleJobStatus, deleteJobPosting, renewJob } from '@/lib/auth/actions';

export function RenewJobButton({ jobId }: { jobId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRenew = () => {
    startTransition(async () => {
      await renewJob(jobId);
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleRenew}
      disabled={isPending}
      className="px-3 py-1.5 text-xs font-mono tracking-widest uppercase text-stone-900 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 border border-yellow-400 transition-colors font-bold"
    >
      {isPending ? '…' : 'Renew 60d'}
    </button>
  );
}

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

export function FeatureJobButton({ jobId, isFeatured, featuredUntil }: {
  jobId: string;
  isFeatured: boolean;
  featuredUntil: string | null;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const isCurrentlyFeatured = isFeatured && featuredUntil && new Date(featuredUntil) > new Date();

  const handleFeature = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setIsLoading(false);
    }
  };

  if (isCurrentlyFeatured && featuredUntil) {
    return (
      <span className="px-3 py-1.5 text-xs font-mono tracking-widest uppercase border border-yellow-400 text-stone-900 bg-yellow-50">
        ★ Featured until {new Date(featuredUntil).toLocaleDateString()}
      </span>
    );
  }

  return (
    <button
      onClick={handleFeature}
      disabled={isLoading}
      className="px-3 py-1.5 text-xs font-mono tracking-widest uppercase text-stone-900 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 border border-yellow-400 transition-colors font-bold"
    >
      {isLoading ? '…' : '★ Feature — $99'}
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
