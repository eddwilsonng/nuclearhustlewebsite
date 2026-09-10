import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { JobRowMenu } from "./JobActions";
import { FeaturedSuccessBanner } from "./FeaturedSuccessBanner";
import { getApplicationCountsByJob } from "@/lib/data/applications";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  DashboardBody,
  DashboardEmptyState,
  DashboardPageHeader,
} from "@/components/dashboard/DashboardChrome";
import { cn } from "@/lib/cn";
import type { EmployerProfile, EmployerJob } from "@/lib/types";

const EXPIRY_SOON_DAYS = 7;

function getExpiryState(expiresAt: string | null): {
  label: string;
  expired: boolean;
  soon: boolean;
} | null {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) return { label: "Expired", expired: true, soon: false };
  if (days <= EXPIRY_SOON_DAYS)
    return { label: `${days}d left`, expired: false, soon: true };
  return {
    label: new Date(expiresAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    expired: false,
    soon: false,
  };
}

const thClass =
  "px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-widest text-secondary first:pl-5 last:pr-5";
const tdClass = "px-3 py-2.5 align-middle first:pl-5 last:pr-5";

export const metadata = {
  title: "Jobs - Nuclear Hustle",
};

export default async function ManageJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ featured?: string }>;
}) {
  const params = await searchParams;
  const showFeaturedSuccess = params.featured === "success";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "job_seeker" && !isAdmin(user.email)) {
    redirect("/dashboard");
  }

  const { data: employerProfile } = await supabase
    .from("employer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!employerProfile) {
    return (
      <>
        <DashboardPageHeader title="Jobs" />
        <DashboardEmptyState
          title="No company profile yet"
          description="Finish company setup before posting jobs."
          action={
            <LinkButton href="/dashboard/profile" variant="primary" size="compact">
              Company profile
            </LinkButton>
          }
        />
      </>
    );
  }

  const typedEmployerProfile = employerProfile as EmployerProfile;

  const { data: jobs } = await supabase
    .from("employer_jobs")
    .select("*")
    .eq("employer_id", typedEmployerProfile.id)
    .order("created_at", { ascending: false });

  const typedJobs = (jobs || []) as EmployerJob[];
  const applicationCounts = await getApplicationCountsByJob();

  return (
    <>
      <DashboardPageHeader
        title="Jobs"
        description={
          typedJobs.length > 0
            ? `${typedJobs.length} posting${typedJobs.length === 1 ? "" : "s"}`
            : undefined
        }
        action={
          <LinkButton href="/dashboard/jobs/new" variant="primary" size="compact">
            New job
          </LinkButton>
        }
      />

      {showFeaturedSuccess && (
        <DashboardBody className="pb-0">
          <FeaturedSuccessBanner />
        </DashboardBody>
      )}

      {typedJobs.length === 0 ? (
        <DashboardEmptyState
          title="No jobs yet"
          description="Publish a listing to reach operators, engineers, and plant crews."
          action={
            <LinkButton href="/dashboard/jobs/new" variant="primary" size="compact">
              New job
            </LinkButton>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-b border-rule text-sm">
            <thead className="border-b border-rule">
              <tr>
                <th className={thClass}>Role</th>
                <th className={cn(thClass, "hidden sm:table-cell")}>Location</th>
                <th className={thClass}>Status</th>
                <th className={cn(thClass, "hidden md:table-cell")}>Expires</th>
                <th className={cn(thClass, "hidden lg:table-cell text-right")}>Views</th>
                <th className={cn(thClass, "text-right")}>Apps</th>
                <th className={thClass}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {typedJobs.map((job) => {
                const appCount = applicationCounts[job.id];
                const expiry = getExpiryState(job.expires_at);
                const featuredLive =
                  job.is_featured &&
                  job.featured_until &&
                  new Date(job.featured_until) > new Date();

                return (
                  <tr key={job.id} className="border-b border-rule last:border-0 hover:bg-surface">
                    <td className={tdClass}>
                      <Link
                        href={`/dashboard/jobs/${job.id}/edit`}
                        className="font-medium text-ink hover:underline"
                      >
                        {job.title}
                      </Link>
                    </td>
                    <td className={cn(tdClass, "hidden text-secondary sm:table-cell")}>
                      {job.location}
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={job.is_active ? "success" : "neutral"}>
                          {job.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {featuredLive ? <Badge tone="featured">Featured</Badge> : null}
                      </div>
                    </td>
                    <td
                      className={cn(
                        tdClass,
                        "hidden font-mono text-xs md:table-cell",
                        expiry?.expired
                          ? "text-danger"
                          : expiry?.soon
                            ? "text-ink"
                            : "text-secondary",
                      )}
                    >
                      {expiry?.label ?? "—"}
                    </td>
                    <td className={cn(tdClass, "hidden text-right font-mono text-xs text-secondary lg:table-cell")}>
                      {job.view_count}
                    </td>
                    <td className={cn(tdClass, "text-right font-mono text-xs")}>
                      <Link
                        href={`/dashboard/jobs/${job.id}/applications`}
                        className="text-secondary hover:text-ink hover:underline"
                      >
                        {appCount?.total ?? 0}
                        {appCount?.new ? (
                          <span className="text-ink"> · {appCount.new}</span>
                        ) : null}
                      </Link>
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/jobs/${job.id}/edit`}
                          className="inline-flex min-h-9 items-center px-2 text-sm text-secondary hover:text-ink"
                        >
                          Edit
                        </Link>
                        <JobRowMenu
                          jobId={job.id}
                          slug={job.slug}
                          isActive={job.is_active}
                          isFeatured={job.is_featured}
                          featuredUntil={job.featured_until}
                          expired={!!expiry?.expired}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
