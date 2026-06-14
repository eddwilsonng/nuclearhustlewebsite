'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
import { createJobPosting, updateJobPosting, type ActionState } from '@/lib/auth/actions';
import type { EmployerJob } from '@/lib/types';

interface JobPostingFormProps {
  job?: EmployerJob;
  mode: 'create' | 'edit';
  customAction?: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}

const CATEGORIES = [
  { value: 'operations', label: 'Operations' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'health-physics', label: 'Health Physics' },
  { value: 'security', label: 'Security' },
  { value: 'training', label: 'Training & Licensing' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'other', label: 'Other' },
];

const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'internship', label: 'Internship' },
];

export function JobPostingForm({ job, mode, customAction }: JobPostingFormProps) {
  const action = customAction || (mode === 'create' ? createJobPosting : updateJobPosting);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, {});
  const errorRef = useRef<HTMLDivElement>(null);

  // Controlled field state — preserves values when action returns an error
  const [title, setTitle] = useState(job?.title ?? '');
  const [location, setLocation] = useState(job?.location ?? '');
  const [category, setCategory] = useState(job?.category ?? '');
  const [employmentType, setEmploymentType] = useState(job?.employment_type ?? 'full-time');
  const [applicationType, setApplicationType] = useState<'link' | 'form'>(
    job?.application_type ?? 'link'
  );
  const [applicationUrl, setApplicationUrl] = useState(job?.application_url ?? '');
  const [applicationEmail, setApplicationEmail] = useState(job?.application_email ?? '');

  // Inline featured-listing upgrade (create flow only)
  const [feature, setFeature] = useState(false);

  // Structured description fields
  const sd = job?.structured_description;
  const [about, setAbout] = useState(sd?.about ?? '');
  const [responsibilities, setResponsibilities] = useState(sd?.responsibilities ?? '');
  const [qualifications, setQualifications] = useState(sd?.qualifications ?? '');
  const [desired, setDesired] = useState(sd?.desired ?? '');
  const [locationDetails, setLocationDetails] = useState(sd?.location_details ?? '');
  const [whatWeOffer, setWhatWeOffer] = useState(sd?.what_we_offer ?? '');

  // Scroll error into view whenever it appears
  useEffect(() => {
    if (state.error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [state.error]);

  return (
    <form action={formAction} className="space-y-6">
      {job && <input type="hidden" name="jobId" value={job.id} />}
      <input type="hidden" name="applicationType" value={applicationType} />

      {state.error && (
        <div
          ref={errorRef}
          className="p-4 text-sm text-red-700 bg-red-50 border border-red-300 rounded-md flex items-start gap-2"
        >
          <span className="mt-0.5 flex-shrink-0">⚠️</span>
          <span>{state.error}</span>
        </div>
      )}

      {state.success && mode === 'edit' && (
        <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
          Job posting updated successfully!
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-stone-700 mb-1">
          Job Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          placeholder="e.g., Senior Reactor Operator"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-stone-700 mb-1">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="e.g., Charlotte, NC"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-stone-700 mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="employmentType" className="block text-sm font-medium text-stone-700 mb-1">
          Employment Type
        </label>
        <select
          id="employmentType"
          name="employmentType"
          value={employmentType}
          onChange={(e) => setEmploymentType(e.target.value)}
          className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        >
          {EMPLOYMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Application method */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-3">
          How should candidates apply?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setApplicationType('link')}
            className={`flex items-start gap-3 p-4 border rounded-md text-left transition-colors ${
              applicationType === 'link'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-[#CFC8BC] hover:border-stone-300'
            }`}
          >
            <span className={`mt-0.5 text-lg leading-none ${applicationType === 'link' ? 'opacity-100' : 'opacity-30'}`}>🔗</span>
            <div>
              <p className="text-sm font-medium text-stone-900">Link to careers page</p>
              <p className="text-xs text-stone-500 mt-0.5">Redirect applicants to your website</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setApplicationType('form')}
            className={`flex items-start gap-3 p-4 border rounded-md text-left transition-colors ${
              applicationType === 'form'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-[#CFC8BC] hover:border-stone-300'
            }`}
          >
            <span className={`mt-0.5 text-lg leading-none ${applicationType === 'form' ? 'opacity-100' : 'opacity-30'}`}>✉️</span>
            <div>
              <p className="text-sm font-medium text-stone-900">Receive by email</p>
              <p className="text-xs text-stone-500 mt-0.5">Applications sent to your inbox</p>
            </div>
          </button>
        </div>

        <div className="mt-3">
          {applicationType === 'link' ? (
            <div>
              <label htmlFor="applicationUrl" className="block text-sm font-medium text-stone-700 mb-1">
                Application URL <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <input
                id="applicationUrl"
                name="applicationUrl"
                type="url"
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="https://yourcompany.com/apply"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="applicationEmail" className="block text-sm font-medium text-stone-700 mb-1">
                Application email
              </label>
              <input
                id="applicationEmail"
                name="applicationEmail"
                type="email"
                required={applicationType === 'form'}
                value={applicationEmail}
                onChange={(e) => setApplicationEmail(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="hiring@yourcompany.com"
              />
              <p className="mt-1 text-xs text-stone-500">
                Applications will be emailed here with the candidate&apos;s CV attached.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Structured description */}
      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium text-stone-700 mb-1">Job Description</p>
          <p className="text-xs text-stone-400 mb-4">Fill in the sections that apply — none are required individually.</p>
        </div>

        {[
          { id: 'about', label: 'About this role', value: about, onChange: setAbout, placeholder: 'Overview of the position and what makes it exciting...' },
          { id: 'responsibilities', label: 'Responsibilities', value: responsibilities, onChange: setResponsibilities, placeholder: '• Operate and monitor reactor systems\n• Conduct routine inspections...' },
          { id: 'qualifications', label: 'Qualifications', value: qualifications, onChange: setQualifications, placeholder: '• NRC Senior Reactor Operator license\n• 5+ years experience...' },
          { id: 'desired', label: 'Desired', value: desired, onChange: setDesired, placeholder: 'Nice-to-have skills or experience...' },
          { id: 'locationDetails', label: 'Location', value: locationDetails, onChange: setLocationDetails, placeholder: 'Details about the work location, remote policy, relocation...' },
          { id: 'whatWeOffer', label: 'What we offer', value: whatWeOffer, onChange: setWhatWeOffer, placeholder: '• Competitive salary\n• Healthcare and pension\n• Relocation assistance...' },
        ].map(({ id, label, value, onChange, placeholder }) => (
          <div key={id}>
            <label htmlFor={id} className="block text-sm font-medium text-stone-700 mb-1">
              {label}
            </label>
            <textarea
              id={id}
              name={id}
              rows={4}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder={placeholder}
            />
          </div>
        ))}
      </div>

      {/* Featured-listing upgrade — create flow only */}
      {mode === 'create' && (
        <div>
          <input type="hidden" name="feature" value={feature ? 'on' : ''} />
          <button
            type="button"
            onClick={() => setFeature((f) => !f)}
            aria-pressed={feature}
            className={`w-full flex items-start gap-3 p-4 border text-left transition-colors ${
              feature ? 'border-yellow-400 bg-yellow-50' : 'border-[#CFC8BC] hover:border-stone-400 bg-[#EDE8DF]'
            }`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center border ${
                feature ? 'border-yellow-500 bg-yellow-400 text-stone-900' : 'border-[#CFC8BC] bg-white text-transparent'
              }`}
            >
              ✓
            </span>
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-stone-900 font-bold">
                ★ Feature this listing — $99
              </p>
              <p className="font-mono text-xs text-stone-500 mt-1 normal-case tracking-normal">
                Pin it to the top of the board and homepage for 30 days. You&apos;ll be taken to secure
                checkout after posting. Skip to publish for free.
              </p>
            </div>
          </button>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-300 text-stone-900 font-semibold rounded-md transition-colors"
        >
          {isPending
            ? mode === 'create' ? (feature ? 'Posting…' : 'Creating...') : 'Saving...'
            : mode === 'create' ? (feature ? 'Post & Feature →' : 'Post Job') : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
