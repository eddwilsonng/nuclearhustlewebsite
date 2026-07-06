'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  adminDeleteJob,
  adminToggleJob,
  adminDeleteScrapedJob,
} from '@/lib/admin/actions';

interface AdminJob {
  id: string;
  title: string;
  company: string;
  location: string;
  category: string;
  date: string;
  source: 'scraped' | 'employer';
  isActive?: boolean;
  slug: string;
}

interface AdminJobTableProps {
  jobs: AdminJob[];
}

export function AdminJobTable({ jobs }: AdminJobTableProps) {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'scraped' | 'employer'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [toggledJobs, setToggledJobs] = useState<Map<string, boolean>>(new Map());
  const [isPending, startTransition] = useTransition();

  const filtered = jobs.filter((job) => {
    if (removedIds.has(`${job.source}-${job.id}`)) return false;
    if (sourceFilter !== 'all' && job.source !== sourceFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q)
    );
  });

  function handleDelete(job: AdminJob) {
    if (!confirm('Permanently delete this job posting?')) return;
    const compositeId = `${job.source}-${job.id}`;
    setDeletingId(compositeId);
    startTransition(async () => {
      const result =
        job.source === 'employer'
          ? await adminDeleteJob(job.id)
          : await adminDeleteScrapedJob(job.id);

      if (result.success) {
        setRemovedIds((prev) => new Set(prev).add(compositeId));
      } else {
        alert(result.error || 'Failed to delete');
      }
      setDeletingId(null);
    });
  }

  function handleToggle(jobId: string, currentlyActive: boolean) {
    setTogglingId(jobId);
    startTransition(async () => {
      const result = await adminToggleJob(jobId, !currentlyActive);
      if (result.success) {
        setToggledJobs((prev) => new Map(prev).set(jobId, !currentlyActive));
      } else {
        alert(result.error || 'Failed to toggle');
      }
      setTogglingId(null);
    });
  }

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-[#CFC8BC] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
        />
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
          className="px-3 py-2 border border-[#CFC8BC] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
        >
          <option value="all">All Sources</option>
          <option value="scraped">Scraped</option>
          <option value="employer">Employer</option>
        </select>
      </div>

      <p className="text-xs font-mono text-stone-400 mb-3">
        {filtered.length} job{filtered.length !== 1 ? 's' : ''}
      </p>

      <div className="border border-[#CFC8BC] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#E5DFD5] border-b border-[#CFC8BC]">
              <th className="text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-stone-500">
                Title
              </th>
              <th className="text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-stone-500">
                Company
              </th>
              <th className="text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-stone-500 hidden md:table-cell">
                Location
              </th>
              <th className="text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-stone-500 hidden lg:table-cell">
                Source
              </th>
              <th className="text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-stone-500 hidden lg:table-cell">
                Date
              </th>
              <th className="text-right px-4 py-3 font-mono text-xs tracking-widest uppercase text-stone-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#CFC8BC]">
            {filtered.map((job) => {
              const compositeId = `${job.source}-${job.id}`;
              const active = toggledJobs.has(job.id)
                ? toggledJobs.get(job.id)
                : job.isActive;

              const editHref =
                job.source === 'employer'
                  ? `/dashboard/admin/jobs/${job.id}/edit`
                  : `/dashboard/admin/jobs/scraped/${job.id}/edit`;

              return (
                <tr key={compositeId} className="hover:bg-[#E5DFD5]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/job/${job.slug}`}
                      className="text-stone-900 hover:text-yellow-500 font-medium"
                    >
                      {job.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-500">{job.company}</td>
                  <td className="px-4 py-3 text-stone-500 hidden md:table-cell">
                    {job.location}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-mono ${
                        job.source === 'employer'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-[#E5DFD5] text-stone-500'
                      }`}
                    >
                      {job.source}
                    </span>
                    {job.source === 'employer' && (
                      <span
                        className={`ml-1 inline-flex items-center px-2 py-0.5 text-xs font-mono ${
                          active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {active ? 'active' : 'inactive'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-500 font-mono text-xs hidden lg:table-cell">
                    {new Date(job.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {job.source === 'employer' && (
                        <button
                          onClick={() => handleToggle(job.id, !!active)}
                          disabled={isPending && togglingId === job.id}
                          className="text-xs font-mono text-stone-500 hover:text-stone-900 disabled:opacity-50"
                        >
                          {togglingId === job.id
                            ? '...'
                            : active
                              ? 'Deactivate'
                              : 'Activate'}
                        </button>
                      )}
                      <Link
                        href={editHref}
                        className="text-xs font-mono text-yellow-600 hover:text-yellow-800"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(job)}
                        disabled={isPending && deletingId === compositeId}
                        className="text-xs font-mono text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingId === compositeId ? '...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-400 font-mono text-sm">
                  No jobs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
