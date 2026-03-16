'use client';

import { useActionState, useEffect, useState } from 'react';
import { updateJobSeekerProfile, updateEmployerProfile, type ActionState } from '@/lib/auth/actions';
import { ResumeUpload } from '@/components/dashboard/ResumeUpload';
import { createClient } from '@/lib/supabase/client';
import type { Profile, JobSeekerProfile, EmployerProfile } from '@/lib/types';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobSeekerProfile, setJobSeekerProfile] = useState<JobSeekerProfile | null>(null);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);

        if (profileData.role === 'job_seeker') {
          const { data: jsProfile } = await supabase
            .from('job_seeker_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          setJobSeekerProfile(jsProfile as JobSeekerProfile);
        } else {
          const { data: empProfile } = await supabase
            .from('employer_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          setEmployerProfile(empProfile as EmployerProfile);
        }
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  if (profile.role === 'job_seeker') {
    return (
      <JobSeekerProfileForm
        profile={profile}
        jobSeekerProfile={jobSeekerProfile}
      />
    );
  }

  return (
    <EmployerProfileForm
      profile={profile}
      employerProfile={employerProfile}
    />
  );
}

function JobSeekerProfileForm({
  profile,
  jobSeekerProfile,
}: {
  profile: Profile;
  jobSeekerProfile: JobSeekerProfile | null;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateJobSeekerProfile,
    {}
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>

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
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              defaultValue={profile.full_name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              disabled
              value={profile.email}
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              defaultValue={jobSeekerProfile?.location || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="e.g., Chicago, IL"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-300 text-gray-900 font-semibold rounded-md transition-colors"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resume</h2>
        <ResumeUpload
          currentResumeUrl={jobSeekerProfile?.resume_url || null}
          currentFilename={jobSeekerProfile?.resume_filename || null}
        />
      </div>
    </div>
  );
}

function EmployerProfileForm({
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Company Profile</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
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
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              defaultValue={profile.full_name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              disabled
              value={profile.email}
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>

          <hr className="my-6" />

          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              defaultValue={employerProfile?.company_name || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700 mb-1">
              Company Website
            </label>
            <input
              id="companyWebsite"
              name="companyWebsite"
              type="url"
              defaultValue={employerProfile?.company_website || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="https://company.com"
            />
          </div>

          <div>
            <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Company Description
            </label>
            <textarea
              id="companyDescription"
              name="companyDescription"
              rows={4}
              defaultValue={employerProfile?.company_description || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Tell job seekers about your company..."
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-300 text-gray-900 font-semibold rounded-md transition-colors"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
