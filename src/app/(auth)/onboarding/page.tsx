import Link from "next/link";
import { signInWithGoogle } from "@/lib/auth/actions";

export const metadata = {
  title: "Complete Sign Up - Nuclear Hustle",
};

export default function OnboardingPage() {
  return (
    <div className="w-full max-w-lg">
      <h1 className="font-mono text-2xl font-bold text-stone-900 mb-2">
        One more step.
      </h1>
      <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-8">
        How will you use Nuclear Hustle?
      </p>

      <div className="grid gap-4">
        {/* Job Seeker */}
        <form action={signInWithGoogle}>
          <input type="hidden" name="role" value="job_seeker" />
          <button
            type="submit"
            className="w-full text-left block p-6 border border-[#CFC8BC] hover:border-yellow-400 hover:bg-yellow-50 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-mono font-bold text-sm text-stone-900 group-hover:text-yellow-700">
                  I&apos;m looking for a job
                </p>
                <p className="mt-1 font-mono text-xs text-stone-500">
                  Browse jobs and get discovered by employers
                </p>
              </div>
            </div>
          </button>
        </form>

        {/* Employer */}
        <Link
          href="/onboarding/employer"
          className="block p-6 border border-[#CFC8BC] hover:border-yellow-400 hover:bg-yellow-50 transition-colors group"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="font-mono font-bold text-sm text-stone-900 group-hover:text-yellow-700">
                I&apos;m hiring
              </p>
              <p className="mt-1 font-mono text-xs text-stone-500">
                Post jobs and find qualified candidates
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
