"use client";

import { useActionState } from "react";
import { signUpJobSeeker, signInWithGoogle, type ActionState } from "@/lib/auth/actions";

export function JobSeekerSignupForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    signUpJobSeeker,
    {}
  );

  return (
    <div className="space-y-4">
      <form action={signInWithGoogle}>
        <input type="hidden" name="role" value="job_seeker" />
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">or sign up with email</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Full Name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          placeholder="••••••••"
        />
        <p className="mt-1 text-xs text-gray-500">
          Must be at least 6 characters
        </p>
      </div>

      <div>
        <label
          htmlFor="location"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Location{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="location"
          name="location"
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          placeholder="Chicago, IL"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-300 text-gray-900 font-semibold rounded-md transition-colors"
      >
        {isPending ? "Creating Account..." : "Create Account"}
      </button>
    </form>
    </div>
  );
}
