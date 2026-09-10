import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import {
  JobStatusToggle,
  DeleteJobButton,
  FeatureJobButton,
  RenewJobButton,
} from "./JobActions";
import { FeaturedSuccessBanner } from "./FeaturedSuccessBanner";
import { getApplicationCountsByJob } from "@/lib/data/applications";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  DashboardEmptyState,
  DashboardPageHeader,
} from "@/components/dashboard/DashboardChrome";
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
    return { label: `Expires in ${days}d`, expired: false, soon: true };
  return {
    label: `Expires ${new Date(expiresAt).toLocaleDateString()}`,
    expired: false,
    soon: false,
  };
}

export const metadata = {
  title: "Manage Jobs - Nuclear Hustle",
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
      <div className="max-w-4xl">
        <DashboardPageHeader eyebrow="Employer" title="Job postings" />
        <DashboardEmptyState
          title="No company profile yet"
          description="Finish company setup before posting jobs."
          action={
            <LinkButton href="/dashboard/profile" variant="primary">
              Company profile
            </LinkButton>
          }
        />
      </div>
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
    <div className="max-w-4xl">
      {showFeaturedSuccess && <FeaturedSuccessBanner />}
      <DashboardPageHeader
        eyebrow="Employer"
        title="Job postings"
        action={
          <LinkButton href="/dashboard/jobs/new" variant="primary">
            Post a job
          </LinkButton>
        }
      />

      {typedJobs.length === 0 ? (
        <DashboardEmptyState
          title="No jobs posted yet"
          description="Publish a listing to reach operators, engineers, and plant crews."
          action={
            <LinkButton href="/dashboard/jobs/new" variant="primary">
              Post your first job
            </LinkButton>
          }
        />
      ) : (
        <div className="border border-rule bg-raised divide-y divide-rule">
          {typedJobs.map((job) => {
            const appCount = applicationCounts[job.id];
            const expiry = getExpiryState(job.expires_at);
            return (
              <div key={job.id} className="p-4 md:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-sans text-base font-semibold text-ink truncate">
                        {job.title}
                      </h2>
                      <Badge tone={job.is_active ? "success" : "neutral"}>
                        {job.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {expiry && (
                        <Badge
                          tone={
                            expiry.expired
                              ? "danger"
                              : expiry.soon
                                ? "featured"
                                : "neutral"
                          }
                        >
                          {expiry.label}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 font-sans text-sm text-secondary">{job.location}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-secondary">
                      <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                      <span aria-hidden="true">·</span>
                      <span>{job.view_count} views</span>
                      <span aria-hidden="true">·</span>
                      <LinkButton
                        href={`/dashboard/jobs/${job.id}/applications`}
                        variant="quiet"
                        size="compact"
                        className="min-h-0 px-0"
                      >
                        {appCount?.total ?? 0} application
                        {(appCount?.total ?? 0) === 1 ? "" : "s"}
                        {appCount?.new ? ` · ${appCount.new} new` : ""}
                      </LinkButton>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    {expiry?.expired && <RenewJobButton jobId={job.id} />}
                    <FeatureJobButton
                      jobId={job.id}
                      isFeatured={job.is_featured}
                      featuredUntil={job.featured_until}
                    />
                    <JobStatusToggle jobId={job.id} isActive={job.is_active} />
                    <LinkButton
                      href={`/dashboard/jobs/${job.id}/applications`}
                      variant="quiet"
                      size="compact"
                    >
                      Applicants
                    </LinkButton>
                    <LinkButton
                      href={`/dashboard/jobs/${job.id}/edit`}
                      variant="quiet"
                      size="compact"
                    >
                      Edit
                    </LinkButton>
                    <LinkButton
                      href={`/job/${job.slug}`}
                      target="_blank"
                      variant="quiet"
                      size="compact"
                    >
                      View
                    </LinkButton>
                    <DeleteJobButton jobId={job.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
