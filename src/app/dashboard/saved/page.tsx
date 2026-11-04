import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccountContext } from "@/lib/account";
import { getAllJobs } from "@/lib/data/employer";
import { toJobListItem } from "@/lib/data/static";
import { JobCard } from "@/components/JobCard";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  DashboardAlert,
  DashboardBody,
  DashboardEmptyState,
  DashboardPageHeader,
  DashboardSection,
} from "@/components/dashboard/DashboardChrome";
import { RemoveSavedButton } from "@/components/dashboard/RemoveSavedButton";

export const metadata = {
  title: "Saved jobs - Nuclear Hustle",
};

function titleFromSlug(slug: string): string {
  const words = slug.replace(/-\d{6,}$/, "").split("-").filter(Boolean);
  const text = words.join(" ");
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "Saved listing";
}

export default async function SavedJobsPage() {
  const account = await getAccountContext();
  if (!account?.profile) return null;
  if (account.role === "employer") redirect("/dashboard");

  const supabase = await createClient();
  const { data: savedRows, error } = await supabase
    .from("saved_jobs")
    .select("job_slug, job_id, saved_at")
    .eq("user_id", account.user.id)
    .order("saved_at", { ascending: false });

  // One pass over the board instead of a lookup per saved row.
  const bySlug = new Map((await getAllJobs()).map((job) => [job.slug, job]));
  const rows = savedRows ?? [];
  const open = rows.flatMap((row) => {
    const job = bySlug.get(row.job_slug);
    return job ? [toJobListItem(job)] : [];
  });
  const closed = rows.filter((row) => !bySlug.has(row.job_slug));

  return (
    <>
      <DashboardPageHeader
        title="Saved jobs"
        description={
          rows.length > 0
            ? `${open.length} open${closed.length > 0 ? ` · ${closed.length} no longer listed` : ""}`
            : "Roles you've bookmarked from the board."
        }
        action={
          <LinkButton href="/jobs" variant="primary" size="compact">
            Browse jobs
          </LinkButton>
        }
      />
      <DashboardBody>
        {error ? (
          <DashboardAlert tone="error">We couldn&apos;t load your saved jobs. Refresh to try again.</DashboardAlert>
        ) : rows.length === 0 ? (
          <DashboardEmptyState
            title="Nothing saved yet"
            description="Use Save on any listing and it stays here until you remove it, or until the role closes."
            action={
              <LinkButton href="/jobs" variant="secondary" size="compact">
                Browse jobs
              </LinkButton>
            }
          />
        ) : (
          <>
            {open.length > 0 ? (
              <div className="border-y border-rule">
                {open.map((job) => (
                  <JobCard key={job.id} job={job} isAuthenticated initialSaved />
                ))}
              </div>
            ) : null}

            {closed.length > 0 ? (
              <DashboardSection title="No longer listed" className={open.length > 0 ? undefined : "mt-0"}>
                <p className="mb-3 max-w-prose font-sans text-sm leading-relaxed text-secondary">
                  These roles were filled, expired or taken down by the employer.
                </p>
                <ul className="divide-y divide-rule border-y border-rule">
                  {closed.map((row) => (
                    <li key={row.job_slug} className="flex items-center justify-between gap-4 py-2">
                      <p className="min-w-0 truncate font-sans text-sm text-secondary">{titleFromSlug(row.job_slug)}</p>
                      <RemoveSavedButton jobSlug={row.job_slug} jobId={row.job_id} />
                    </li>
                  ))}
                </ul>
              </DashboardSection>
            ) : null}
          </>
        )}
      </DashboardBody>
    </>
  );
}
