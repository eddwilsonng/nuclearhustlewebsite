'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { SaveJobModal } from './SaveJobModal';

interface SaveJobButtonProps {
  jobSlug: string;
  jobId: string;
  initialSaved?: boolean;
  isAuthenticated?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function SaveJobButton({
  jobSlug,
  jobId,
  initialSaved = false,
  isAuthenticated = false,
  showLabel = false,
  className = '',
}: SaveJobButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setShowModal(true);
      return;
    }

    setLoading(true);
    try {
      const method = saved ? 'DELETE' : 'POST';
      const res = await fetch('/api/jobs/save', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobSlug, jobId }),
      });

      if (res.status === 401) {
        setShowModal(true);
        return;
      }
      if (res.ok) {
        setSaved(!saved);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        aria-label={saved ? 'Unsave job' : 'Save job'}
        className={`flex items-center gap-1.5 transition-colors disabled:opacity-50 ${className}`}
      >
        <Heart
          size={14}
          className={saved ? 'fill-yellow-400 text-yellow-400' : 'text-stone-400'}
        />
        {showLabel && (
          <span className="font-mono text-[10px] tracking-widest uppercase">
            {saved ? 'Saved' : 'Save job'}
          </span>
        )}
      </button>

      {showModal && (
        <SaveJobModal
          onClose={() => setShowModal(false)}
          redirectPath={`/job/${jobSlug}`}
        />
      )}
    </>
  );
}
