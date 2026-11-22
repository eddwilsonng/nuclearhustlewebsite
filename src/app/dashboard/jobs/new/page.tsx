import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccountContext } from "@/lib/account";
import { getVerificationStatus } from "@/lib/auth/verification";
import { JobPostingForm } from "@/components/dashboard/JobPostingForm";
import { EMPLOYER_SETUP_STEPS, OnboardingSteps } from "@/components/auth/OnboardingSteps";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { LinkButton } from "@/components/ui/LinkButton";
import { DashboardBody, DashboardEmptyState, DashboardPageHeader } from "@/components/dashboard/DashboardChrome";

export const metadata = {
  title: "Post a job - Nuclear Hustle",
};

export default async function NewJobPage() {
  const account = await getAccountContext();
  if (!account?.profile) return null;

  if (account.role !== "employer") {
    return (
      <>
        <DashboardPageHeader title="Post a job" />
        <DashboardBody width="form">
          <DashboardEmptyState
            title="Posting needs an employer account"
            description="You're logged in as a job seeker. To hire, log out and create an employer account with your work email. It's free."
            action={
              <>
                <LinkButton href="/jobs" variant="secondary" size="compact">
                  Back to the board
                </LinkButton>
                <LinkButton href="/pricing" variant="quiet" size="compact">
                  How posting works
                </LinkButton>
              </>
            }
          />
        </DashboardBody>
      </>
    );
  }
  if (!account.employer) redirect("/onboarding/company?redirect=/dashboard/jobs/new");

  const supabase = await createClient();
  const { count } = await supabase
    .from("employer_jobs")
    .select("id", { count: "exact", head: true })
    .eq("employer_id", account.employer.id);
  const firstJob = (count ?? 0) === 0;
  const verification = account.emailVerified ? null : await getVerificationStatus(account.user.id);

  return (
    <>
      <DashboardPageHeader
        title={firstJob ? "Post your first job" : "Post a job"}
        description="Free to post. Live on the board as soon as you publish, for 60 days."
        back={{ href: "/dashboard/jobs", label: "Jobs" }}
      />
      <DashboardBody width="form">
        {firstJob ? <OnboardingSteps className="mb-6" steps={EMPLOYER_SETUP_STEPS} current={3} /> : null}

        {verification ? (
          <section
            aria-labelledby="verify-heading"
            className="mb-8 border border-l-4 border-control border-l-ink bg-raised p-5"
          >
            <h2 id="verify-heading" className="font-sans text-base font-semibold text-ink">
              Confirm your work email to publish
            </h2>
            <p className="mt-1 mb-4 max-w-prose font-sans text-sm leading-relaxed text-secondary">
              You can fill in the listing now. Publishing unlocks once you enter the code we
              sent to {account.user.email}.
            </p>
            <VerifyEmailForm
              email={account.user.email ?? verification.email ?? "your work email"}
              inline
              hasSentCode={Boolean(verification.lastSentAt)}
            />
          </section>
        ) : null}

        <JobPostingForm mode="create" canPublish={account.emailVerified} />
      </DashboardBody>
    </>
  );
}
