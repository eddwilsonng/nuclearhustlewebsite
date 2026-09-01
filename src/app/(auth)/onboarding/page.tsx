import Link from "next/link";
import { signInWithGoogle } from "@/lib/auth/actions";

export const metadata = {
  title: "Complete Sign Up - Nuclear Hustle",
};

export default function OnboardingPage() {
  return (
    <div className="w-full max-w-lg">
      <h1 className="mb-2 font-sans text-3xl font-bold leading-tight text-ink md:text-4xl">
        One more step.
      </h1>
      <p className="mb-8 font-mono text-xs uppercase tracking-widest text-secondary">
        How will you use Nuclear Hustle?
      </p>

      <div className="grid gap-4">
        <form action={signInWithGoogle}>
          <input type="hidden" name="role" value="job_seeker" />
          <button
            type="submit"
            className="group block w-full border border-control p-6 text-left hover:bg-surface"
          >
            <p className="font-sans text-base font-semibold text-ink">
              I&apos;m looking for a job
            </p>
            <p className="mt-1 font-sans text-sm text-secondary">
              Browse jobs and get discovered by employers
            </p>
          </button>
        </form>

        <Link
          href="/onboarding/employer"
          className="group block border border-control p-6 hover:bg-surface"
        >
          <p className="font-sans text-base font-semibold text-ink">
            I&apos;m hiring
          </p>
          <p className="mt-1 font-sans text-sm text-secondary">
            Post jobs and find qualified candidates
          </p>
        </Link>
      </div>
    </div>
  );
}
