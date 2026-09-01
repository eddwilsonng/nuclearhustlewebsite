import Link from "next/link";
import { EmployerSignupForm } from "@/components/auth/EmployerSignupForm";

export const metadata = {
  title: "Employer Sign Up — Nuclear Hustle",
  description: "Create your employer account on Nuclear Hustle",
};

export default function EmployerSignupPage() {
  return (
    <div className="w-full max-w-lg">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
        Employer
      </p>
      <h1 className="mb-1 font-sans text-3xl font-bold leading-tight text-ink md:text-4xl">
        Post jobs, find talent.
      </h1>
      <p className="mb-10 font-sans text-sm text-secondary">
        Reach qualified nuclear industry professionals
      </p>

      <EmployerSignupForm />

      <div className="mt-8 space-y-2 border-t border-rule pt-6">
        <p className="font-sans text-sm text-secondary">
          Looking for a job?{" "}
          <Link href="/signup/job-seeker" className="font-semibold text-ink underline underline-offset-2">
            Job seeker sign up →
          </Link>
        </p>
        <p className="font-sans text-sm text-secondary">
          Have an account?{" "}
          <Link href="/login" className="font-semibold text-ink underline underline-offset-2">
            Log in →
          </Link>
        </p>
      </div>
    </div>
  );
}
