import { notFound } from "next/navigation";
import { getJobApplications } from "@/lib/data/applications";
import { getListingStatus } from "@/lib/jobs/listingStatus";
import { ExternalLinkButton, LinkButton } from "@/components/ui/LinkButton";
import {
  DashboardBody,
  DashboardEmptyState,
  DashboardPageHeader,
} from "@/components/dashboard/DashboardChrome";
import { ApplicantFilter, ApplicantList } from "@/components/dashboard/ApplicantList";
import type { ApplicationStatus } from "@/lib/types";

export const metadata = {
  title: "Applications - Nuclear Hustle",
};

const STATUSES: ApplicationStatus[] = ["new", "reviewed", "shortlisted", "rejected"];

export default async function JobApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ id }, { status: requested }] = await Promise.all([params, searchParams]);
  const data = await getJobApplications(id);

  if (!data) notFound();

  const { job, applications } = data;
  const status = STATUSES.includes(requested as ApplicationStatus) ? (requested as ApplicationStatus) : undefined;
  const counts: Record<string, number> = { all: applications.length };
  for (const app of applications) counts[app.status] = (counts[app.status] ?? 0) + 1;
  const shown = status ? applications.filter((app) => app.status === status) : applications;
  const listing = getListingStatus(job);

  return (
    <>
      <DashboardPageHeader
        title={job.title}
        description={`${listing.label} · ${applications.length} application${applications.length === 1 ? "" : "s"}${counts.new ? ` · ${counts.new} new` : ""}`}
        back={{ href: "/dashboard/jobs", label: "Jobs" }}
        action={
          <>
            <LinkButton href={`/dashboard/jobs/${job.id}/edit`} variant="secondary" size="compact">
              Edit listing
            </LinkButton>
            <ExternalLinkButton href={`/job/${job.slug}`} target="_blank" variant="quiet" size="compact">
              View public listing
            </ExternalLinkButton>
          </>
        }
      />

      <DashboardBody>
        {applications.length === 0 ? (
          <DashboardEmptyState
            title="No applications yet"
            description={
              job.application_type === "link"
                ? "This listing sends candidates to your careers page, so applications arrive there rather than here."
                : "Applications arrive here and by email as soon as candidates apply. Share the listing to reach more of them."
            }
            action={
              <ExternalLinkButton href={`/job/${job.slug}`} target="_blank" variant="secondary" size="compact">
                View public listing
              </ExternalLinkButton>
            }
          />
        ) : (
          <>
            <ApplicantFilter basePath={`/dashboard/jobs/${job.id}/applications`} current={status} counts={counts} />
            {shown.length === 0 ? (
              <p className="py-6 font-sans text-sm text-secondary">No applications with this status.</p>
            ) : (
              <ApplicantList applications={shown} />
            )}
          </>
        )}
      </DashboardBody>
    </>
  );
}
