'use client';

import { useMemo, useState, useTransition } from 'react';
import { ArrowUp, ArrowDown, X, Download } from 'lucide-react';
import { formatLinkedInPost, type PostMeta } from '@/lib/linkedin/format';
import { publishWeeklyPicks } from '@/lib/weekly/actions';
import { LinkedInPostPanel } from './LinkedInPostPanel';

export interface EditorPick {
  slug: string;
  title: string;
  company: string;
  location: string;
  salaryLabel: string | null;
  category: string;
  isEmployerJob: boolean;
  score: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  engineering: 'Engineering',
  operations: 'Operations',
  maintenance: 'Maintenance',
  'health-physics': 'Health Physics',
  security: 'Security',
  training: 'Training',
  administrative: 'Administrative',
  other: 'Other',
};

const LABEL = 'font-mono text-[10px] tracking-widest uppercase text-stone-400';

export function WeeklyCurationEditor({
  initialPicks,
  meta,
  isPublished,
}: {
  initialPicks: EditorPick[];
  meta: PostMeta;
  isPublished: boolean;
}) {
  const [picks, setPicks] = useState<EditorPick[]>(initialPicks);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [pending, startTransition] = useTransition();

  const { post, comment } = useMemo(
    () =>
      formatLinkedInPost(
        picks.map((p) => ({
          title: p.title,
          company: p.company,
          location: p.location,
          salaryLabel: p.salaryLabel,
        })),
        meta
      ),
    [picks, meta]
  );

  function touch() {
    setDirty(true);
    setStatus('idle');
  }

  function remove(slug: string) {
    setPicks((ps) => ps.filter((p) => p.slug !== slug));
    touch();
  }

  function move(index: number, dir: -1 | 1) {
    setPicks((ps) => {
      const target = index + dir;
      if (target < 0 || target >= ps.length) return ps;
      const next = [...ps];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    touch();
  }

  function publish() {
    startTransition(async () => {
      const res = await publishWeeklyPicks(picks.map((p) => p.slug));
      if (res.ok) {
        setStatus('saved');
        setDirty(false);
      } else {
        setStatus('error');
        setErrorMsg(res.error ?? 'Failed to publish.');
      }
    });
  }

  const publishLabel = pending
    ? 'Publishing…'
    : isPublished || status === 'saved'
    ? 'Re-publish'
    : 'Publish this week';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: the two copy blocks */}
      <div className="space-y-6">
        <div>
          <p className={`${LABEL} mb-3`}>Post copy</p>
          <LinkedInPostPanel text={post} />
        </div>
        <div>
          <p className={`${LABEL} mb-3`}>First comment</p>
          <LinkedInPostPanel text={comment} />
        </div>
        <div>
          <p className={`${LABEL} mb-3`}>Post image</p>
          <div className="border border-[#CFC8BC] p-3 bg-[#EDE8DF]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/api/social-image/this-week"
              alt="Branded card for the LinkedIn post"
              className="w-full block border border-[#CFC8BC]"
            />
            <a
              href="/api/social-image/this-week"
              download="nuclearhustle-this-week.png"
              className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase border border-[#CFC8BC] bg-[#EDE8DF] hover:bg-[#E5DFD5] px-2 py-1 transition-colors"
            >
              <Download size={11} />
              Download image
            </a>
          </div>
          <p className="mt-2 font-mono text-[10px] text-stone-400 leading-relaxed">
            Attach this to the post. Reflects the last published set — publish first, then download.
          </p>
        </div>
      </div>

      {/* Right: editable pick list + publish */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-3">
          <p className={LABEL}>This week&rsquo;s picks — {picks.length}</p>
          <button
            onClick={publish}
            disabled={pending || picks.length === 0}
            className="font-mono text-[10px] tracking-widest uppercase bg-yellow-400 text-stone-900 px-3 py-1.5 hover:bg-yellow-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {publishLabel}
          </button>
        </div>

        <div className="mb-3 min-h-[1rem]">
          {status === 'saved' && !dirty && (
            <p className="font-mono text-[10px] tracking-widest uppercase text-green-700">
              Published to /this-week.
            </p>
          )}
          {status === 'error' && (
            <p className="font-mono text-[10px] text-red-600">{errorMsg}</p>
          )}
          {dirty && status !== 'error' && (
            <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400">
              Unpublished changes.
            </p>
          )}
        </div>

        <div className="border border-[#CFC8BC] divide-y divide-[#CFC8BC]">
          {picks.map((p, i) => (
            <div key={p.slug} className="px-4 py-3 bg-[#EDE8DF]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-stone-900 truncate">
                    {p.title}
                  </p>
                  <p className="font-mono text-[11px] text-stone-400 mt-0.5 truncate">
                    {p.company} // {p.location}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="p-1 text-stone-400 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === picks.length - 1}
                    aria-label="Move down"
                    className="p-1 text-stone-400 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    onClick={() => remove(p.slug)}
                    aria-label="Remove"
                    className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="font-mono text-[10px] tracking-widest uppercase border border-[#CFC8BC] px-2 py-0.5 text-stone-500">
                  {CATEGORY_LABELS[p.category] ?? p.category}
                </span>
                {p.salaryLabel && (
                  <span className="font-mono text-[10px] font-semibold border border-[#CFC8BC] px-2 py-0.5 text-stone-900">
                    {p.salaryLabel}
                  </span>
                )}
                {p.isEmployerJob && (
                  <span className="font-mono text-[10px] tracking-widest uppercase border border-yellow-400 px-2 py-0.5 text-yellow-700">
                    Direct
                  </span>
                )}
                <span className="font-mono text-[10px] text-stone-400 px-2 py-0.5 ml-auto">
                  score {p.score}
                </span>
              </div>
            </div>
          ))}

          {picks.length === 0 && (
            <p className="px-4 py-8 text-center font-mono text-xs text-stone-400">
              No picks. Use Rerun to propose a fresh set.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
