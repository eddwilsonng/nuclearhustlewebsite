import Link from "next/link";
import { JobSeekerSignupForm } from "@/components/auth/JobSeekerSignupForm";

export const metadata = {
  title: "Job Seeker Sign Up — Nuclear Hustle",
  description: "Create your job seeker account on Nuclear Hustle",
};

export default function JobSeekerSignupPage() {
  return (
    <div className="w-full max-w-md">
      <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-2">Job seeker</p>
      <h1 className="font-mono text-2xl font-bold text-stone-900 mb-1">Create your profile.</h1>
      <p className="font-mono text-xs text-stone-400 mb-10">Find your next nuclear role</p>

      <JobSeekerSignupForm />

      <div className="mt-8 pt-6 border-t border-[#CFC8BC] space-y-2">
        <p className="font-mono text-xs tracking-widest uppercase text-stone-400">
          Hiring instead?{" "}
          <Link href="/signup/employer" className="text-stone-900 hover:text-yellow-600 transition-colors">
            Employer sign up →
          </Link>
        </p>
        <p className="font-mono text-xs tracking-widest uppercase text-stone-400">
          Have an account?{" "}
          <Link href="/login" className="text-stone-900 hover:text-yellow-600 transition-colors">
            Log in →
          </Link>
        </p>
      </div>
    </div>
  );
}
