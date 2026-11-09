'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu } from '@base-ui/react/menu';
import {
  adminDeleteJob,
  adminToggleJob,
  adminDeleteScrapedJob,
} from '@/lib/admin/actions';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Dialog';
import { FieldError, FormStatus, SelectField, TextField } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { DashboardEmptyState } from '@/components/dashboard/DashboardChrome';

export interface AdminJob {
  id: string;
  title: string;
  company: string;
  location: string;
  source: 'scraped' | 'employer';
  /** ISO timestamp, for sorting. */
  date: string;
  dateLabel: string;
  statusKey: 'live' | 'paused' | 'expired' | 'pending_review' | 'rejected' | 'duplicate';
  statusLabel: string;
  statusTone: 'success' | 'neutral' | 'danger';
  /** Employer listings that haven't expired can be paused or made live again. */
  toggle?: { isActive: boolean };
  /** Set only when the public job page actually serves this listing. */
  publicHref: string | null;
  editHref: string;
}

interface AdminJobTableProps {
  jobs: AdminJob[];
}

const PAGE_SIZE = 50;

const STATUS_FILTERS: { value: 'all' | AdminJob['statusKey']; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'live', label: 'Live' },
  { value: 'pending_review', label: 'Pending review' },
  { value: 'paused', label: 'Paused' },
  { value: 'expired', label: 'Expired' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'duplicate', label: 'Duplicate' },
];

const menuItemClass =
  'flex min-h-10 w-full cursor-pointer items-center px-3 py-2 text-left font-sans text-sm text-ink no-underline outline-none data-highlighted:bg-surface data-disabled:opacity-50';

type ActionResult = { success?: boolean; error?: string };

/** Runs an admin action; returns an error message, or null when it worked. */
async function attempt(action: () => Promise<ActionResult>): Promise<string | null> {
  try {
    const result = await action();
    if (result.error) return result.error;
    return result.success ? null : 'Something went wrong. Refresh and try again.';
  } catch {
    return "That didn't go through. Refresh and try again.";
  }
}

function deleteDescription(job: AdminJob) {
  return job.source === 'employer'
    ? `“${job.title}” at ${job.company} comes off the board and its applications are deleted. This can't be undone. Pausing it keeps them.`
    : `“${job.title}” at ${job.company} is removed from the scraped job file and comes off the board. This can't be undone.`;
}

export function AdminJobTable({ jobs }: AdminJobTableProps) {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | AdminJob['source']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminJob['statusKey']>('all');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminJob | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const keyOf = (job: AdminJob) => `${job.source}-${job.id}`;
  const query = search.trim().toLowerCase();

  const filtered = jobs.filter((job) => {
    if (removedIds.has(keyOf(job))) return false;
    if (sourceFilter !== 'all' && job.source !== sourceFilter) return false;
    if (statusFilter !== 'all' && job.statusKey !== statusFilter) return false;
    if (!query) return true;
    return (
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query)
    );
  });
  const shown = filtered.slice(0, visible);

  function handleToggle(job: AdminJob) {
    if (!job.toggle) return;
    const makeLive = !job.toggle.isActive;
    setBusyId(keyOf(job));
    startTransition(async () => {
      const problem = await attempt(() => adminToggleJob(job.id, makeLive));
      setBusyId(null);
      if (problem) {
        toast.error("Couldn't change the listing", problem);
        return;
      }
      toast.success(makeLive ? `“${job.title}” is live again.` : `Paused “${job.title}”.`);
      router.refresh();
    });
  }

  function askDelete(job: AdminJob) {
    setDeleteTarget(job);
    setDeleteError(null);
    setDeleteOpen(true);
  }

  function confirmDelete() {
    const job = deleteTarget;
    if (!job) return;
    startTransition(async () => {
      const problem = await attempt(() =>
        job.source === 'employer' ? adminDeleteJob(job.id) : adminDeleteScrapedJob(job.id),
      );
      if (problem) {
        setDeleteError(problem);
        return;
      }
      setRemovedIds((prev) => new Set(prev).add(keyOf(job)));
      setDeleteOpen(false);
      toast.success(`Deleted “${job.title}”.`);
      router.refresh();
    });
  }

  function clearFilters() {
    setSearch('');
    setSourceFilter('all');
    setStatusFilter('all');
    setVisible(PAGE_SIZE);
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_11rem_11rem]">
        <TextField
          id="admin-job-search"
          label="Search"
          type="search"
          placeholder="Title, company or location"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setVisible(PAGE_SIZE);
          }}
        />
        <SelectField
          id="admin-job-source"
          label="Source"
          value={sourceFilter}
          onChange={(e) => {
            setSourceFilter(e.target.value as typeof sourceFilter);
            setVisible(PAGE_SIZE);
          }}
        >
          <option value="all">All sources</option>
          <option value="employer">Employer</option>
          <option value="scraped">Scraped</option>
        </SelectField>
        <SelectField
          id="admin-job-status"
          label="Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            setVisible(PAGE_SIZE);
          }}
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
      </div>

      <FormStatus className="mt-4 font-mono text-xs">
        {filtered.length === shown.length
          ? `${filtered.length.toLocaleString('en-US')} job${filtered.length === 1 ? '' : 's'}`
          : `Showing ${shown.length.toLocaleString('en-US')} of ${filtered.length.toLocaleString('en-US')} jobs`}
      </FormStatus>

      {filtered.length === 0 ? (
        <DashboardEmptyState
          className="mt-3"
          title="No jobs match"
          description="Try a different search, source or status."
          action={
            <Button size="compact" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <ul className="mt-3 divide-y divide-rule border-y border-rule" aria-label="Jobs">
          {shown.map((job) => {
            const busy = isPending && busyId === keyOf(job);
            return (
              <li
                key={keyOf(job)}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 py-4 md:grid-cols-[minmax(0,1fr)_12rem_7.5rem_auto] md:items-center"
              >
                <div className="min-w-0">
                  <Link
                    href={job.editHref}
                    className="font-sans text-sm font-semibold text-ink hover:underline"
                  >
                    {job.title}
                  </Link>
                  <p className="mt-0.5 font-sans text-sm text-secondary">
                    {job.company} · {job.location}
                  </p>
                </div>

                <div className="col-start-2 row-start-1 flex items-start justify-end md:col-start-4">
                  <Menu.Root>
                    <Menu.Trigger
                      aria-label={`Actions for ${job.title}`}
                      className="inline-flex min-h-10 items-center px-2 font-sans text-sm text-secondary hover:text-ink"
                    >
                      {busy ? 'Working…' : 'More'}
                    </Menu.Trigger>
                    <Menu.Portal>
                      <Menu.Positioner sideOffset={4} align="end" className="z-50">
                        <Menu.Popup className="card-raised min-w-48 border border-control bg-raised py-1 outline-none">
                          <Menu.Item render={<Link href={job.editHref} className={menuItemClass} />}>
                            Edit
                          </Menu.Item>
                          {job.toggle && (
                            <Menu.Item
                              disabled={isPending}
                              className={menuItemClass}
                              onClick={() => handleToggle(job)}
                            >
                              {job.toggle.isActive ? 'Pause listing' : 'Make live again'}
                            </Menu.Item>
                          )}
                          {job.publicHref && (
                            <Menu.Item
                              render={
                                <a
                                  href={job.publicHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={menuItemClass}
                                />
                              }
                            >
                              View public listing
                            </Menu.Item>
                          )}
                          <Menu.Item
                            className={`${menuItemClass} text-danger`}
                            onClick={() => askDelete(job)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.Root>
                </div>

                <div className="col-span-2 flex flex-wrap items-center gap-1.5 md:col-span-1 md:col-start-2 md:row-start-1">
                  <Badge>{job.source === 'employer' ? 'Employer' : 'Scraped'}</Badge>
                  <Badge tone={job.statusTone}>{job.statusLabel}</Badge>
                </div>

                <p className="col-span-2 font-mono text-xs text-secondary md:col-span-1 md:col-start-3 md:row-start-1">
                  {job.dateLabel}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {shown.length < filtered.length ? (
        <div className="mt-4 flex justify-center">
          <Button size="compact" onClick={() => setVisible((n) => n + PAGE_SIZE)}>
            Show {Math.min(PAGE_SIZE, filtered.length - shown.length)} more
          </Button>
        </div>
      ) : null}

      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this listing?"
        description={deleteTarget ? deleteDescription(deleteTarget) : undefined}
      >
        <div className="space-y-4">
          {deleteError ? <FieldError>{deleteError}</FieldError> : null}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={isPending} onClick={confirmDelete}>
              {isPending ? 'Deleting…' : 'Delete listing'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
