'use client';

import { useState, useEffect, useCallback } from 'react';

interface CompanyCard {
  id: string;
  name: string;
  careersUrl: string;
  lastScraped: string | null;
  jobCount: number;
}

interface ScrapeStatus {
  status: 'idle' | 'running' | 'done' | 'error';
  company: string | null;
  companyName: string | null;
  startedAt: string | null;
  phase: string | null;
  jobsFound: number;
  newJobs: number;
  updatedJobs: number;
  completedAt: string | null;
  error: string | null;
}

interface ScrapePanelProps {
  companies: CompanyCard[];
}

export function ScrapePanel({ companies }: ScrapePanelProps) {
  const [status, setStatus] = useState<ScrapeStatus | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/scrape/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        return data;
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  useEffect(() => {
    pollStatus();
  }, [pollStatus]);

  useEffect(() => {
    if (status?.status !== 'running') return;

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [status?.status, pollStatus]);

  async function handleScrape(companyId: string) {
    setStarting(companyId);
    try {
      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to start scrape');
        setStarting(null);
        return;
      }

      // Start polling
      setTimeout(pollStatus, 1000);
    } catch {
      alert('Failed to start scrape');
    }
    setStarting(null);
  }

  const isRunning = status?.status === 'running';
  const lastResult =
    status?.status === 'done' || status?.status === 'error' ? status : null;

  return (
    <div>
      {/* Status banner */}
      {isRunning && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Scraping {status.companyName}...
              </p>
              <p className="text-xs font-mono text-gray-500 mt-0.5">
                {status.phase} &middot; {status.jobsFound} jobs found
              </p>
            </div>
          </div>
        </div>
      )}

      {lastResult && lastResult.status === 'done' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-800">
            {lastResult.companyName} scrape complete
          </p>
          <p className="text-xs font-mono text-green-600 mt-1">
            {lastResult.jobsFound} found &middot; {lastResult.newJobs} new &middot;{' '}
            {lastResult.updatedJobs} updated &middot;{' '}
            {lastResult.completedAt &&
              new Date(lastResult.completedAt).toLocaleTimeString()}
          </p>
        </div>
      )}

      {lastResult && lastResult.status === 'error' && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800">
            {lastResult.companyName} scrape failed
          </p>
          <p className="text-xs font-mono text-red-600 mt-1">{lastResult.error}</p>
        </div>
      )}

      {/* Company cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => {
          const isScraping = isRunning && status?.company === company.id;
          const isStarting = starting === company.id;
          const disabled = isRunning || isStarting;

          return (
            <div
              key={company.id}
              className={`bg-white border rounded-lg p-5 transition-colors ${
                isScraping ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{company.name}</h3>
                {isScraping && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-yellow-100 text-yellow-800">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                    running
                  </span>
                )}
              </div>

              <div className="space-y-1 mb-4">
                <p className="text-xs font-mono text-gray-500">
                  {company.jobCount} jobs
                </p>
                <p className="text-xs font-mono text-gray-400">
                  {company.lastScraped
                    ? `Last scraped: ${new Date(company.lastScraped).toLocaleDateString()}`
                    : 'Never scraped'}
                </p>
                <a
                  href={company.careersUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-yellow-600 hover:text-yellow-800 underline"
                >
                  Careers page
                </a>
              </div>

              <button
                onClick={() => handleScrape(company.id)}
                disabled={disabled}
                className={`w-full py-2 px-3 rounded-md text-sm font-mono font-medium transition-colors ${
                  disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isStarting
                  ? 'Starting...'
                  : isScraping
                    ? 'Scraping...'
                    : 'Run Scrape'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
