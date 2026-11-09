import { redirect } from "next/navigation";
import { getAccountContext } from "@/lib/account";
import { getMyApplications } from "@/lib/data/applications";
import {
  DashboardAlert,
  DashboardBody,
  DashboardPageHeader,
} from "@/components/dashboard/DashboardChrome";
import { MyApplicationsList } from "@/components/dashboard/MyApplicationsList";

export const metadata = {
  title: "My applications - Nuclear Hustle",
};

export default async function MyApplicationsPage() {
  const account = await getAccountContext();
  if (!account?.profile) return null;
  if (account.role === "employer") redirect("/dashboard/applicants");

  const applications = await getMyApplications();
  const reviewed = applications?.filter((app) => app.seen).length ?? 0;

  return (
    <>
      <DashboardPageHeader
        title="Applications"
        description={
          applications && applications.length > 0
            ? `${applications.length} sent · ${reviewed} reviewed by the employer`
            : "Every application you send on Nuclear Hustle while logged in."
        }
      />
      <DashboardBody>
        {applications === null ? (
          <DashboardAlert tone="error">We couldn&apos;t load your applications. Refresh to try again.</DashboardAlert>
        ) : (
          <MyApplicationsList applications={applications} />
        )}
        <p className="mt-6 max-w-prose font-sans text-sm leading-relaxed text-secondary">
          Employers reply by email to the address on your account. Roles that link to an
          employer&apos;s own careers site aren&apos;t tracked here.
        </p>
      </DashboardBody>
    </>
  );
}
