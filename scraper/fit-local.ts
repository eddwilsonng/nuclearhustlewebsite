/**
 * Fill "Why this role" fit blocks from structured job fields.
 * Overwrites existing fit. No Anthropic call.
 *
 *   npx tsx scraper/fit-local.ts
 *   npx tsx scraper/fit-local.ts --dry-run
 *   npx tsx scraper/fit-local.ts --limit=20
 */
import * as fs from "fs";
import * as path from "path";
import { invokedAsScript } from "./cli";
import { hasUsableFit } from "../src/lib/jobs/fit";
import { applyGeneratedFit } from "../src/lib/jobs/generateFit";

const JOBS_PATH = path.join(__dirname, "..", "src", "data", "jobs.json");
const COMPANIES_PATH = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "companies.json",
);

interface Job {
  id: string;
  title: string;
  company_id: string;
  location?: string;
  category?: string;
  description?: string;
  slug?: string;
  status?: string;
  structured_description?: Parameters<typeof applyGeneratedFit>[0];
}

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

export function runFitLocal(opts: { dryRun?: boolean; limit?: number } = {}): {
  filled: number;
  stripped: number;
  skipped: number;
  samples: { id: string; title: string; good: string[] }[];
} {
  const dryRun = opts.dryRun ?? false;
  const limit = opts.limit ?? Infinity;
  const companyNames = loadCompanyNames();
  const data = JSON.parse(fs.readFileSync(JOBS_PATH, "utf-8")) as {
    jobs: Job[];
  };

  let filled = 0;
  let stripped = 0;
  let skipped = 0;
  const samples: { id: string; title: string; good: string[] }[] = [];

  for (const job of data.jobs) {
    if (job.status !== "published" && job.status !== "pending_review") continue;
    if (!job.structured_description) continue;
    if (filled + stripped + skipped >= limit) break;

    const hadFit = Boolean(job.structured_description.fit);
    const next = applyGeneratedFit(job.structured_description, {
      title: job.title,
      companyName: companyNames.get(job.company_id) ?? job.company_id,
      location: job.location,
      category: job.category,
      description: job.description,
    });

    if (hasUsableFit(next)) {
      job.structured_description = next;
      filled++;
      if (samples.length < 8) {
        samples.push({
          id: job.id,
          title: job.title,
          good: next.fit!.good,
        });
      }
    } else if (hadFit) {
      job.structured_description = next;
      stripped++;
    } else {
      skipped++;
    }
  }

  if (!dryRun) {
    const tempPath = `${JOBS_PATH}.fit-local.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2) + "\n");
    fs.renameSync(tempPath, JOBS_PATH);
  }

  return { filled, stripped, skipped, samples };
}

if (invokedAsScript("fit-local.ts")) {
  const dryRun = process.argv.includes("--dry-run");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;
  const { filled, stripped, skipped, samples } = runFitLocal({ dryRun, limit });
  console.log(
    `${dryRun ? "[dry-run] " : ""}filled ${filled}, stripped ${stripped}, skipped (too thin) ${skipped}`,
  );
  for (const s of samples) {
    console.log(`\n${s.title}`);
    for (const g of s.good) console.log(`  + ${g}`);
  }
}
