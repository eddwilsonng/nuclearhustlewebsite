'use client';

import { useActionState, useState } from 'react';
import { updateJobSeekerProfile, type ActionState } from '@/lib/auth/actions';
import { ResumeUpload } from '@/components/dashboard/ResumeUpload';
import { US_STATES } from '@/lib/states';
import type { Profile, JobSeekerProfile } from '@/lib/types';

export function JobSeekerProfileForm({
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
  const [isActivelyLooking, setIsActivelyLooking] = useState(
    jobSeekerProfile?.is_actively_looking ?? true
  );

  return (
    <div className="max-w-2xl">
      <h1 className="font-mono text-2xl font-bold text-stone-900 mb-6">My Profile</h1>

      <div className="bg-[#EDE8DF] border border-[#CFC8BC] p-6 mb-6">
        <h2 className="font-mono text-sm font-bold tracking-widest uppercase text-stone-900 mb-4">
          Personal Information
        </h2>

        {state.error && (
          <div className="mb-4 p-3 font-mono text-xs text-red-600 border border-red-200 bg-red-50">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="mb-4 p-3 font-mono text-xs text-green-600 border border-green-200 bg-green-50">
            Profile updated successfully!
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block font-mono text-xs tracking-widest uppercase text-stone-400 mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              defaultValue={profile.full_name}
              className="w-full px-3 py-2.5 border border-[#CFC8BC] font-mono text-sm text-stone-900 bg-[#EDE8DF] focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="email" className="block font-mono text-xs tracking-widest uppercase text-stone-400 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              disabled
              value={profile.email}
              className="w-full px-3 py-2.5 border border-[#CFC8BC] font-mono text-sm text-stone-500 bg-[#E5DFD5]"
            />
            <p className="mt-1.5 font-mono text-[10px] text-stone-400">Email cannot be changed</p>
          </div>

          <div>
            <label htmlFor="phone" className="block font-mono text-xs tracking-widest uppercase text-stone-400 mb-2">
              Phone <span className="text-stone-300 normal-case tracking-normal">(optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={jobSeekerProfile?.phone || ''}
              className="w-full px-3 py-2.5 border border-[#CFC8BC] font-mono text-sm text-stone-900 bg-[#EDE8DF] focus:outline-none focus:border-yellow-400 transition-colors placeholder:text-stone-300"
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="block font-mono text-xs tracking-widest uppercase text-stone-400 mb-2">
                City <span className="text-stone-300 normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id="location"
                name="location"
                type="text"
                defaultValue={jobSeekerProfile?.location || ''}
                className="w-full px-3 py-2.5 border border-[#CFC8BC] font-mono text-sm text-stone-900 bg-[#EDE8DF] focus:outline-none focus:border-yellow-400 transition-colors placeholder:text-stone-300"
                placeholder="Chicago"
              />
            </div>
            <div>
              <label htmlFor="state" className="block font-mono text-xs tracking-widest uppercase text-stone-400 mb-2">
                State <span className="text-stone-300 normal-case tracking-normal">(optional)</span>
              </label>
              <select
                id="state"
                name="state"
                defaultValue={jobSeekerProfile?.state || ''}
                className="w-full px-3 py-2.5 border border-[#CFC8BC] font-mono text-sm text-stone-900 bg-[#EDE8DF] focus:outline-none focus:border-yellow-400 transition-colors"
              >
                <option value="">Select a state</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <span className="block font-mono text-xs tracking-widest uppercase text-stone-400 mb-2">
              Looking Status
            </span>
            <input type="hidden" name="isActivelyLooking" value={String(isActivelyLooking)} />
            <div className="border border-[#CFC8BC] p-1 flex gap-1">
              <button
                type="button"
                onClick={() => setIsActivelyLooking(true)}
                className={`flex-1 font-mono text-xs tracking-widest uppercase py-2 transition-colors ${
                  isActivelyLooking ? 'bg-yellow-400 text-stone-900' : 'text-stone-400 hover:text-stone-900'
                }`}
              >
                Open to opportunities
              </button>
              <button
                type="button"
                onClick={() => setIsActivelyLooking(false)}
                className={`flex-1 font-mono text-xs tracking-widest uppercase py-2 transition-colors ${
                  !isActivelyLooking ? 'bg-yellow-400 text-stone-900' : 'text-stone-400 hover:text-stone-900'
                }`}
              >
                Not looking
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-200 text-stone-900 font-mono text-xs tracking-widest uppercase font-bold transition-colors"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="bg-[#EDE8DF] border border-[#CFC8BC] p-6">
        <h2 className="font-mono text-sm font-bold tracking-widest uppercase text-stone-900 mb-4">Resume</h2>
        <ResumeUpload
          currentResumeUrl={jobSeekerProfile?.resume_url || null}
          currentFilename={jobSeekerProfile?.resume_filename || null}
        />
      </div>
    </div>
  );
}
