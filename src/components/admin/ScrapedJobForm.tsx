'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
import { adminUpdateScrapedJob } from '@/lib/admin/actions';
import type { ActionState } from '@/lib/auth/actions';
import { Button } from '@/components/ui/Button';
import { SelectField, TextareaField, TextField } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { DashboardAlert } from '@/components/dashboard/DashboardChrome';

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
  { value: 'training', label: 'Training & Licensing' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'other', label: 'Other' },
];

export function ScrapedJobForm({ job }: ScrapedJobFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    adminUpdateScrapedJob,
    {}
  );
  const toast = useToast();
  const errorRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(job.title);
  const [location, setLocation] = useState(job.location);
  const [category, setCategory] = useState(job.category);
  const [url, setUrl] = useState(job.url);
  const [description, setDescription] = useState(job.description || '');

  useEffect(() => {
    if (state.error) errorRef.current?.scrollIntoView({ block: 'center' });
    if (state.success) toast.success('Changes saved.');
    // Runs once per submit result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="jobId" value={job.id} />

      {state.error && (
        <div ref={errorRef}>
          <DashboardAlert tone="error">{state.error}</DashboardAlert>
        </div>
      )}

      <TextField
        id="title"
        label="Job title"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <TextField
          id="location"
          label="Location"
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <SelectField
          id="category"
          label="Category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </SelectField>
      </div>

      <TextField
        id="url"
        label="Source URL"
        type="url"
        optional
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <TextareaField
        id="description"
        label="Description"
        optional
        rows={10}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
