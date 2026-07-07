import type { JobWithCompany } from '@/lib/types';

/**
 * A short, factual role summary pulled from the scraped `about` text — the
 * first sentence or two, trimmed to length. Shared by the weekly email digest
 * and the /this-week page so both read the same way. Returns null when a job
 * has no `about` (roughly 8% of listings) so callers can omit gracefully.
 */
export function jobOneLiner(
  job: JobWithCompany,
  opts?: { maxSentences?: number; maxLength?: number }
): string | null {
  const about = job.structured_description?.about;
  if (!about) return null;

  const maxSentences = opts?.maxSentences ?? 1;
  const maxLength = opts?.maxLength ?? 120;

  const sentences = about
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Accumulate whole sentences up to the limits — never leave a dangling
  // half-sentence, so the copy always reads cleanly.
  let out = '';
  for (const sentence of sentences.slice(0, maxSentences)) {
    const candidate = out ? `${out} ${sentence}` : sentence;
    if (candidate.length > maxLength) break;
    out = candidate;
  }

  // Only hard-trim when even the first sentence overflows the limit.
  if (!out) {
    const first = sentences[0] ?? about.trim();
    return `${first.slice(0, maxLength - 1).trim()}…`;
  }
  return out;
}
