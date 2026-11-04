import { redirect } from "next/navigation";
import { getAccountContext } from "@/lib/account";
import { getEmployerApplications } from "@/lib/data/applications";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  DashboardAlert,
  DashboardBody,
  DashboardEmptyState,
  DashboardPageHeader,
} from "@/components/dashboard/DashboardChrome";
import { ApplicantFilter, ApplicantList } from "@/components/dashboard/ApplicantList";
import type { ApplicationStatus } from "@/lib/types";

export const metadata = {
  title: "Applicants - Nuclear Hustle",
};

const STATUSES: ApplicationStatus[] = ["new", "reviewed", "shortlisted", "rejected"];

export default async function ApplicantsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const account = await getAccountContext();
  if (!account?.profile) return null;
  if (account.role !== "employer") redirect("/dashboard/applications");

  const requested = (await searchParams).status;
  const status = STATUSES.includes(requested as ApplicationStatus) ? (requested as ApplicationStatus) : undefined;

  const all = await getEmployerApplications();
  const counts: Record<string, number> = { all: all?.length ?? 0 };
  for (const app of all ?? []) counts[app.status] = (counts[app.status] ?? 0) + 1;
  const shown = status ? (all ?? []).filter((app) => app.status === status) : (all ?? []);

  return (
    <>
      <DashboardPageHeader
        title="Applicants"
        description={
          all && all.length > 0
            ? `${all.length} across your listings · ${counts.new ?? 0} new`
            : "Applications from every listing that takes them on Nuclear Hustle."
        }
      />
      <DashboardBody>
        {all === null ? (
          <DashboardAlert tone="error">We couldn&apos;t load applications. Refresh to try again.</DashboardAlert>
        ) : all.length === 0 ? (
          <DashboardEmptyState
            title="No applications yet"
            description="When a listing is set to receive applications by email, each one appears here with the CV, and in your inbox."
            action={
              <LinkButton href="/dashboard/jobs" variant="secondary" size="compact">
                Go to your listings
              </LinkButton>
            }
          />
        ) : (
          <>
            <ApplicantFilter basePath="/dashboard/applicants" current={status} counts={counts} />
            {shown.length === 0 ? (
              <p className="py-6 font-sans text-sm text-secondary">No applications with this status.</p>
            ) : (
              <ApplicantList applications={shown} showJob />
            )}
          </>
        )}
      </DashboardBody>
    </>
  );
}
