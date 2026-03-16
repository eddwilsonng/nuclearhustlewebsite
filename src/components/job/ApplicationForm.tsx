'use client';

import { useState } from 'react';

interface ApplicationFormProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
}

export function ApplicationForm({ jobId, jobTitle, companyName }: ApplicationFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('jobId', jobId);

    try {
      const res = await fetch('/api/apply', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
      } else {
        setStatus('success');
        form.reset();
      }
    } catch {
      setErrorMessage('Network error. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="border border-gray-100 p-6 text-center">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-mono text-sm font-bold text-gray-900 mb-1">Application sent!</p>
        <p className="font-mono text-xs text-gray-400">
          {companyName} will be in touch if your profile is a match.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-100 p-6">
      <p className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-4">Apply for this role</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 font-mono text-xs text-red-600 border border-red-200 bg-red-50">
            {errorMessage}
          </div>
        )}

        <div>
          <label htmlFor="applicantName" className="block font-mono text-xs tracking-widest uppercase text-gray-400 mb-1.5">
            Full Name
          </label>
          <input
            id="applicantName"
            name="applicantName"
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-200 font-mono text-sm focus:outline-none focus:border-yellow-400 transition-colors"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="applicantEmail" className="block font-mono text-xs tracking-widest uppercase text-gray-400 mb-1.5">
            Email
          </label>
          <input
            id="applicantEmail"
            name="applicantEmail"
            type="email"
            required
            className="w-full px-3 py-2 border border-gray-200 font-mono text-sm focus:outline-none focus:border-yellow-400 transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="message" className="block font-mono text-xs tracking-widest uppercase text-gray-400 mb-1.5">
            Cover Letter <span className="normal-case text-gray-300">(optional)</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 font-mono text-sm focus:outline-none focus:border-yellow-400 transition-colors resize-none"
            placeholder="Tell them why you're a great fit..."
          />
        </div>

        <div>
          <label htmlFor="cv" className="block font-mono text-xs tracking-widest uppercase text-gray-400 mb-1.5">
            CV / Resume <span className="normal-case text-gray-300">(PDF or Word · max 5MB)</span>
          </label>
          <input
            id="cv"
            name="cv"
            type="file"
            accept=".pdf,.doc,.docx"
            required
            className="w-full text-sm text-gray-500 font-mono file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-200 file:text-xs file:font-mono file:uppercase file:tracking-widest file:bg-white file:text-gray-600 hover:file:bg-gray-50 file:cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-200 text-gray-900 font-mono text-xs tracking-widest uppercase font-bold transition-colors"
        >
          {status === 'submitting' ? 'Sending...' : `Apply for ${jobTitle} →`}
        </button>
      </form>
    </div>
  );
}
