import Link from "next/link";

export const metadata = {
  title: "Sign Up — Nuclear Hustle",
  description: "Create your Nuclear Hustle account",
};

export default function SignupPage() {
  return (
    <div className="w-full max-w-lg">
      <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-2">Get started</p>
      <h1 className="font-mono text-2xl font-bold text-stone-900 mb-1">Create an account.</h1>
      <p className="font-mono text-xs text-stone-400 mb-10">Choose how you want to use Nuclear Hustle</p>

      <div className="space-y-3">
        {/* Job Seeker */}
        <Link
          href="/signup/job-seeker"
          className="flex items-center justify-between gap-4 p-6 border border-[#CFC8BC] hover:border-stone-400 hover:bg-[#E5DFD5] transition-colors group"
        >
          <div>
            <h2 className="font-mono text-sm font-bold text-stone-900 group-hover:text-yellow-600 transition-colors mb-1">
              I&apos;m looking for a job
            </h2>
            <p className="font-mono text-xs text-stone-400 leading-relaxed">
              Create a profile, upload your resume, and get discovered by nuclear employers.
            </p>
          </div>
          <span className="font-mono text-stone-400 group-hover:text-stone-700 transition-colors shrink-0">→</span>
        </Link>

        {/* Employer */}
        <Link
          href="/signup/employer"
          className="flex items-center justify-between gap-4 p-6 border border-[#CFC8BC] hover:border-stone-400 hover:bg-[#E5DFD5] transition-colors group"
        >
          <div>
            <h2 className="font-mono text-sm font-bold text-stone-900 group-hover:text-yellow-600 transition-colors mb-1">
              I&apos;m hiring
            </h2>
            <p className="font-mono text-xs text-stone-400 leading-relaxed">
              Post job listings and reach qualified candidates in the nuclear industry.
            </p>
          </div>
          <span className="font-mono text-stone-400 group-hover:text-stone-700 transition-colors shrink-0">→</span>
        </Link>
      </div>

      <p className="mt-8 font-mono text-xs tracking-widest uppercase text-stone-400">
        Already have an account?{" "}
        <Link href="/login" className="text-stone-900 hover:text-yellow-600 transition-colors">
          Log in →
        </Link>
      </p>
    </div>
  );
}
