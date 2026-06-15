'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Flag } from 'lucide-react';

const REASONS = [
  { id: 'broken_link', label: 'Link is broken' },
  { id: 'job_filled', label: 'Job has been filled' },
  { id: 'expired', label: 'Listing is expired' },
  { id: 'scam', label: 'Looks like a scam' },
  { id: 'incorrect_details', label: 'Details are incorrect' },
] as const;

type ReasonId = typeof REASONS[number]['id'];

interface FlagJobModalProps {
  jobSlug: string;
  onClose: () => void;
}

export function FlagJobModal({ jobSlug, onClose }: FlagJobModalProps) {
  const [selected, setSelected] = useState<ReasonId | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleSubmit() {
    if (!selected) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/jobs/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobSlug, reason: selected, notes: notes.trim() || undefined }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

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

        {status === 'success' ? (
          <div className="py-4 text-center">
            <p className="font-mono text-sm font-bold text-stone-900 mb-2">Thanks for the report</p>
            <p className="font-mono text-xs text-stone-500">We&apos;ll review this listing and take action if needed.</p>
            <button
              onClick={onClose}
              className="mt-6 font-mono text-xs tracking-widest uppercase py-2.5 px-6 border border-[#CFC8BC] text-stone-600 hover:bg-[#E5DFD5] transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-1">
              <Flag size={14} className="text-stone-500" />
              <p className="font-mono text-sm font-bold text-stone-900">Flag this listing</p>
            </div>
            <p className="font-mono text-xs text-stone-500 mb-5">
              What&apos;s the issue? We&apos;ll review it and take action if needed.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  className={`text-left font-mono text-xs px-3 py-2.5 border transition-colors ${
                    selected === r.id
                      ? 'border-yellow-400 bg-yellow-50 text-stone-900'
                      : 'border-[#CFC8BC] text-stone-600 hover:bg-[#E5DFD5]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else we should know? (optional)"
              rows={3}
              maxLength={500}
              className="w-full font-mono text-xs bg-[#EDE8DF] border border-[#CFC8BC] px-3 py-2 text-stone-700 placeholder:text-stone-400 resize-none focus:outline-none focus:border-stone-400 mb-4"
            />

            {status === 'error' && (
              <p className="font-mono text-xs text-red-600 mb-3">Something went wrong. Please try again.</p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={onClose}
                className="font-mono text-xs tracking-widest uppercase py-2.5 px-4 border border-[#CFC8BC] text-stone-600 hover:bg-[#E5DFD5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selected || status === 'submitting'}
                className="font-mono text-xs tracking-widest uppercase py-2.5 px-4 bg-stone-800 text-white hover:bg-stone-700 transition-colors disabled:opacity-40"
              >
                {status === 'submitting' ? 'Sending…' : 'Submit report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
