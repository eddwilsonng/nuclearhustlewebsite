'use client';

import { useActionState } from 'react';
import { updateEmployerProfile, type ActionState } from '@/lib/auth/actions';
import type { Profile, EmployerProfile } from '@/lib/types';

export function EmployerProfileForm({
  profile,
  employerProfile,
}: {
  profile: Profile;
  employerProfile: EmployerProfile | null;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateEmployerProfile,
    {}
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Company Profile</h1>

      <div className="bg-[#EDE8DF] rounded-lg border border-[#CFC8BC] p-6">
        {state.error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
            Profile updated successfully!
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-stone-700 mb-1">
              Your Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              defaultValue={profile.full_name}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              disabled
              value={profile.email}
              className="w-full px-3 py-2 border border-[#CFC8BC] rounded-md bg-[#E5DFD5] text-stone-500"
            />
            <p className="mt-1 text-xs text-stone-500">Email cannot be changed</p>
          </div>

          <hr className="my-6" />

          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-stone-700 mb-1">
              Company Name
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              defaultValue={employerProfile?.company_name || ''}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="companyWebsite" className="block text-sm font-medium text-stone-700 mb-1">
              Company Website
            </label>
            <input
              id="companyWebsite"
              name="companyWebsite"
              type="url"
              defaultValue={employerProfile?.company_website || ''}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="https://company.com"
            />
          </div>

          <div>
            <label htmlFor="companyDescription" className="block text-sm font-medium text-stone-700 mb-1">
              Company Description
            </label>
            <textarea
              id="companyDescription"
              name="companyDescription"
              rows={4}
              defaultValue={employerProfile?.company_description || ''}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Tell job seekers about your company..."
            />
          </div>

          <div>
            <label htmlFor="companyLogo" className="block text-sm font-medium text-stone-700 mb-1">
              Company Logo
            </label>
            {employerProfile?.company_logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={employerProfile.company_logo_url}
                alt="Current company logo"
                className="h-14 w-14 object-contain border border-[#CFC8BC] bg-white mb-2"
              />
            )}
            <input
              id="companyLogo"
              name="companyLogo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="w-full text-sm text-stone-700 file:mr-3 file:py-2 file:px-3 file:border file:border-stone-300 file:bg-[#E5DFD5] file:text-stone-700 file:font-medium hover:file:bg-[#CFC8BC]"
            />
            <p className="mt-1 text-xs text-stone-500">
              PNG, JPG, WEBP, or SVG. Max 2MB. Shown on your job listings.
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-300 text-stone-900 font-semibold rounded-md transition-colors"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
