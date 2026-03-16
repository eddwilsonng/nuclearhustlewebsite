import Link from "next/link";
import { EmployerSignupForm } from "@/components/auth/EmployerSignupForm";

export const metadata = {
  title: "Employer Sign Up - Nuclear Hustle",
  description: "Create your employer account on Nuclear Hustle",
};

export default function EmployerSignupPage() {
  return (
    <div className="w-full max-w-lg">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Employer</h1>
            <p className="text-sm text-gray-600">Post jobs and find talent</p>
          </div>
        </div>

        <EmployerSignupForm />

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Looking for a job instead?{" "}
            <Link
              href="/signup/job-seeker"
              className="text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Sign up as job seeker
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
