import Link from "next/link";
import { EmployerSignupForm } from "@/components/auth/EmployerSignupForm";

export const metadata = {
  title: "Employer Sign Up — Nuclear Hustle",
  description: "Create your employer account on Nuclear Hustle",
};

export default function EmployerSignupPage() {
  return (
    <div className="w-full max-w-lg">
      <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-2">Employer</p>
      <h1 className="font-mono text-2xl font-bold text-stone-900 mb-1">Post jobs, find talent.</h1>
      <p className="font-mono text-xs text-stone-400 mb-10">Reach qualified nuclear industry professionals</p>

      <EmployerSignupForm />

      <div className="mt-8 pt-6 border-t border-[#CFC8BC] space-y-2">
        <p className="font-mono text-xs tracking-widest uppercase text-stone-400">
          Looking for a job?{" "}
          <Link href="/signup/job-seeker" className="text-stone-900 hover:text-yellow-600 transition-colors">
            Job seeker sign up →
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
