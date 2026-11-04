import Link from "next/link";
import { StatusSelect } from "@/app/dashboard/jobs/[id]/applications/ApplicationActions";
import { formatShortDate } from "@/lib/jobs/listingStatus";
import type { ApplicationStatus, JobApplication } from "@/lib/types";

type Row = JobApplication & { job?: { id: string; title: string } };

/**
 * Applications as stacked rows rather than a wide table, so name, status and
 * CV all fit on a phone. Opening the CV marks a New application Reviewed.
 */
export function ApplicantList({ applications, showJob = false }: { applications: Row[]; showJob?: boolean }) {
  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {applications.map((app) => (
        <li key={app.id} className="py-4">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <p className="font-sans text-sm font-semibold text-ink">
                {app.applicant_name}
                {app.status === "new" ? (
                  <span className="ml-2 font-mono text-xs font-normal text-ink">New</span>
                ) : null}
              </p>
              <a
                href={`mailto:${app.applicant_email}`}
                className="inline-flex min-h-8 items-center font-sans text-sm text-secondary break-all hover:text-ink hover:underline"
              >
                {app.applicant_email}
              </a>
              <p className="font-mono text-xs text-secondary">
                Applied {formatShortDate(app.created_at)}
                {showJob && app.job ? (
                  <>
                    {" · "}
                    <Link href={`/dashboard/jobs/${app.job.id}/applications`} className="hover:text-ink hover:underline">
                      {app.job.title}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusSelect
                applicationId={app.id}
                status={app.status as ApplicationStatus}
                applicantName={app.applicant_name}
              />
              {app.cv_path ? (
                <a
                  href={`/dashboard/applications/${app.id}/cv`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center border border-control bg-raised px-3 font-sans text-sm font-semibold text-ink transition-[background-color,border-color] duration-150 hover:border-ink hover:bg-surface"
                >
                  Open CV
                </a>
              ) : (
                <span className="font-mono text-xs text-secondary">No CV attached</span>
              )}
            </div>
          </div>
          {app.message ? (
            <details className="mt-2">
              <summary className="inline-flex min-h-10 cursor-pointer items-center font-sans text-sm text-secondary underline underline-offset-2 hover:text-ink">
                Read cover letter
              </summary>
              <p className="mt-2 max-w-prose whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">
                {app.message}
              </p>
            </details>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

const FILTERS: { value?: ApplicationStatus; label: string }[] = [
  { label: "All" },
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
];

/** Link-based status filter: each view has its own URL. */
export function ApplicantFilter({
  basePath,
  current,
  counts,
}: {
  basePath: string;
  current?: ApplicationStatus;
  counts: Record<string, number>;
}) {
  return (
    <nav aria-label="Filter applications by status" className="mb-4 overflow-x-auto">
      <ul className="flex min-w-max gap-1 border-b border-rule">
        {FILTERS.map((filter) => {
          const active = filter.value === current;
          const count = filter.value ? (counts[filter.value] ?? 0) : counts.all ?? 0;
          return (
            <li key={filter.label}>
              <Link
                href={filter.value ? `${basePath}?status=${filter.value}` : basePath}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "-mb-px inline-flex min-h-11 items-center gap-1.5 border-b-2 border-ink px-3 font-sans text-sm font-medium text-ink"
                    : "-mb-px inline-flex min-h-11 items-center gap-1.5 border-b-2 border-transparent px-3 font-sans text-sm text-secondary hover:text-ink"
                }
              >
                {filter.label}
                <span className="font-mono text-xs text-secondary">{count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
