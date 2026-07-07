import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { curateForLinkedIn } from '@/lib/linkedin/curate';
import { formatSalary } from '@/lib/salary';
import { getPublishedWeek } from '@/lib/weekly/store';
import { getCurrentWeekId, weekLabel } from '@/lib/date/week';
import type { JobWithCompany } from '@/lib/types';
import { WeeklyCurationEditor, type EditorPick } from './WeeklyCurationEditor';
import { LinkedInRerunButton } from './LinkedInRerunButton';

function toEditorPick(job: JobWithCompany, score: number): EditorPick {
  return {
    slug: job.slug,
    title: job.title,
    company: job.company.name,
    location: job.location,
    salaryLabel: formatSalary(job.salary),
    category: job.category,
    isEmployerJob: Boolean(job.isEmployerJob),
    score,
  };
}

export default async function AdminLinkedInPage({
  searchParams,
}: {
  searchParams: Promise<{ seed?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) redirect('/dashboard');

  const { seed: seedParam } = await searchParams;
  const seed = parseInt(seedParam ?? '0', 10) || 0;

  const { picks: proposed, totalInWindow, windowDays } = await curateForLinkedIn(seed);

  const currentWeekId = getCurrentWeekId();
  const published = await getPublishedWeek();
  const publishedThisWeek = published?.weekId === currentWeekId;

  // Rerun (an explicit seed) forces a fresh proposal; otherwise start from this
  // week's published set if one exists, so you can tweak and re-publish.
  const useProposal = seed > 0 || !publishedThisWeek;
  const initialPicks: EditorPick[] = useProposal
    ? proposed.map((p) => toEditorPick(p.job, p.score))
    : published!.jobs.map((j) => toEditorPick(j, 0));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-1">
        <h1 className="font-mono text-3xl md:text-4xl font-bold leading-tight text-stone-900">
          Weekly Picks
        </h1>
        <LinkedInRerunButton currentSeed={seed} />
      </div>
      <p className="font-mono text-xs text-stone-400 tracking-wide mb-8">
        {publishedThisWeek && !useProposal
          ? `Published — ${weekLabel(currentWeekId)}. Edit and re-publish to update /this-week and the post.`
          : 'Auto-curated from recent jobs. Drop, reorder, then publish — the set drives /this-week and the LinkedIn draft.'}
      </p>

      <WeeklyCurationEditor
        initialPicks={initialPicks}
        meta={{ totalInWindow, windowDays }}
        isPublished={publishedThisWeek}
      />
    </div>
  );
}
