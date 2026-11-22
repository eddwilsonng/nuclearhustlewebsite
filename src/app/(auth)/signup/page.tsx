import Link from "next/link";
import { withRedirect } from "@/lib/redirects";
import { FEATURED_DURATION_DAYS, featuredPriceLabel } from "@/lib/jobs/featuredOffer";

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

  return (
    <div className="w-full max-w-lg">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
        Get started
      </p>
      <h1 className="mb-1 font-sans text-3xl font-bold leading-tight text-ink md:text-4xl">
        Create an account.
      </h1>
      <p className="mb-10 font-sans text-sm text-secondary">
        Choose how you want to use Nuclear Hustle. Both accounts are free.
      </p>

      <div className="space-y-3">
        <Link
          href={withRedirect("/signup/job-seeker", redirect)}
          className="group flex items-center justify-between gap-4 border border-control p-6 transition-colors duration-150 hover:bg-surface"
        >
          <div>
            <h2 className="mb-1 font-sans text-base font-semibold text-ink">
              I&apos;m looking for a job
            </h2>
            <p className="font-sans text-sm leading-relaxed text-secondary">
              Save roles, apply with one stored resume, track every application, and get
              new jobs by email each Monday.
            </p>
          </div>
          <span className="shrink-0 text-secondary group-hover:text-ink" aria-hidden="true">
            →
          </span>
        </Link>

        <Link
          href={withRedirect("/signup/employer", redirect)}
          className="group flex items-center justify-between gap-4 border border-control p-6 transition-colors duration-150 hover:bg-surface"
        >
          <div>
            <h2 className="mb-1 font-sans text-base font-semibold text-ink">
              I&apos;m hiring
            </h2>
            <p className="font-sans text-sm leading-relaxed text-secondary">
              Post roles for free and receive applications with CVs in one inbox. Featuring
              a listing for {FEATURED_DURATION_DAYS} days costs {featuredPriceLabel()}.
            </p>
          </div>
          <span className="shrink-0 text-secondary group-hover:text-ink" aria-hidden="true">
            →
          </span>
        </Link>
      </div>

      <p className="mt-8 font-sans text-sm text-secondary">
        Already have an account?{" "}
        <Link href={withRedirect("/login", redirect)} className="font-semibold text-ink underline underline-offset-2">
          Log in →
        </Link>
      </p>
    </div>
  );
}
