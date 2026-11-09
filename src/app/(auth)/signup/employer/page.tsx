import Link from "next/link";
import { EmployerSignupForm } from "@/components/auth/EmployerSignupForm";
import { AuthError } from "@/components/auth/AuthShared";
import { EMPLOYER_SETUP_STEPS, OnboardingSteps } from "@/components/auth/OnboardingSteps";
import { withRedirect } from "@/lib/redirects";

export const metadata = {
  title: "Employer Sign Up — Nuclear Hustle",
  description: "Create your employer account on Nuclear Hustle",
};

export default async function EmployerSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const { redirect, error } = await searchParams;

  return (
    <div className="w-full max-w-lg">
      <OnboardingSteps
        className="mb-6"
        steps={EMPLOYER_SETUP_STEPS}
        current={0}
      />
      <h1 className="mb-1 font-sans text-3xl font-bold leading-tight text-ink md:text-4xl">
        Post jobs, find talent.
      </h1>
      <p className="mb-8 font-sans text-sm leading-relaxed text-secondary">
        Posting is free. Listings reach operators, engineers, health physics and
        maintenance crews looking for plant work.
      </p>

      {error ? (
        <div className="mb-6">
          <AuthError>{error}</AuthError>
        </div>
      ) : null}

      <EmployerSignupForm redirect={redirect} />

      <div className="mt-8 space-y-2 border-t border-rule pt-6">
        <p className="font-sans text-sm text-secondary">
          Looking for a job?{" "}
          <Link href={withRedirect("/signup/job-seeker", redirect)} className="font-semibold text-ink underline underline-offset-2">
            Job seeker sign up →
          </Link>
        </p>
        <p className="font-sans text-sm text-secondary">
          Have an account?{" "}
          <Link href={withRedirect("/login", redirect)} className="font-semibold text-ink underline underline-offset-2">
            Log in →
          </Link>
        </p>
      </div>
    </div>
  );
}
