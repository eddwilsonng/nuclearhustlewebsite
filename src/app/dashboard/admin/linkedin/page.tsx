import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { curateForLinkedIn } from '@/lib/linkedin/curate';
import { formatLinkedInPost } from '@/lib/linkedin/format';
import { formatSalary } from '@/lib/salary';
import { LinkedInPostPanel } from './LinkedInPostPanel';

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

export default async function AdminLinkedInPage({
  searchParams,
}: {
  searchParams: Promise<{ seed?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) redirect('/dashboard');

  const { seed: seedParam } = await searchParams;
  const seed = parseInt(seedParam ?? '0', 10) || 0;

  const picks = curateForLinkedIn(seed);
  const post = formatLinkedInPost(picks);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-1">
        <h1 className="font-mono text-xl font-bold text-stone-900">LinkedIn Draft</h1>
        <LinkedInRerunButton currentSeed={seed} />
      </div>
      <p className="font-mono text-xs text-stone-400 tracking-wide mb-8">
        Auto-curated from recent jobs — copy, tweak, paste into your Showcase page.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: formatted post */}
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-3">
            Post copy
          </p>
          <LinkedInPostPanel post={post} />
        </div>

        {/* Right: curated jobs */}
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-3">
            Curated picks — {picks.length} jobs
          </p>
          <div className="border border-[#CFC8BC] divide-y divide-[#CFC8BC]">
            {picks.map(({ job, score }) => {
              const salary = formatSalary(job.salary);
              return (
                <div key={job.id} className="px-4 py-3 bg-[#EDE8DF]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold text-stone-900 truncate">
                        {job.title}
                      </p>
                      <p className="font-mono text-[11px] text-stone-400 mt-0.5">
                        {job.company.name} // {job.location}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-stone-400 shrink-0 pt-0.5">
                      score {score}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="font-mono text-[10px] tracking-widest uppercase border border-[#CFC8BC] px-2 py-0.5 text-stone-500">
                      {CATEGORY_LABELS[job.category] ?? job.category}
                    </span>
                    {salary && (
                      <span className="font-mono text-[10px] font-semibold border border-[#CFC8BC] px-2 py-0.5 text-stone-700">
                        {salary}
                      </span>
                    )}
                    {job.isEmployerJob && (
                      <span className="font-mono text-[10px] tracking-widest uppercase border border-yellow-300 px-2 py-0.5 text-yellow-700">
                        Direct
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Thin client wrapper so the rerun button can generate a random seed
// without making the whole page a client component.
import { LinkedInRerunButton } from './LinkedInRerunButton';
