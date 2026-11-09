import Link from "next/link";
import { JobSeekerSignupForm } from "@/components/auth/JobSeekerSignupForm";
import { AuthError } from "@/components/auth/AuthShared";
import { withRedirect } from "@/lib/redirects";

export const metadata = {
  title: "Job Seeker Sign Up — Nuclear Hustle",
  description: "Create your job seeker account on Nuclear Hustle",
};

export default async function JobSeekerSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const { redirect, error } = await searchParams;

  return (
    <div className="w-full max-w-md">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
        Job seeker
      </p>
      <h1 className="mb-1 font-sans text-3xl font-bold leading-tight text-ink md:text-4xl">
        Create your account.
      </h1>
      <p className="mb-8 font-sans text-sm leading-relaxed text-secondary">
        Save roles, apply with a stored resume and see every application in one place.
      </p>

      {error ? (
        <div className="mb-6">
          <AuthError>{error}</AuthError>
        </div>
      ) : null}

      <JobSeekerSignupForm redirect={redirect} />

      <div className="mt-8 space-y-2 border-t border-rule pt-6">
        <p className="font-sans text-sm text-secondary">
          Hiring instead?{" "}
          <Link href={withRedirect("/signup/employer", redirect)} className="font-semibold text-ink underline underline-offset-2">
            Employer sign up →
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
