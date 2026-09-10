import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { getAnyJobBySlug } from "@/lib/data/employer";
import { toJobListItem } from "@/lib/data/static";
import { JobCard } from "@/components/JobCard";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  DashboardEmptyState,
  DashboardPageHeader,
} from "@/components/dashboard/DashboardChrome";

export const metadata = {
  title: "Saved Jobs - Nuclear Hustle",
};

export default async function SavedJobsPage() {
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

  if (profile?.role === "employer" && !isAdmin(user.email)) {
    redirect("/dashboard");
  }

  const { data: savedRows } = await supabase
    .from("saved_jobs")
    .select("job_slug, saved_at")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false });

  const jobs = (
    await Promise.all(
      (savedRows ?? []).map(async (row) => {
        const job = await getAnyJobBySlug(row.job_slug);
        return job ? toJobListItem(job) : null;
      }),
    )
  ).filter((job) => job !== null);

  return (
    <div className="max-w-4xl">
      <DashboardPageHeader
        eyebrow="Job seeker"
        title="Saved jobs"
        description={jobs.length > 0 ? `${jobs.length} saved` : undefined}
      />

      {jobs.length === 0 ? (
        <DashboardEmptyState
          title="Nothing saved yet"
          description="Bookmark a listing from the board and it will show up here."
          action={
            <LinkButton href="/jobs" variant="primary">
              Browse jobs
            </LinkButton>
          }
        />
      ) : (
        <div className="overflow-hidden border border-rule">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} isAuthenticated initialSaved />
          ))}
        </div>
      )}
    </div>
  );
}
