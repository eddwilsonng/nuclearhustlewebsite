import Link from "next/link";
import { JobSeekerSignupForm } from "@/components/auth/JobSeekerSignupForm";

export const metadata = {
  title: "Job Seeker Sign Up — Nuclear Hustle",
  description: "Create your job seeker account on Nuclear Hustle",
};

export default async function JobSeekerSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <div className="w-full max-w-md">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
        Job seeker
      </p>
      <h1 className="mb-1 font-sans text-3xl font-bold leading-tight text-ink md:text-4xl">
        Create your profile.
      </h1>
      <p className="mb-10 font-sans text-sm text-secondary">
        Find your next nuclear role
      </p>

      <JobSeekerSignupForm redirect={redirect} />

      <div className="mt-8 space-y-2 border-t border-rule pt-6">
        <p className="font-sans text-sm text-secondary">
          Hiring instead?{" "}
          <Link href="/signup/employer" className="font-semibold text-ink underline underline-offset-2">
            Employer sign up →
          </Link>
        </p>
        <p className="font-sans text-sm text-secondary">
          Have an account?{" "}
          <Link href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"} className="font-semibold text-ink underline underline-offset-2">
            Log in →
          </Link>
        </p>
      </div>
    </div>
  );
}
