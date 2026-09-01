import Link from "next/link";
import { JobListItem } from "@/lib/types";
import { SaveJobButton } from "./job/SaveJobButton";
import { getPostedLabel } from "@/lib/jobs/dates";
import { formatSalary } from "@/lib/salary";
import { Badge } from "@/components/ui/Badge";

interface JobCardProps {
  job: JobListItem;
  hideCategory?: boolean;
  isAuthenticated?: boolean;
  initialSaved?: boolean;
  description?: string;
}

function getCompanyInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const CATEGORY_LABELS: Record<string, string> = {
  operations: "Operations",
  engineering: "Engineering",
  maintenance: "Maintenance",
  "health-physics": "Health Physics",
  security: "Security",
  training: "Training & Licensing",
  administrative: "Administrative",
  other: "Other",
};

export function JobCard({
  job,
  hideCategory = false,
  isAuthenticated = false,
  initialSaved = false,
  description,
}: JobCardProps) {
  const categoryLabel = CATEGORY_LABELS[job.category] || job.category;
  const isEmployerJob = job.isEmployerJob;
  const isFeatured =
    job.is_featured &&
    job.featured_until &&
    new Date(job.featured_until) > new Date();
  const showCategory = !hideCategory && job.category !== "other";
  const salaryLabel = formatSalary(job.salary);
  const contextLabel = showCategory ? categoryLabel : job.employment_type || null;

  return (
    <article
      className={`relative border-b border-rule bg-canvas px-4 py-5 last:border-b-0 transition-colors duration-150 hover:bg-surface ${
        isFeatured ? "border-l-2 border-l-signal" : ""
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center border ${
            isEmployerJob
              ? "border-signal bg-signal/20"
              : "border-rule bg-surface"
          }`}
          aria-hidden="true"
        >
          <span className="font-mono text-xs font-bold text-ink">
            {getCompanyInitials(job.company.name)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-sans text-base font-semibold tracking-tight text-ink">
                <Link
                  href={`/job/${job.slug}`}
                  className="after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {job.title}
                </Link>
              </h3>
              <p className="mt-1 font-sans text-sm text-secondary">
                {job.company.name}
                <span aria-hidden="true"> · </span>
                {job.location}
              </p>
            </div>

            <SaveJobButton
              jobSlug={job.slug}
              jobId={job.id}
              isAuthenticated={isAuthenticated}
              initialSaved={initialSaved}
            />
          </div>

          <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-secondary">
            {isFeatured && (
              <div>
                <Badge tone="featured">Featured</Badge>
              </div>
            )}
            {isEmployerJob && !isFeatured && (
              <div>
                <Badge tone="featured">Direct employer</Badge>
              </div>
            )}
            {salaryLabel && (
              <div>
                <dt className="sr-only">Salary</dt>
                <dd className="font-semibold text-ink">{salaryLabel}</dd>
              </div>
            )}
            {contextLabel && (
              <div>
                <dt className="sr-only">Field</dt>
                <dd>{contextLabel}</dd>
              </div>
            )}
            <div>
              <dt className="sr-only">Posted</dt>
              <dd suppressHydrationWarning>{getPostedLabel(job.scraped_at)}</dd>
            </div>
          </dl>

          {description && (
            <p className="mt-2 font-sans text-sm leading-relaxed text-secondary line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function JobCardCompact({ job }: JobCardProps) {
  return (
    <article className="relative border-b border-rule px-4 py-3 last:border-b-0 transition-colors duration-150 hover:bg-surface">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-sans text-sm font-semibold tracking-tight text-ink">
            <Link
              href={`/job/${job.slug}`}
              className="after:absolute after:inset-0"
            >
              {job.title}
            </Link>
          </h3>
          <p className="mt-0.5 truncate font-sans text-sm text-secondary">
            {job.company.name} · {job.location}
          </p>
        </div>
        <span
          className="shrink-0 font-mono text-xs text-secondary"
          suppressHydrationWarning
        >
          {getPostedLabel(job.scraped_at)}
        </span>
      </div>
    </article>
  );
}
