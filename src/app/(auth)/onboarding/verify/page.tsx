import { redirect } from "next/navigation";
import { getAccountContext } from "@/lib/account";
import { getVerificationStatus } from "@/lib/auth/verification";
import { safeInternalPath, withRedirect } from "@/lib/redirects";
import { EMPLOYER_SETUP_STEPS, OnboardingSteps } from "@/components/auth/OnboardingSteps";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";

export const metadata = {
  title: "Confirm your email - Nuclear Hustle",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const next = safeInternalPath((await searchParams).redirect) ?? "/dashboard/jobs/new";
  const account = await getAccountContext();
  if (!account) redirect(withRedirect("/login", "/onboarding/verify"));
  if (!account.profile) redirect(withRedirect("/onboarding", next));
  if (account.role !== "employer") redirect("/dashboard");
  if (account.emailVerified) {
    redirect(account.employer?.company_description ? next : withRedirect("/onboarding/company", next));
  }

  const status = await getVerificationStatus(account.user.id);
  const email = account.user.email ?? status.email ?? "your work email";

  return (
    <div className="w-full max-w-md">
      <OnboardingSteps className="mb-6" steps={EMPLOYER_SETUP_STEPS} current={1} />
      <h1 className="mb-2 font-sans text-3xl font-bold leading-tight text-ink md:text-4xl">
        Check your inbox.
      </h1>
      <p className="mb-8 font-sans text-sm leading-relaxed text-secondary">
        We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>. We
        confirm employer addresses before listings go live, so candidates know a real
        company is behind each job.
      </p>

      <VerifyEmailForm email={email} redirect={next} hasSentCode={Boolean(status.lastSentAt)} />
    </div>
  );
}
