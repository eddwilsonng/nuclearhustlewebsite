/**
 * Batch AI review for scraped jobs.
 *
 * One Haiku pass: format + nuclear verdict + skills. Ingest auto-publishes
 * high-confidence keeps; standalone `npm run process-jobs` still leaves them
 * pending (except clear non-nuclear, which is rejected).
 *
 * Usage:
 *   npm run process-jobs                 # all unprocessed pending jobs
 *   npm run process-jobs -- --limit=10
 *   npm run process-jobs -- --force      # re-process even jobs already structured
 *   npm run process-jobs -- --fit-only   # local fit backfill, no API
 *
 * Requires ANTHROPIC_API_KEY in .env.local.
 */
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { recordAgentRun } from "../src/lib/ops/runLog";
import { submitToIndexNow, jobUrl } from "../src/lib/indexnow";
import { invokedAsScript } from "./cli";
import type { StructuredDescription } from "../src/lib/types";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const JOBS_PATH = path.join(__dirname, "..", "src", "data", "jobs.json");
const COMPANIES_PATH = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "companies.json",
);
const CONCURRENCY = 3;
const SAVE_EVERY = 5;

function loadCompanyNames(): Map<string, string> {
  try {
    const data = JSON.parse(fs.readFileSync(COMPANIES_PATH, "utf-8")) as {
      companies: { id: string; name: string }[];
    };
    return new Map(data.companies.map((c) => [c.id, c.name]));
  } catch {
    return new Map();
  }
}

interface Job {
  id: string;
  title: string;
  company_id: string;
  location?: string;
  slug?: string;
  category: string;
  description?: string;
  status?: string;
  structured_description?: StructuredDescription;
  review_notes?: string;
  agent_confidence?: string;
  skills?: string[];
}

export interface JobSummary {
  id: string;
  title: string;
  company_id: string;
  location?: string;
  slug?: string;
  reason: string;
  confidence?: "high" | "low";
}

export interface AiReviewResult {
  skipped?: string;
  processed: number;
  published: JobSummary[];
  flagged: JobSummary[];
  rejected: JobSummary[];
  failed: number;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  return {
    limit: limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity,
    force: args.includes("--force"),
    fitOnly: args.includes("--fit-only"),
  };
}

export async function runAiReview(
  opts: {
    autoPublish?: boolean;
    limit?: number;
    force?: boolean;
    fitOnly?: boolean;
  } = {},
): Promise<AiReviewResult> {
  const empty: AiReviewResult = {
    processed: 0,
    published: [],
    flagged: [],
    rejected: [],
    failed: 0,
  };

  const fitOnly = opts.fitOnly ?? false;
  if (fitOnly) {
    const { runFitLocal } = await import("./fit-local");
    const { filled, stripped, skipped } = runFitLocal({
      limit: opts.limit ?? Infinity,
    });
    console.log(
      `Local fit backfill: filled ${filled}, stripped ${stripped}, skipped (too thin) ${skipped}.`,
    );
    return { ...empty, processed: filled };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("ANTHROPIC_API_KEY not set — skipping AI review.");
    return { ...empty, skipped: "ANTHROPIC_API_KEY not set (.env.local)" };
  }

  const { processJobDescription } =
    await import("../src/lib/processJobDescription");

  const limit = opts.limit ?? Infinity;
  const force = opts.force ?? false;
  const autoPublish = opts.autoPublish ?? false;
  const companyNames = loadCompanyNames();

  const data = JSON.parse(fs.readFileSync(JOBS_PATH, "utf-8")) as {
    jobs: Job[];
  };

  const queue = data.jobs.filter(
    (j) =>
      j.status === "pending_review" &&
      j.description &&
      (force || !j.structured_description),
  );
  const targets = queue.slice(0, limit);

  if (targets.length === 0) {
    console.log("Nothing to process — no pending jobs awaiting AI review.");
    return empty;
  }

  console.log(
    `Processing ${targets.length} job(s) through AI review ` +
      `(one-pass format + nuclear verdict + fit, concurrency ${CONCURRENCY}` +
      `${autoPublish ? ", auto-publish high-confidence" : ""})...\n`,
  );

  const startedAt = new Date();

  let done = 0;
  let processedSinceSave = 0;
  let failCount = 0;
  const published: JobSummary[] = [];
  const flagged: JobSummary[] = [];
  const rejected: JobSummary[] = [];

  const indexById = new Map(data.jobs.map((j, i) => [j.id, i]));

  function companyNameFor(job: Job): string {
    return companyNames.get(job.company_id) ?? job.company_id;
  }

  async function processOne(job: Job): Promise<void> {
    try {
      const result = await processJobDescription(
        job.description!,
        job.title,
        companyNameFor(job),
        job.category,
        job.location,
      );

      const idx = indexById.get(job.id)!;
      const summary: JobSummary = {
        id: job.id,
        title: job.title,
        company_id: job.company_id,
        location: job.location,
        slug: job.slug,
        reason: result.review_notes,
        confidence: result.agent_confidence,
      };

      let status: string = "pending_review";
      if (!result.keep) {
        status = "rejected";
        rejected.push(summary);
      } else if (autoPublish && result.agent_confidence === "high") {
        status = "published";
        published.push(summary);
      } else {
        flagged.push(summary);
      }

      data.jobs[idx] = {
        ...data.jobs[idx],
        structured_description: result.structured_description,
        review_notes: result.review_notes,
        agent_confidence: result.agent_confidence,
        skills: result.structured_description.skills ?? data.jobs[idx].skills,
        status,
      };

      const flag =
        status === "published" ? "✓ " : status === "rejected" ? "✗ " : "⚠ ";
      console.log(
        `${flag}[${++done}/${targets.length}] ${job.title.slice(0, 55)} [${status}]`,
      );
    } catch (err) {
      failCount++;
      const message = err instanceof Error ? err.message : String(err);
      console.log(
        `  ✗ [${++done}/${targets.length}] FAILED: ${job.title.slice(0, 50)} — ${message}`,
      );
      if (/credit balance is too low|insufficient credits/i.test(message)) {
        throw new Error(
          "Anthropic API credits exhausted — aborting remaining reviews",
        );
      }
    }

    if (++processedSinceSave >= SAVE_EVERY) {
      fs.writeFileSync(JOBS_PATH, JSON.stringify(data, null, 2) + "\n");
      processedSinceSave = 0;
    }
  }

  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < targets.length) {
      const job = targets[cursor++];
      await processOne(job);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  fs.writeFileSync(JOBS_PATH, JSON.stringify(data, null, 2) + "\n");

  const { generateJobsIndex } = await import("./generate-jobs-index");
  const index = generateJobsIndex();
  console.log(
    `jobs-index.json: ${index.published} published jobs (${(index.bytes / 1024).toFixed(1)} KB)`,
  );

  if (autoPublish && published.length > 0) {
    await submitToIndexNow(
      published.filter((j) => j.slug).map((j) => jobUrl(j.slug!)),
    );
  }

  const finishedAt = new Date();
  recordAgentRun({
    type: "ai-review",
    label: `Content review — ${done} job${done === 1 ? "" : "s"}${autoPublish ? " (auto-publish)" : ""}`,
    status: failCount === done && done > 0 ? "error" : "success",
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    stats: {
      processed: done,
      published: published.length,
      flagged: flagged.length,
      rejected: rejected.length,
      failed: failCount,
    },
  });

  console.log(
    `\nDone. Processed ${done}: ${published.length} published, ` +
      `${flagged.length} flagged, ${rejected.length} rejected, ${failCount} failed.`,
  );
  if (!autoPublish && flagged.length + published.length > 0) {
    console.log(
      "Review remaining pending jobs at /dashboard/admin/review or in this chat.",
    );
  }

  return {
    processed: done,
    published,
    flagged,
    rejected,
    failed: failCount,
  };
}

if (invokedAsScript("process-pending.ts")) {
  const { limit, force, fitOnly } = parseArgs();
  if (!fitOnly && !process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set (.env.local). Aborting.");
    process.exit(1);
  }
  runAiReview({ limit, force, fitOnly, autoPublish: false }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
