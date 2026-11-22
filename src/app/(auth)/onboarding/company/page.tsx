import { redirect } from "next/navigation";
import { getAccountContext } from "@/lib/account";
import { safeInternalPath, withRedirect } from "@/lib/redirects";
import { EMPLOYER_SETUP_STEPS, OnboardingSteps } from "@/components/auth/OnboardingSteps";
import { CompanyDetailsForm } from "@/components/auth/CompanyDetailsForm";

export const metadata = {
  title: "Company details - Nuclear Hustle",
};

export default async function CompanyOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const next = safeInternalPath((await searchParams).redirect) ?? "/dashboard/jobs/new";
  const account = await getAccountContext();
  if (!account) redirect(withRedirect("/login", "/onboarding/company"));
  if (!account.profile) redirect(withRedirect("/onboarding", next));
  if (account.role !== "employer") redirect("/dashboard");

  const afterThisStep = account.emailVerified ? next : withRedirect("/onboarding/verify", next);

  return (
    <div className="w-full max-w-lg">
      <OnboardingSteps className="mb-6" steps={EMPLOYER_SETUP_STEPS} current={2} />
      <h1 className="mb-2 font-sans text-3xl font-bold leading-tight text-ink md:text-4xl">
        Tell candidates who&apos;s hiring.
      </h1>
      <p className="mb-8 font-sans text-sm leading-relaxed text-secondary">
        This appears on every listing you post. You can change it later under Company.
      </p>

      <CompanyDetailsForm
        employer={account.employer}
        redirect={next}
        skipHref={account.employer ? afterThisStep : undefined}
      />
    </div>
  );
}
