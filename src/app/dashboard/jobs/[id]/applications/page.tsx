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
    <>
      <DashboardPageHeader
        title={job.title}
        description={`${applications.length} application${applications.length === 1 ? "" : "s"}${newCount > 0 ? ` · ${newCount} new` : ""}`}
        action={
          <LinkButton href="/dashboard/jobs" variant="quiet" size="compact">
            Back
          </LinkButton>
        }
      />

      {applications.length === 0 ? (
        <DashboardEmptyState
          title="No applications yet"
          description="Share the public listing to start receiving them."
          action={
            <LinkButton href={`/job/${job.slug}`} target="_blank" variant="secondary" size="compact">
              View listing
            </LinkButton>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="border-b border-rule">
              <tr>
                <th className="px-5 py-2 text-left font-mono text-xs font-medium uppercase tracking-widest text-secondary">
                  Applicant
                </th>
                <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-widest text-secondary">
                  Applied
                </th>
                <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-widest text-secondary">
                  Status
                </th>
                <th className="px-5 py-2 text-right font-mono text-xs font-medium uppercase tracking-widest text-secondary">
                  CV
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-rule last:border-0 hover:bg-surface">
                  <td className="px-5 py-3 align-top">
                    <p className="font-medium text-ink">{app.applicant_name}</p>
                    <a
                      href={`mailto:${app.applicant_email}`}
                      className="font-sans text-sm text-secondary hover:text-ink hover:underline"
                    >
                      {app.applicant_email}
                    </a>
                    {app.message ? (
                      <p className="mt-2 max-w-md whitespace-pre-wrap font-sans text-sm leading-relaxed text-secondary">
                        {app.message}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 align-top font-mono text-xs text-secondary">
                    {formatDate(app.created_at)}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <StatusSelect applicationId={app.id} status={app.status} />
                  </td>
                  <td className="px-5 py-3 align-top text-right">
                    <DownloadCvButton applicationId={app.id} hasCv={!!app.cv_path} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
