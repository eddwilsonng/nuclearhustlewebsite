import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, ADMIN_VIEW_COOKIE, type AdminViewRole } from "@/lib/admin";
import { getStateByCode } from "@/lib/states";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  DashboardBody,
  DashboardPageHeader,
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
    return <EmployerDashboard userId={user.id} />;
  }

  return <JobSeekerDashboard userId={user.id} />;
}

async function JobSeekerDashboard({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: jobSeekerProfile } = await supabase
    .from("job_seeker_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  const typed = jobSeekerProfile as JobSeekerProfile | null;
  const isActivelyLooking = typed?.is_actively_looking ?? true;
  const stateName = typed?.state ? getStateByCode(typed.state)?.name : null;

  const statusRows = [
    { label: "Name", complete: true },
    { label: "City & state", complete: !!(typed?.location || stateName) },
    { label: "Phone", complete: !!typed?.phone },
    { label: "Resume", complete: !!typed?.resume_url },
  ];
  const missing = statusRows.filter((row) => !row.complete).map((row) => row.label.toLowerCase());

  return (
    <>
      <DashboardPageHeader
        title="Overview"
        description={isActivelyLooking ? "Open to opportunities" : "Not looking"}
        action={
          <LinkButton href="/jobs" variant="primary" size="compact">
            Browse jobs
          </LinkButton>
        }
      />
      <DashboardBody>
        {missing.length > 0 ? (
          <p className="mb-6 font-sans text-sm text-secondary">
            Profile still needs {missing.join(", ")}.{" "}
            <Link href="/dashboard/profile" className="text-ink underline underline-offset-2">
              Finish it
            </Link>
          </p>
        ) : (
          <p className="mb-6 font-sans text-sm text-secondary">
            Profile is complete.{" "}
            <Link href="/dashboard/profile" className="text-ink underline underline-offset-2">
              Edit
            </Link>
          </p>
        )}
        <ul className="divide-y divide-rule border-y border-rule">
          {statusRows.map((row) => (
            <li key={row.label} className="flex items-center justify-between py-2.5">
              <span className="font-sans text-sm text-ink">{row.label}</span>
              <span className="font-mono text-xs text-secondary">
                {row.complete ? "Done" : "Missing"}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex gap-4 font-sans text-sm">
          <Link href="/dashboard/saved" className="text-secondary hover:text-ink">
            Saved jobs
          </Link>
        </div>
      </DashboardBody>
    </>
  );
}

async function EmployerDashboard({ userId }: { userId: string }) {
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
  const recent = jobs.slice(0, 8);

  const stats = [
    { label: "Active", value: String(activeJobs) },
    { label: "Posted", value: String(jobs.length) },
  ];

  return (
    <>
      <DashboardPageHeader
        title="Overview"
        description={typedEmployerProfile?.company_name}
        action={
          <LinkButton href="/dashboard/jobs/new" variant="primary" size="compact">
            New job
          </LinkButton>
        }
      />

      <div className="flex border-b border-rule">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-28 px-5 py-4">
            <p className="font-mono text-xs uppercase tracking-widest text-secondary">
              {stat.label}
            </p>
            <p className="mt-1 font-sans text-xl font-semibold tabular-nums text-ink">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {recent.length === 0 ? (
        <p className="px-5 py-10 font-sans text-sm text-secondary">
          No postings yet.{" "}
          <Link href="/dashboard/jobs/new" className="text-ink underline underline-offset-2">
            Create one
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-rule">
              <tr>
                <th className="px-5 py-2 text-left font-mono text-xs font-medium uppercase tracking-widest text-secondary">
                  Recent
                </th>
                <th className="hidden px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-widest text-secondary sm:table-cell">
                  Location
                </th>
                <th className="px-5 py-2 text-left font-mono text-xs font-medium uppercase tracking-widest text-secondary">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recent.map((job) => (
                <tr key={job.id} className="border-b border-rule last:border-0 hover:bg-surface">
                  <td className="px-5 py-2.5">
                    <Link
                      href={`/dashboard/jobs/${job.id}/edit`}
                      className="font-medium text-ink hover:underline"
                    >
                      {job.title}
                    </Link>
                  </td>
                  <td className="hidden px-3 py-2.5 text-secondary sm:table-cell">
                    {job.location}
                  </td>
                  <td className="px-5 py-2.5">
                    <Badge tone={job.is_active ? "success" : "neutral"}>
                      {job.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length > recent.length ? (
            <div className="px-5 py-3">
              <Link href="/dashboard/jobs" className="font-sans text-sm text-secondary hover:text-ink">
                View all jobs
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
