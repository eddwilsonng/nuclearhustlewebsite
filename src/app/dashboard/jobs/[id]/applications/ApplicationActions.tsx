'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getApplicationCvUrl, updateApplicationStatus } from '@/lib/auth/actions';
import type { ApplicationStatus } from '@/lib/types';

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  new: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  reviewed: 'bg-blue-100 text-blue-800 border-blue-300',
  shortlisted: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-stone-200 text-stone-600 border-stone-300',
};

export function StatusSelect({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState<ApplicationStatus>(status);
  const router = useRouter();

  const handleChange = (next: ApplicationStatus) => {
    setCurrent(next);
    startTransition(async () => {
      await updateApplicationStatus(applicationId, next);
      router.refresh();
    });
  };

  return (
    <select
      value={current}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as ApplicationStatus)}
      className={`font-mono text-xs uppercase tracking-widest border px-2 py-1 disabled:opacity-50 ${STATUS_STYLES[current]}`}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function DownloadCvButton({
  applicationId,
  hasCv,
}: {
  applicationId: string;
  hasCv: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!hasCv) {
    return <span className="font-mono text-xs uppercase tracking-widest text-stone-400">No CV</span>;
  }

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await getApplicationCvUrl(applicationId);
      if (result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
      } else {
        setError(result.error ?? 'Could not open CV');
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="font-mono text-xs uppercase tracking-widest border border-stone-900 px-3 py-1.5 hover:bg-stone-900 hover:text-[#EDE8DF] disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Opening…' : 'Download CV'}
      </button>
      {error && <span className="font-mono text-xs text-red-600">{error}</span>}
    </div>
  );
}
