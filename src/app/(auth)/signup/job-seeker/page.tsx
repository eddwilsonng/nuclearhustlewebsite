import Link from "next/link";
import { JobSeekerSignupForm } from "@/components/auth/JobSeekerSignupForm";

export const metadata = {
  title: "Job Seeker Sign Up - Nuclear Hustle",
  description: "Create your job seeker account on Nuclear Hustle",
};

export default function JobSeekerSignupPage() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Job Seeker</h1>
            <p className="text-sm text-gray-600">Create your profile</p>
          </div>
        </div>

        <JobSeekerSignupForm />

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Looking to hire instead?{" "}
            <Link
              href="/signup/employer"
              className="text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Sign up as employer
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
