// Builds the LinkedIn draft from a curated set. Pure and import-free so the
// admin editor can re-run it client-side as picks are reordered/removed.
//
// Voice: facts before pitch, no emoji, no hype (see brand-voice skill). The
// post body carries ZERO links — LinkedIn suppresses reach on posts with
// outbound links and only previews the last one — so the single link lives in
// a first-comment block that gets pasted right after the post.

const SITE_URL = 'https://www.nuclearhustle.com';

export interface PostJob {
  title: string;
  company: string;
  location: string;
  /** Pre-formatted salary label (e.g. "$120k–$145k/yr") or null. */
  salaryLabel: string | null;
}

export interface PostMeta {
  /** Count of new roles in the window — the fact the hook leads with. */
  totalInWindow: number;
  /** 2 (last 48h) or 7 (this week) — controls the hook's time phrase. */
  windowDays: number;
}

function jobBlock(job: PostJob): string {
  const second = job.salaryLabel ? `${job.location} · ${job.salaryLabel}` : job.location;
  return `${job.title} — ${job.company}\n${second}`;
}

export function formatLinkedInPost(
  jobs: PostJob[],
  meta: PostMeta
): { post: string; comment: string } {
  const n = meta.totalInWindow;
  const noun = n === 1 ? 'nuclear role' : 'nuclear roles';
  const windowPhrase = meta.windowDays <= 2 ? 'in the last 48 hours' : 'this week';
  // When we're showing everything that went up, don't imply a shortlist.
  const connector =
    n > jobs.length ? 'The ones worth a look:' : jobs.length === 1 ? 'Here it is:' : 'Here they are:';
  const hook = `${n} ${noun} went up ${windowPhrase}. ${connector}`;

  const post = [
    hook,
    '',
    jobs.map(jobBlock).join('\n\n'),
    '',
    'Full list, with salary on every role — link in the comments.',
    'New roles go up daily.',
    '',
    '#NuclearJobs #NuclearEnergy',
  ].join('\n');

  const comment = `The full set, updated weekly: ${SITE_URL}/this-week`;

  return { post, comment };
}
