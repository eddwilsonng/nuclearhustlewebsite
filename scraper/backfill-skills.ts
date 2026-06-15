/**
 * Backfill skill tags for published jobs that don't have them yet.
 * Uses the same Claude model as the review pipeline.
 *
 * Usage:
 *   npx tsx scraper/backfill-skills.ts           # process all jobs missing skills
 *   npx tsx scraper/backfill-skills.ts --limit 10 # process first N jobs
 *   npx tsx scraper/backfill-skills.ts --dry-run  # preview without writing
 */

import Anthropic from '@anthropic-ai/sdk';
import { promises as fs } from 'fs';
import path from 'path';

const JOBS_PATH = path.join(process.cwd(), 'src/data/jobs.json');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : Infinity;

async function extractSkills(
  title: string,
  qualifications: string,
  desired: string,
): Promise<string[]> {
  const prompt = `Extract 3–6 nuclear-industry skill/technology tags from this job description text.

Job title: ${title}

Qualifications:
${qualifications || '(none)'}

Desired / nice-to-have:
${desired || '(none)'}

Rules:
- Only include tags explicitly stated — no hallucination
- Focus on: certifications (SRO, RO, NRC License), reactor types (PWR, BWR, SMR), software (Maximo, SAP, WMS, PI System), regulatory (10 CFR 50, INPO, ALARA), clearances (DOE Q Clearance), domain skills (Radiation Protection, Dosimetry, ALARA)
- Format as short ALL-CAPS: "PWR" not "Pressurized Water Reactor"
- Omit generic skills like "communication" or "Microsoft Office"
- If no nuclear-relevant skills found, return empty array

Output ONLY a JSON array of strings, e.g. ["PWR", "SRO License", "Maximo"]`;

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '[]';
  const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}

async function main() {
  const raw = JSON.parse(await fs.readFile(JOBS_PATH, 'utf-8'));
  const jobs = raw.jobs as Array<Record<string, unknown>>;

  const toProcess = jobs.filter((j) => {
    if (j.status && j.status !== 'published') return false;
    const sd = j.structured_description as Record<string, unknown> | null | undefined;
    return sd && !sd.skills;
  }).slice(0, LIMIT);

  console.log(`Jobs to process: ${toProcess.length}${DRY_RUN ? ' (dry run)' : ''}`);

  let updated = 0;
  for (const job of toProcess) {
    const sd = job.structured_description as Record<string, unknown>;
    const skills = await extractSkills(
      String(job.title ?? ''),
      String(sd.qualifications ?? ''),
      String(sd.desired ?? ''),
    );

    if (skills.length > 0) {
      sd.skills = skills;
      updated++;
      console.log(`  ✓ ${job.title} → [${skills.join(', ')}]`);
    } else {
      console.log(`  – ${job.title} → no skills found`);
    }

    // Polite rate limit
    await new Promise((r) => setTimeout(r, 300));
  }

  if (!DRY_RUN && updated > 0) {
    await fs.writeFile(JOBS_PATH, JSON.stringify(raw, null, 2));
    console.log(`\nWrote ${updated} updates to jobs.json`);
  } else if (DRY_RUN) {
    console.log(`\nDry run complete — no files written`);
  } else {
    console.log(`\nNo updates needed`);
  }
}

main().catch(console.error);
