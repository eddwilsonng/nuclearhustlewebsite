import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAccountContext, type AccountContext } from "@/lib/account";
import { getApplicationCountsByJob, getMyApplications } from "@/lib/data/applications";
import { getAllJobs } from "@/lib/data/employer";
import { toJobListItem } from "@/lib/data/static";
import { isSubscribedToDigest } from "@/lib/email/subscription";
import { getCategoryInfo, type JobCategory } from "@/lib/categorize";
import { getStateByCode } from "@/lib/states";
import { formatShortDate, getListingStatus } from "@/lib/jobs/listingStatus";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { SetupChecklist } from "@/components/ui/SetupChecklist";
import { StatRow } from "@/components/ui/StatRow";
import { JobCard } from "@/components/JobCard";
import {
  DashboardAlert,
  DashboardBody,
  DashboardEmptyState,
  DashboardPageHeader,
  DashboardSection,
} from "@/components/dashboard/DashboardChrome";
import { MyApplicationsList } from "@/components/dashboard/MyApplicationsList";
import type { EmployerJob } from "@/lib/types";

export const metadata = {
  title: "Dashboard - Nuclear Hustle",
};

export default async function DashboardPage() {
  const account = await getAccountContext();
  if (!account?.profile) return null;

  return account.role === "employer" ? (
    <EmployerDashboard account={account} />
  ) : (
    <JobSeekerDashboard account={account} />
  );
}

async function JobSeekerDashboard({ account }: { account: AccountContext }) {
  const supabase = await createClient();
  const seeker = account.seeker;
  const firstName = account.profile!.full_name.split(" ")[0];

  const [{ data: savedRows }, applications, subscribed] = await Promise.all([
    supabase.from("saved_jobs").select("job_slug").eq("user_id", account.user.id),
    getMyApplications(),
    account.user.email ? isSubscribedToDigest(account.user.email) : Promise.resolve(false),
  ]);
  const savedSlugs = new Set((savedRows ?? []).map((row) => row.job_slug as string));

  const stateInfo = seeker?.state ? getStateByCode(seeker.state) : null;
  const category = (seeker?.primary_category as JobCategory | null) ?? null;
  const categoryInfo = category ? getCategoryInfo(category) : null;

  const allJobs = await getAllJobs();
  const matches = allJobs
    .filter((job) => (!stateInfo || job.state === stateInfo.slug) && (!category || job.category === category))
    .slice(0, 5)
    .map(toJobListItem);
  const matchHref =
    stateInfo && category
      ? `/jobs/${stateInfo.slug}/${category}`
      : stateInfo
        ? `/jobs/${stateInfo.slug}`
        : category
          ? `/jobs/role/${category}`
          : "/jobs";
  const matchTitle =
    categoryInfo && stateInfo
      ? `${categoryInfo.name} roles in ${stateInfo.name}`
      : categoryInfo
        ? `${categoryInfo.name} roles`
        : stateInfo
          ? `Roles in ${stateInfo.name}`
          : "Latest roles";

  const steps = [
    {
      id: "matching",
      label: "Choose your field and home state",
      description: "Your dashboard then shows new roles that fit first.",
      done: Boolean(category && stateInfo),
      href: "/dashboard/profile#matching",
      actionLabel: "Set field and state",
    },
    {
      id: "resume",
      label: "Add your resume",
      description: "Apply to listings on Nuclear Hustle without uploading it each time.",
      done: Boolean(seeker?.resume_url),
      href: "/dashboard/profile#resume",
      actionLabel: "Upload resume",
    },
    {
      id: "digest",
      label: "Get the Monday jobs email",
      description: "The roles that went live that week, grouped by region.",
      done: subscribed,
      href: "/dashboard/settings#email",
      actionLabel: "Turn it on",
    },
    {
      id: "save",
      label: "Save a job you want to come back to",
      done: savedSlugs.size > 0,
      href: matchHref,
      actionLabel: "Browse roles",
    },
  ];
  const setupDone = steps.every((step) => step.done);
  const viewed = applications?.filter((app) => app.seen).length ?? 0;

  return (
    <>
      <DashboardPageHeader
        title={`Hi, ${firstName}`}
        description={
          seeker?.is_actively_looking === false
            ? "Your profile is set to not looking."
            : "Roles that fit your field and state, and where your applications stand."
        }
        action={
          <LinkButton href={matchHref} variant="primary" size="compact">
            Browse jobs
          </LinkButton>
        }
      />
      <DashboardBody>
        {!setupDone ? <SetupChecklist title="Finish setting up" steps={steps} className="mb-8" /> : null}

        <StatRow
          className="mb-10"
          stats={[
            {
              label: "Applications",
              value: applications?.length ?? 0,
              detail: applications && applications.length > 0 ? `${viewed} reviewed by the employer` : undefined,
              href: "/dashboard/applications",
            },
            { label: "Saved jobs", value: savedSlugs.size, href: "/dashboard/saved" },
            {
              label: "Matching roles",
              value: allJobs.filter(
                (job) => (!stateInfo || job.state === stateInfo.slug) && (!category || job.category === category),
              ).length,
              href: matchHref,
            },
          ]}
        />

        <DashboardSection title={matchTitle} action={{ href: matchHref, label: "See all" }}>
          {matches.length > 0 ? (
            <div className="border-y border-rule">
              {matches.map((job) => (
                <JobCard key={job.id} job={job} isAuthenticated initialSaved={savedSlugs.has(job.slug)} />
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="No open roles match right now"
              description="New listings arrive most weekdays. Widen your field or state on your profile to see more."
              action={
                <LinkButton href="/dashboard/profile#matching" variant="secondary" size="compact">
                  Edit field and state
                </LinkButton>
              }
            />
          )}
        </DashboardSection>

        <DashboardSection
          title="Recent applications"
          action={applications && applications.length > 0 ? { href: "/dashboard/applications", label: "All applications" } : undefined}
        >
          {applications === null ? (
            <DashboardAlert tone="error">We couldn&apos;t load your applications. Refresh to try again.</DashboardAlert>
          ) : (
            <MyApplicationsList applications={applications.slice(0, 3)} />
          )}
        </DashboardSection>
      </DashboardBody>
    </>
  );
}

async function EmployerDashboard({ account }: { account: AccountContext }) {
  const supabase = await createClient();
  const employer = account.employer;

  let jobs: EmployerJob[] = [];
  let readError = false;
  if (employer) {
    const { data, error } = await supabase
      .from("employer_jobs")
      .select("*")
      .eq("employer_id", employer.id)
      .order("created_at", { ascending: false });
    jobs = (data ?? []) as EmployerJob[];
    readError = Boolean(error);
  }
  const counts = await getApplicationCountsByJob();

  const now = new Date();
  const withStatus = jobs.map((job) => ({ job, status: getListingStatus(job, now) }));
  const live = withStatus.filter((row) => row.status.key === "live");
  const expiringSoon = live.filter((row) => row.status.expiringSoon);
  const expired = withStatus.filter((row) => row.status.key === "expired");
  const totalApplications = Object.values(counts).reduce((sum, count) => sum + count.total, 0);
  const newApplications = Object.values(counts).reduce((sum, count) => sum + count.new, 0);
  const totalViews = jobs.reduce((sum, job) => sum + (job.view_count ?? 0), 0);

  const steps = [
    {
      id: "verify",
      label: "Confirm your work email",
      description: "Listings go live once we know the address is yours.",
      done: account.emailVerified,
      href: "/onboarding/verify?redirect=%2Fdashboard",
      actionLabel: "Enter code",
    },
    {
      id: "company",
      label: "Describe your company and add a logo",
      description: "Shown beside every listing you post.",
      done: Boolean(employer?.company_description && employer?.company_logo_url),
      href: "/dashboard/profile",
      actionLabel: "Edit company",
    },
    {
      id: "job",
      label: "Post your first job",
      description: "Free to post. Listings stay up for 60 days and can be renewed.",
      done: jobs.length > 0,
      href: "/dashboard/jobs/new",
      actionLabel: "Post a job",
    },
  ];
  const setupDone = steps.every((step) => step.done);

  const attention: { id: string; text: string; href: string; action: string }[] = [];
  if (newApplications > 0) {
    attention.push({
      id: "new",
      text: `${newApplications} new application${newApplications === 1 ? "" : "s"} to review`,
      href: "/dashboard/applicants?status=new",
      action: "Review",
    });
  }
  for (const { job, status } of expiringSoon) {
    attention.push({
      id: `soon-${job.id}`,
      text: `${job.title} expires in ${status.daysLeft} day${status.daysLeft === 1 ? "" : "s"}`,
      href: "/dashboard/jobs",
      action: "Renew",
    });
  }
  if (expired.length > 0) {
    attention.push({
      id: "expired",
      text: `${expired.length} listing${expired.length === 1 ? " has" : "s have"} expired and no longer take applications`,
      href: "/dashboard/jobs",
      action: "Renew",
    });
  }

  return (
    <>
      <DashboardPageHeader
        title="Overview"
        description={employer?.company_name}
        action={
          <LinkButton href="/dashboard/jobs/new" variant="primary" size="compact">
            Post a job
          </LinkButton>
        }
      />
      <DashboardBody>
        {readError ? (
          <div className="mb-6">
            <DashboardAlert tone="error">We couldn&apos;t load your listings. Refresh to try again.</DashboardAlert>
          </div>
        ) : null}

        {!setupDone ? <SetupChecklist title="Get your first listing live" steps={steps} className="mb-8" /> : null}

        <StatRow
          className="mb-10"
          stats={[
            { label: "Live listings", value: live.length, detail: `${jobs.length} posted in total`, href: "/dashboard/jobs" },
            {
              label: "Applications",
              value: totalApplications,
              detail: newApplications > 0 ? `${newApplications} new` : undefined,
              href: "/dashboard/applicants",
            },
            { label: "Listing views", value: totalViews.toLocaleString("en-US") },
          ]}
        />

        {jobs.length > 0 ? (
          <DashboardSection title="Needs attention">
            {attention.length > 0 ? (
              <ul className="divide-y divide-rule border-y border-rule">
                {attention.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                    <p className="font-sans text-sm text-ink">{item.text}</p>
                    <Link
                      href={item.href}
                      className="inline-flex min-h-10 shrink-0 items-center font-sans text-sm font-medium text-ink underline underline-offset-2"
                    >
                      {item.action}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-y border-rule py-3 font-sans text-sm text-secondary">
                Nothing needs you right now. New applications and expiring listings show up here.
              </p>
            )}
          </DashboardSection>
        ) : null}

        <DashboardSection
          title="Your listings"
          action={jobs.length > 5 ? { href: "/dashboard/jobs", label: `All ${jobs.length} listings` } : undefined}
        >
          {jobs.length === 0 ? (
            <DashboardEmptyState
              title="No listings yet"
              description="Posting is free. Candidates apply on Nuclear Hustle, and each application arrives in your inbox with a CV and appears under Applicants."
              action={
                <LinkButton href="/dashboard/jobs/new" variant="secondary" size="compact">
                  Post a job
                </LinkButton>
              }
            />
          ) : (
            <ul className="divide-y divide-rule border-y border-rule">
              {withStatus.slice(0, 5).map(({ job, status }) => {
                const count = counts[job.id];
                return (
                  <li key={job.id} className="relative flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-surface">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/jobs/${job.id}/applications`}
                        className="font-sans text-sm font-semibold text-ink after:absolute after:inset-0 hover:underline"
                      >
                        {job.title}
                      </Link>
                      <p className="font-sans text-sm text-secondary">
                        {job.location}
                        {status.key === "live" && job.expires_at ? ` · Expires ${formatShortDate(job.expires_at)}` : ""}
                      </p>
                    </div>
                    <Badge tone={status.key === "live" ? "success" : status.key === "expired" ? "danger" : "neutral"}>
                      {status.label}
                    </Badge>
                    <p className="w-28 text-right font-mono text-xs text-secondary">
                      {count?.total ?? 0} application{count?.total === 1 ? "" : "s"}
                      {count?.new ? <span className="block text-ink">{count.new} new</span> : null}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </DashboardSection>
      </DashboardBody>
    </>
  );
}
