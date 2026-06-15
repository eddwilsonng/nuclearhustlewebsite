'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { FlagJobModal } from './FlagJobModal';

interface FlagJobButtonProps {
  jobSlug: string;
}

export function FlagJobButton({ jobSlug }: FlagJobButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 font-mono text-xs text-stone-400 hover:text-stone-600 transition-colors"
      >
        <Flag size={12} />
        Flag this listing
      </button>

      {showModal && (
        <FlagJobModal
          jobSlug={jobSlug}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
