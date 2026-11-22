import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAccountContext } from "@/lib/account";
import { getApplicationCountsByJob } from "@/lib/data/applications";
import { formatShortDate, getListingStatus } from "@/lib/jobs/listingStatus";
import { JobRowMenu } from "./JobActions";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  DashboardAlert,
  DashboardBody,
  DashboardEmptyState,
  DashboardPageHeader,
} from "@/components/dashboard/DashboardChrome";
import type { EmployerJob } from "@/lib/types";

export const metadata = {
  title: "Jobs - Nuclear Hustle",
};

const STATUS_TONE = { live: "success", paused: "neutral", expired: "danger" } as const;

export default async function ManageJobsPage() {
  const account = await getAccountContext();
  if (!account?.profile) return null;
  if (account.role !== "employer") redirect("/dashboard");
  if (!account.employer) redirect("/onboarding/company?redirect=/dashboard/jobs");

  const supabase = await createClient();
  const { data: jobs, error } = await supabase
    .from("employer_jobs")
    .select("*")
    .eq("employer_id", account.employer.id)
    .order("created_at", { ascending: false });

  const typedJobs = (jobs || []) as EmployerJob[];
  const applicationCounts = await getApplicationCountsByJob();
  const now = new Date();
  const liveCount = typedJobs.filter((job) => getListingStatus(job, now).key === "live").length;

  return (
    <>
      <DashboardPageHeader
        title="Jobs"
        description={
          typedJobs.length > 0
            ? `${liveCount} live · ${typedJobs.length} posted`
            : "Listings stay up for 60 days and can be renewed."
        }
        action={
          <LinkButton href="/dashboard/jobs/new" variant="primary" size="compact">
            Post a job
          </LinkButton>
        }
      />

      <DashboardBody>
        {error ? (
          <DashboardAlert tone="error">We couldn&apos;t load your listings. Refresh to try again.</DashboardAlert>
        ) : typedJobs.length === 0 ? (
          <DashboardEmptyState
            title="No listings yet"
            description="Posting is free. Listings reach operators, engineers and plant crews, and applications arrive with a CV."
            action={
              <LinkButton href="/dashboard/jobs/new" variant="secondary" size="compact">
                Post a job
              </LinkButton>
            }
          />
        ) : (
          <ul className="divide-y divide-rule border-y border-rule" aria-label="Your listings">
            {typedJobs.map((job) => {
              const counts = applicationCounts[job.id];
              const status = getListingStatus(job, now);
              const canRenew = status.key === "expired" || status.expiringSoon;

              return (
                <li
                  key={job.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 py-4 md:grid-cols-[minmax(0,1fr)_9rem_9rem_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/jobs/${job.id}/applications`}
                      className="font-sans text-sm font-semibold text-ink hover:underline"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-0.5 font-sans text-sm text-secondary">{job.location}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge tone={STATUS_TONE[status.key]}>{status.label}</Badge>
                      {status.featuredUntil ? (
                        <Badge tone="featured">Featured until {formatShortDate(status.featuredUntil)}</Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="col-start-2 row-start-1 flex items-start justify-end md:col-start-4">
                    <JobRowMenu
                      jobId={job.id}
                      slug={job.slug}
                      title={job.title}
                      isActive={job.is_active}
                      featuredLive={Boolean(status.featuredUntil)}
                      canRenew={canRenew}
                      expired={status.key === "expired"}
                    />
                  </div>

                  <p className="col-span-2 font-mono text-xs text-secondary md:col-span-1 md:col-start-2 md:row-start-1">
                    {status.key === "expired"
                      ? `Expired ${job.expires_at ? formatShortDate(job.expires_at) : ""}`
                      : job.expires_at
                        ? (
                            <span className={status.expiringSoon ? "text-ink" : undefined}>
                              {status.expiringSoon
                                ? `Expires in ${status.daysLeft} day${status.daysLeft === 1 ? "" : "s"}`
                                : `Expires ${formatShortDate(job.expires_at)}`}
                            </span>
                          )
                        : "No expiry"}
                    <span className="block">{job.view_count.toLocaleString("en-US")} views</span>
                  </p>

                  <p className="col-span-2 font-mono text-xs md:col-span-1 md:col-start-3 md:row-start-1">
                    <Link
                      href={`/dashboard/jobs/${job.id}/applications`}
                      className="inline-flex min-h-10 flex-col justify-center text-secondary hover:text-ink md:min-h-0"
                    >
                      <span>
                        {counts?.total ?? 0} application{counts?.total === 1 ? "" : "s"}
                      </span>
                      {counts?.new ? <span className="text-ink">{counts.new} new</span> : null}
                    </Link>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </DashboardBody>
    </>
  );
}
