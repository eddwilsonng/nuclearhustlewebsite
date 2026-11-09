'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { DashboardAlert } from '@/components/dashboard/DashboardChrome';

interface CompanyCard {
  id: string;
  name: string;
  careersUrl: string;
  /** Already formatted for display. */
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

async function fetchScrapeStatus(): Promise<ScrapeStatus | null> {
  try {
    const res = await fetch('/api/admin/scrape/status');
    return res.ok ? ((await res.json()) as ScrapeStatus) : null;
  } catch {
    return null;
  }
}

export function ScrapePanel({ companies }: ScrapePanelProps) {
  const toast = useToast();
  const [status, setStatus] = useState<ScrapeStatus | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  const isRunning = status?.status === 'running';

  // Load the current status, then poll every 2s while a scrape is running.
  useEffect(() => {
    let cancelled = false;
    const apply = (next: ScrapeStatus | null) => {
      if (!cancelled && next) setStatus(next);
    };
    fetchScrapeStatus().then(apply);
    const interval = isRunning ? setInterval(() => fetchScrapeStatus().then(apply), 2000) : undefined;
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  async function handleScrape(company: CompanyCard) {
    setStarting(company.id);
    setStartError(null);
    let problem: string | null = null;
    try {
      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        problem = data.error || `The ${company.name} scrape didn't start.`;
      }
    } catch {
      problem = `The ${company.name} scrape didn't start. Check your connection and try again.`;
    }
    setStarting(null);

    if (problem) {
      setStartError(problem);
      toast.error("Scrape didn't start", problem);
      return;
    }

    toast.success(`Started the ${company.name} scrape.`);
    setTimeout(() => {
      fetchScrapeStatus().then((next) => {
        if (next) setStatus(next);
      });
    }, 1000);
  }

  const lastResult =
    status?.status === 'done' || status?.status === 'error' ? status : null;

  return (
    <div>
      <div className="mb-6 space-y-3 empty:hidden">
        {startError ? <DashboardAlert tone="error">{startError}</DashboardAlert> : null}
        {isRunning ? (
          <p role="status" className="border border-control bg-raised px-3 py-2.5 font-sans text-sm text-ink">
            Scraping {status.companyName}…{' '}
            <span className="font-mono text-xs text-secondary">
              {status.phase} · {status.jobsFound} jobs found
            </span>
          </p>
        ) : lastResult?.status === 'done' ? (
          <DashboardAlert tone="success">
            {lastResult.companyName} scrape complete: {lastResult.jobsFound} found · {lastResult.newJobs} new ·{' '}
            {lastResult.updatedJobs} updated
            {lastResult.completedAt
              ? ` · ${new Date(lastResult.completedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
              : ''}
          </DashboardAlert>
        ) : lastResult?.status === 'error' ? (
          <DashboardAlert tone="error">
            {lastResult.companyName} scrape failed: {lastResult.error || 'no details recorded'}
          </DashboardAlert>
        ) : null}
      </div>

      <ul className="divide-y divide-rule border-y border-rule" aria-label="Operators">
        {companies.map((company) => {
          const isScraping = isRunning && status?.company === company.id;
          const isStarting = starting === company.id;

          return (
            <li
              key={company.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-sans text-sm font-semibold text-ink">{company.name}</h2>
                  {isScraping ? <Badge className="border-ink text-ink">Running</Badge> : null}
                </div>
                <p className="mt-0.5 font-mono text-xs text-secondary">
                  {company.jobCount.toLocaleString('en-US')} jobs ·{' '}
                  {company.lastScraped ? `Last scraped ${company.lastScraped}` : 'Never scraped'}
                  {company.careersUrl ? (
                    <>
                      {' · '}
                      <a
                        href={company.careersUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-ink"
                      >
                        Careers page<span className="sr-only"> for {company.name} (opens in a new tab)</span>
                      </a>
                    </>
                  ) : null}
                </p>
              </div>

              <Button
                size="compact"
                onClick={() => handleScrape(company)}
                disabled={isRunning || isStarting}
                aria-label={`Run the ${company.name} scrape`}
              >
                {isStarting ? 'Starting…' : isScraping ? 'Scraping…' : 'Run scrape'}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
