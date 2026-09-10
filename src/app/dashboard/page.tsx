import Link from "next/link";
import { cookies } from "next/headers";
import { Check, X as XIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, ADMIN_VIEW_COOKIE, type AdminViewRole } from "@/lib/admin";
import { getStateByCode } from "@/lib/states";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  DashboardCard,
  DashboardPageHeader,
  DashboardSectionLabel,
} from "@/components/dashboard/DashboardChrome";
import type { Profile, EmployerProfile, JobSeekerProfile, EmployerJob } from "@/lib/types";

export const metadata = {
  title: "Dashboard - Nuclear Hustle",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const typedProfile = profile as Profile;
  let viewRole: AdminViewRole = typedProfile.role as AdminViewRole;

  if (isAdmin(user.email)) {
    const cookieStore = await cookies();
    const override = cookieStore.get(ADMIN_VIEW_COOKIE)?.value as AdminViewRole | undefined;
    if (override === "employer" || override === "job_seeker") {
      viewRole = override;
    }
  }

  if (viewRole === "employer") {
    return <EmployerDashboard userId={user.id} profile={typedProfile} />;
  }

  return <JobSeekerDashboard userId={user.id} profile={typedProfile} />;
}

async function JobSeekerDashboard({
  userId,
  profile,
}: {
  userId: string;
  profile: Profile;
}) {
  const supabase = await createClient();

  const { data: jobSeekerProfile } = await supabase
    .from("job_seeker_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  const typedJobSeekerProfile = jobSeekerProfile as JobSeekerProfile | null;
  const isActivelyLooking = typedJobSeekerProfile?.is_actively_looking ?? true;
  const stateName = typedJobSeekerProfile?.state
    ? getStateByCode(typedJobSeekerProfile.state)?.name
    : null;

  const statusRows = [
    { label: "Full name", complete: true },
    { label: "City & state", complete: !!(typedJobSeekerProfile?.location || stateName) },
    { label: "Phone", complete: !!typedJobSeekerProfile?.phone },
    { label: "Resume", complete: !!typedJobSeekerProfile?.resume_url },
  ];
  const incomplete = statusRows.some((row) => !row.complete);

  const quickActions = [
    { href: "/jobs", label: "Browse jobs", description: "Open roles across the US fleet" },
    {
      href: "/dashboard/profile",
      label: incomplete ? "Finish profile" : "Update profile",
      description: incomplete ? "Add the missing facts employers scan first" : "Keep resume and location current",
    },
    { href: "/dashboard/saved", label: "Saved jobs", description: "Roles you bookmarked" },
  ];

  return (
    <div className="max-w-4xl">
      <DashboardPageHeader
        eyebrow="Job seeker"
        title={`Welcome back, ${profile.full_name.split(" ")[0]}`}
        description={
          <Badge tone={isActivelyLooking ? "featured" : "neutral"}>
            {isActivelyLooking ? "Open to opportunities" : "Not looking"}
          </Badge>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <DashboardCard>
          <DashboardSectionLabel>Profile status</DashboardSectionLabel>
          <ul className="mt-4 space-y-3">
            {statusRows.map((row) => (
              <li key={row.label} className="flex items-center justify-between">
                <span className="font-sans text-sm text-secondary">{row.label}</span>
                <span className={row.complete ? "text-success" : "text-muted"}>
                  {row.complete ? <Check size={16} aria-label="Complete" /> : <XIcon size={16} aria-label="Incomplete" />}
                </span>
              </li>
            ))}
          </ul>
          <LinkButton href="/dashboard/profile" variant="secondary" className="mt-6" fullWidth>
            {incomplete ? "Complete profile" : "Edit profile"}
          </LinkButton>
        </DashboardCard>

        <DashboardCard>
          <DashboardSectionLabel>Next</DashboardSectionLabel>
          <div className="mt-4 space-y-1">
            {quickActions.map(({ href, label, description }) => (
              <Link
                key={href}
                href={href}
                className="block px-3 py-3 transition-colors duration-150 hover:bg-surface"
              >
                <p className="font-sans text-sm font-semibold text-ink">{label}</p>
                <p className="mt-0.5 font-sans text-sm text-secondary">{description}</p>
              </Link>
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

async function EmployerDashboard({
  userId,
  profile,
}: {
  userId: string;
  profile: Profile;
}) {
  const supabase = await createClient();

  const { data: employerProfile } = await supabase
    .from("employer_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  const typedEmployerProfile = employerProfile as EmployerProfile | null;

  let jobs: EmployerJob[] = [];
  if (typedEmployerProfile) {
    const { data } = await supabase
      .from("employer_jobs")
      .select("*")
      .eq("employer_id", typedEmployerProfile.id)
      .order("created_at", { ascending: false });
    jobs = (data || []) as EmployerJob[];
  }

  const activeJobs = jobs.filter((j) => j.is_active).length;
  const totalJobs = jobs.length;

  return (
    <div className="max-w-4xl">
      <DashboardPageHeader
        eyebrow="Employer"
        title={`Welcome back, ${profile.full_name.split(" ")[0]}`}
        action={
          <LinkButton href="/dashboard/jobs/new" variant="primary">
            Post a job
          </LinkButton>
        }
      />

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {[
          { label: "Active jobs", value: String(activeJobs) },
          { label: "Total posted", value: String(totalJobs) },
          { label: "Company", value: typedEmployerProfile?.company_name || "Not set" },
        ].map((stat) => (
          <DashboardCard key={stat.label}>
            <p className="font-mono text-xs uppercase tracking-widest text-secondary">
              {stat.label}
            </p>
            <p className="mt-2 truncate font-sans text-2xl font-semibold text-ink">
              {stat.value}
            </p>
          </DashboardCard>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/dashboard/jobs/new"
          className="border border-signal bg-signal p-6 text-ink transition-colors duration-150 hover:border-signal-hover hover:bg-signal-hover"
        >
          <p className="font-sans text-base font-semibold">Post a new job</p>
          <p className="mt-1 font-sans text-sm">Reach operators, engineers, and plant crews.</p>
        </Link>
        <Link
          href="/dashboard/jobs"
          className="border border-control bg-raised p-6 transition-colors duration-150 hover:bg-surface"
        >
          <p className="font-sans text-base font-semibold text-ink">Manage postings</p>
          <p className="mt-1 font-sans text-sm text-secondary">Edit, feature, or close listings.</p>
        </Link>
      </div>

      {jobs.length > 0 && (
        <div className="mt-8">
          <DashboardSectionLabel>Recent postings</DashboardSectionLabel>
          <div className="mt-3 divide-y divide-rule border border-rule bg-raised">
            {jobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-sans text-sm font-semibold text-ink">{job.title}</p>
                  <p className="font-sans text-sm text-secondary">{job.location}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge tone={job.is_active ? "success" : "neutral"}>
                    {job.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <LinkButton
                    href={`/dashboard/jobs/${job.id}/edit`}
                    variant="quiet"
                    size="compact"
                  >
                    Edit
                  </LinkButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
