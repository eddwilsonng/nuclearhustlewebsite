'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
import { adminUpdateScrapedJob } from '@/lib/admin/actions';
import type { ActionState } from '@/lib/auth/actions';

interface ScrapedJob {
  id: string;
  title: string;
  location: string;
  category: string;
  url: string;
  description?: string;
}

interface ScrapedJobFormProps {
  job: ScrapedJob;
}

const CATEGORIES = [
  { value: 'operations', label: 'Operations' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'health-physics', label: 'Health Physics' },
  { value: 'security', label: 'Security' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'other', label: 'Other' },
];

export function ScrapedJobForm({ job }: ScrapedJobFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    adminUpdateScrapedJob,
    {}
  );
  const errorRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(job.title);
  const [location, setLocation] = useState(job.location);
  const [category, setCategory] = useState(job.category);
  const [url, setUrl] = useState(job.url);
  const [description, setDescription] = useState(job.description || '');

  useEffect(() => {
    if (state.error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [state.error]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="jobId" value={job.id} />

      {state.error && (
        <div
          ref={errorRef}
          className="p-4 text-sm text-red-700 bg-red-50 border border-red-300 rounded-md"
        >
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
          Job updated successfully!
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Job Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
          Source URL
        </label>
        <input
          id="url"
          name="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={10}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-300 text-gray-900 font-semibold rounded-md transition-colors"
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
