import { notFound } from "next/navigation";
import { getJobApplications } from "@/lib/data/applications";
import { StatusSelect, DownloadCvButton } from "./ApplicationActions";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  DashboardEmptyState,
  DashboardPageHeader,
} from "@/components/dashboard/DashboardChrome";

export const metadata = {
  title: "Applications - Nuclear Hustle",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function JobApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getJobApplications(id);

  if (!data) notFound();

  const { job, applications } = data;
  const newCount = applications.filter((a) => a.status === "new").length;

  return (
    <div className="max-w-4xl">
      <DashboardPageHeader
        eyebrow="Applications"
        title={job.title}
        description={
          <>
            {applications.length} total
            {newCount > 0 ? ` · ${newCount} new` : ""}
            {` · ${job.view_count} views`}
          </>
        }
        action={
          <LinkButton href="/dashboard/jobs" variant="quiet" size="compact">
            Back to jobs
          </LinkButton>
        }
      />

      {applications.length === 0 ? (
        <DashboardEmptyState
          title="No applications yet"
          description="Share the public listing to start receiving them."
          action={
            <LinkButton href={`/job/${job.slug}`} target="_blank" variant="secondary">
              View public listing
            </LinkButton>
          }
        />
      ) : (
        <div className="divide-y divide-rule border border-rule bg-raised">
          {applications.map((app) => (
            <div key={app.id} className="p-4 md:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-sans text-base font-semibold text-ink">
                    {app.applicant_name}
                  </p>
                  <a
                    href={`mailto:${app.applicant_email}`}
                    className="font-sans text-sm text-secondary underline underline-offset-2 hover:text-ink"
                  >
                    {app.applicant_email}
                  </a>
                  <p className="mt-1 font-mono text-xs text-secondary">
                    Applied {formatDate(app.created_at)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <StatusSelect applicationId={app.id} status={app.status} />
                  <DownloadCvButton applicationId={app.id} hasCv={!!app.cv_path} />
                </div>
              </div>

              {app.message && (
                <div className="mt-3 border-t border-rule pt-3">
                  <p className="mb-1 font-mono text-xs uppercase tracking-widest text-secondary">
                    Cover note
                  </p>
                  <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">
                    {app.message}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
