import Link from "next/link";

export const metadata = {
  title: "Sign Up - Nuclear Hustle",
  description: "Create your Nuclear Hustle account",
};

export default function SignupPage() {
  return (
    <div className="w-full max-w-lg">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Create an Account
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Choose how you want to use Nuclear Hustle
        </p>

        <div className="grid gap-4">
          {/* Job Seeker Card */}
          <Link
            href="/signup/job-seeker"
            className="block p-6 border border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
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
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-yellow-700">
                  I&apos;m looking for a job
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Create a profile, upload your resume, and get discovered by
                  employers in the nuclear industry.
                </p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          {/* Employer Card */}
          <Link
            href="/signup/employer"
            className="block p-6 border border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
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
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-yellow-700">
                  I&apos;m hiring
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Post job listings and reach qualified candidates in the
                  nuclear power industry.
                </p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
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
  );
}
