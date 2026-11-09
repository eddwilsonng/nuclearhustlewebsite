import Link from "next/link";
import type { MyApplication } from "@/lib/data/applications";
import { formatShortDate } from "@/lib/jobs/listingStatus";
import { LinkButton } from "@/components/ui/LinkButton";
import { DashboardEmptyState } from "./DashboardChrome";

/**
 * A job seeker's applications. The status is deliberately coarse: "Sent" or
 * "Reviewed by employer". Shortlist and rejection stages stay the employer's.
 */
export function MyApplicationsList({ applications }: { applications: MyApplication[] }) {
  if (applications.length === 0) {
    return (
      <DashboardEmptyState
        title="No applications yet"
        description="Applications you send while logged in appear here, along with whether the employer has reviewed them."
        action={
          <LinkButton href="/jobs" variant="secondary" size="compact">
            Find a role
          </LinkButton>
        }
      />
    );
  }

  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {applications.map((application) => (
        <li key={application.id} className="relative flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
          <div className="min-w-0 flex-1">
            {application.job ? (
              application.job.open ? (
                <Link
                  href={`/job/${application.job.slug}`}
                  className="font-sans text-sm font-semibold text-ink after:absolute after:inset-0 hover:underline"
                >
                  {application.job.title}
                </Link>
              ) : (
                <p className="font-sans text-sm font-semibold text-ink">{application.job.title}</p>
              )
            ) : (
              <p className="font-sans text-sm font-semibold text-ink">Listing removed</p>
            )}
            <p className="font-sans text-sm text-secondary">
              {application.job?.company ?? "Employer"} · Sent {formatShortDate(application.created_at)}
              {application.job && !application.job.open ? " · Listing closed" : ""}
            </p>
          </div>
          <p className="font-mono text-xs text-secondary">
            {application.seen ? (
              <span className="text-ink">Reviewed by employer</span>
            ) : (
              "Sent"
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}
