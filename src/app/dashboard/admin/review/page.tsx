'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StructuredDescription } from '@/lib/types';

interface ReviewJob {
  id: string;
  title: string;
  company_id: string;
  location: string;
  category: string;
  status: string;
  agent_confidence?: 'high' | 'low';
  review_notes?: string;
  structured_description?: StructuredDescription | null;
  description?: string;
}

function DescriptionPreview({ sd }: { sd: StructuredDescription }) {
  const fields = [
    { label: 'About this role', value: sd.about },
    { label: 'Responsibilities', value: sd.responsibilities },
    { label: 'Qualifications', value: sd.qualifications },
    { label: 'Desired', value: sd.desired },
    { label: 'Location / Working conditions', value: sd.location_details },
  ].filter(f => f.value?.trim());

  return (
    <div className="space-y-4">
      {fields.map(({ label, value }) => (
        <div key={label}>
          <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-1">{label}</p>
          <p className="font-mono text-xs text-stone-600 whitespace-pre-line leading-relaxed">{value}</p>
        </div>
      ))}
    </div>
  );
}

function EditableDescription({
  sd,
  onChange,
}: {
  sd: StructuredDescription;
  onChange: (updated: StructuredDescription) => void;
}) {
  const fields: { key: keyof StructuredDescription; label: string }[] = [
    { key: 'about', label: 'About this role' },
    { key: 'responsibilities', label: 'Responsibilities' },
    { key: 'qualifications', label: 'Qualifications' },
    { key: 'desired', label: 'Desired' },
    { key: 'location_details', label: 'Location / Working conditions' },
  ];

  return (
    <div className="space-y-4">
      {fields.map(({ key, label }) => (
        <div key={key}>
          <label className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-1 block">{label}</label>
          <textarea
            rows={4}
            value={sd[key] || ''}
            onChange={e => onChange({ ...sd, [key]: e.target.value })}
            className="w-full font-mono text-xs text-stone-700 bg-white border border-[#CFC8BC] px-3 py-2 focus:outline-none focus:border-stone-400 resize-y"
          />
        </div>
      ))}
    </div>
  );
}

function JobCard({
  job,
  adminEmail,
  onAction,
}: {
  job: ReviewJob;
  adminEmail: string;
  onAction: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editedSd, setEditedSd] = useState<StructuredDescription>(job.structured_description || {});
  const [processing, setProcessing] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);

  async function callApi(url: string, body: object) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-email': adminEmail },
      body: JSON.stringify(body),
    });
  }

  async function handleApprove() {
    setProcessing(true);
    await callApi('/api/admin/publish-job', {
      jobId: job.id,
      structured_description: editing ? editedSd : job.structured_description,
    });
    onAction();
  }

  async function handleReject() {
    setProcessing(true);
    await callApi('/api/admin/reject-job', { jobId: job.id });
    onAction();
  }

  async function handleReprocess() {
    setReprocessing(true);
    await callApi('/api/admin/process-job', { jobId: job.id });
    setReprocessing(false);
    onAction();
  }

  const isLow = job.agent_confidence === 'low';

  return (
    <div className={`border ${isLow ? 'border-yellow-400' : 'border-[#CFC8BC]'} bg-white`}>
      {/* Header */}
      <div className={`px-5 py-4 border-b ${isLow ? 'border-yellow-400 bg-yellow-50' : 'border-[#CFC8BC] bg-[#EDE8DF]'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isLow && (
                <span className="font-mono text-[10px] tracking-widest uppercase bg-yellow-400 text-stone-900 px-2 py-0.5">
                  Review carefully
                </span>
              )}
              <span className="font-mono text-[10px] tracking-widest uppercase text-stone-400 border border-[#CFC8BC] px-2 py-0.5">
                {job.category}
              </span>
            </div>
            <h3 className="font-mono text-sm font-bold text-stone-900">{job.title}</h3>
            <p className="font-mono text-xs text-stone-500 mt-0.5">{job.company_id} · {job.location}</p>
          </div>
          <button
            onClick={handleReprocess}
            disabled={reprocessing || processing}
            className="font-mono text-[10px] tracking-widest uppercase text-stone-400 hover:text-stone-700 border border-[#CFC8BC] px-2 py-1 disabled:opacity-40 whitespace-nowrap"
          >
            {reprocessing ? 'Running…' : 'Re-run AI'}
          </button>
        </div>

        {job.review_notes && (
          <div className="mt-3 font-mono text-xs text-stone-500 bg-white border border-[#CFC8BC] px-3 py-2">
            <span className="text-stone-400 uppercase tracking-widest text-[10px]">Agent notes: </span>
            {job.review_notes}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="px-5 py-5">
        {job.structured_description ? (
          editing ? (
            <EditableDescription sd={editedSd} onChange={setEditedSd} />
          ) : (
            <DescriptionPreview sd={job.structured_description} />
          )
        ) : (
          <p className="font-mono text-xs text-stone-400 italic">No structured description — click Re-run AI to process.</p>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-[#CFC8BC] flex items-center gap-3">
        <button
          onClick={handleApprove}
          disabled={processing}
          className="font-mono text-xs tracking-widest uppercase px-4 py-2 bg-stone-900 hover:bg-stone-700 text-white font-bold transition-colors disabled:opacity-40"
        >
          {processing ? 'Saving…' : 'Approve'}
        </button>
        <button
          onClick={() => { setEditing(e => !e); setEditedSd(job.structured_description || {}); }}
          disabled={processing}
          className="font-mono text-xs tracking-widest uppercase px-4 py-2 border border-[#CFC8BC] hover:bg-[#E5DFD5] text-stone-700 transition-colors disabled:opacity-40"
        >
          {editing ? 'Cancel edit' : 'Edit'}
        </button>
        <button
          onClick={handleReject}
          disabled={processing}
          className="font-mono text-xs tracking-widest uppercase px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 transition-colors disabled:opacity-40"
        >
          Reject
        </button>
        <Link
          href={`/job/${job.id}`}
          target="_blank"
          className="ml-auto font-mono text-[10px] tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors"
        >
          Preview →
        </Link>
      </div>
    </div>
  );
}

export default function ReviewQueuePage() {
  const [jobs, setJobs] = useState<ReviewJob[]>([]);
  const [loading, setLoading] = useState(true);
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/review-queue');
    if (res.ok) {
      const data = await res.json();
      setJobs(data.jobs);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending = jobs.filter(j => j.status === 'pending_review');
  const lowConf = pending.filter(j => j.agent_confidence === 'low');
  const highConf = pending.filter(j => j.agent_confidence !== 'low');
  const sorted = [...lowConf, ...highConf];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <Link href="/dashboard/admin" className="font-mono text-xs tracking-widest uppercase text-stone-400 hover:text-stone-700">
          ← Admin
        </Link>
        <h1 className="font-mono text-2xl font-bold text-stone-900 mt-3">Review Queue</h1>
        <p className="font-mono text-xs text-stone-500 mt-1">
          {pending.length} job{pending.length !== 1 ? 's' : ''} pending review
          {lowConf.length > 0 && ` · ${lowConf.length} flagged for closer attention`}
        </p>
      </div>

      {loading ? (
        <p className="font-mono text-xs text-stone-400">Loading…</p>
      ) : sorted.length === 0 ? (
        <div className="border border-[#CFC8BC] bg-white px-6 py-10 text-center">
          <p className="font-mono text-sm text-stone-500">No jobs pending review.</p>
          <p className="font-mono text-xs text-stone-400 mt-2">Run the scraper to add new jobs to the queue.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sorted.map(job => (
            <JobCard
              key={job.id}
              job={job}
              adminEmail={adminEmail}
              onAction={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
