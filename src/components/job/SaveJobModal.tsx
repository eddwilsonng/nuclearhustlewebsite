'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, Heart } from 'lucide-react';

interface SaveJobModalProps {
  onClose: () => void;
  redirectPath?: string;
}

export function SaveJobModal({ onClose, redirectPath }: SaveJobModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const signupHref = redirectPath
    ? `/signup/job-seeker?redirect=${encodeURIComponent(redirectPath)}`
    : '/signup/job-seeker';
  const loginHref = redirectPath
    ? `/login?redirect=${encodeURIComponent(redirectPath)}`
    : '/login';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-[#EDE8DF] border border-[#CFC8BC] w-full max-w-sm mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center border border-[#CFC8BC] bg-[#E5DFD5]">
            <Heart size={16} className="text-stone-500" />
          </div>
          <p className="font-mono text-sm font-bold text-stone-900">Save this job</p>
        </div>

        <p className="font-mono text-xs text-stone-500 leading-relaxed mb-6">
          Create a free account to save jobs and get back to them anytime.
        </p>

        <div className="flex flex-col gap-2">
          <Link
            href={signupHref}
            className="block w-full text-center font-mono text-xs tracking-widest uppercase py-3 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors"
          >
            Create free account
          </Link>
          <Link
            href={loginHref}
            className="block w-full text-center font-mono text-xs tracking-widest uppercase py-3 border border-[#CFC8BC] text-stone-600 hover:bg-[#E5DFD5] transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
