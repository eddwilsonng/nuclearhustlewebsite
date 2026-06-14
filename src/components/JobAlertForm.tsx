'use client';

import { useState } from 'react';
import Link from 'next/link';

export function JobAlertForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-3 font-mono text-sm">
        <span className="text-yellow-600">✓</span>
        <span className="text-stone-600">
          You&apos;re on the list — we&apos;ll email you new jobs every Monday.{' '}
          <Link href="/signup" className="underline underline-offset-2 text-stone-900 hover:text-yellow-600 transition-colors">
            Create a free account
          </Link>{' '}
          to save searches.
        </span>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 max-w-sm">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={loading}
          className="flex-1 font-mono text-xs tracking-wide px-4 py-3 bg-white border border-[#CFC8BC] border-r-0 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 min-w-0 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="font-mono text-xs tracking-widest uppercase px-5 py-3 bg-stone-900 hover:bg-stone-700 text-white font-bold transition-colors whitespace-nowrap disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Get Alerts'}
        </button>
      </form>
      {error && (
        <p className="mt-2 font-mono text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
