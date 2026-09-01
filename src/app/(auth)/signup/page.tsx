import Link from "next/link";

export const metadata = {
  title: "Sign Up — Nuclear Hustle",
  description: "Create your Nuclear Hustle account",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  const q = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";

  return (
    <div className="w-full max-w-lg">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
        Get started
      </p>
      <h1 className="mb-1 font-sans text-3xl font-bold leading-tight text-ink md:text-4xl">
        Create an account.
      </h1>
      <p className="mb-10 font-sans text-sm text-secondary">
        Choose how you want to use Nuclear Hustle
      </p>

      <div className="space-y-3">
        <Link
          href={`/signup/job-seeker${q}`}
          className="group flex items-center justify-between gap-4 border border-control p-6 hover:bg-surface"
        >
          <div>
            <h2 className="mb-1 font-sans text-base font-semibold text-ink">
              I&apos;m looking for a job
            </h2>
            <p className="font-sans text-sm leading-relaxed text-secondary">
              Create a profile, upload your resume, and get discovered by nuclear employers.
            </p>
          </div>
          <span className="shrink-0 text-secondary group-hover:text-ink" aria-hidden="true">
            →
          </span>
        </Link>

        <Link
          href="/signup/employer"
          className="group flex items-center justify-between gap-4 border border-control p-6 hover:bg-surface"
        >
          <div>
            <h2 className="mb-1 font-sans text-base font-semibold text-ink">
              I&apos;m hiring
            </h2>
            <p className="font-sans text-sm leading-relaxed text-secondary">
              Post job listings and reach qualified candidates in the nuclear industry.
            </p>
          </div>
          <span className="shrink-0 text-secondary group-hover:text-ink" aria-hidden="true">
            →
          </span>
        </Link>
      </div>

      <p className="mt-8 font-sans text-sm text-secondary">
        Already have an account?{" "}
        <Link href={`/login${q}`} className="font-semibold text-ink underline underline-offset-2">
          Log in →
        </Link>
      </p>
    </div>
  );
}
