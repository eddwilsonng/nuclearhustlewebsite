/**
 * Repair published structured descriptions that are still one stuffed bullet,
 * missing qualifications, or using company-brochure About text.
 * Only the broken fields are replaced. A clean About or qualification list
 * is left alone.
 *
 *   npx tsx scraper/reformat-bad.ts --dry-run
 *   npx tsx scraper/reformat-bad.ts
 */
import * as fs from "fs";
import * as path from "path";
import { formatJobDescriptionLocal } from "../src/lib/formatJobDescriptionLocal";
import { applyGeneratedFit } from "../src/lib/jobs/generateFit";
import { hasUsableFit } from "../src/lib/jobs/fit";
import type { StructuredDescription } from "../src/lib/types";

const JOBS_PATH = path.join(__dirname, "..", "src", "data", "jobs.json");
const COMPANIES_PATH = path.join(__dirname, "..", "src", "data", "companies.json");
const DRY = process.argv.includes("--dry-run");

const BROCHURE =
  /raise living standards|pioneers in nuclear|largest wholesale|one of america|about the callaway energy center|requisition id:|ready to make a lasting impact/i;

interface Job {
  id: string;
  title: string;
  company_id: string;
  location?: string;
  category?: string;
  description?: string;
  slug?: string;
  status?: string;
  structured_description?: StructuredDescription | null;
}

function asText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((item) => asText(item)).join("\n");
  return "";
}

function lines(value: unknown): string[] {
  return asText(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function maxLen(value: unknown): number {
  return lines(value).reduce((max, line) => Math.max(max, line.length), 0);
}

function qualsLookReal(value: unknown): boolean {
  return /\b(degree|diploma|years|experience|licen[sc]e|certification|proficient|knowledge of)\b/i.test(asText(value));
}

function responsibilitiesLookSane(value: unknown): boolean {
  const text = asText(value);
  return Boolean(text)
    && lines(value).length >= 3
    && !/"\s*"Summary/.test(text)
    && !/medical benefits|value system|what we offer|401\(k\)/i.test(text);
}

function loadCompanyNames(): Map<string, string> {
  const data = JSON.parse(fs.readFileSync(COMPANIES_PATH, "utf-8")) as {
    companies: { id: string; name: string }[];
  };
  return new Map(data.companies.map((company) => [company.id, company.name]));
}

function main() {
  const data = JSON.parse(fs.readFileSync(JOBS_PATH, "utf-8")) as { jobs: Job[] };
  const companyNames = loadCompanyNames();
  let improved = 0;
  let skipped = 0;
  const samples: string[] = [];
  const fieldCounts: Record<string, number> = {};

  for (const job of data.jobs) {
    if (job.status !== "published") continue;
    if (!job.description || job.description.length < 80) continue;
    const current = job.structured_description ?? undefined;
    if (!current) {
      skipped++;
      continue;
    }

    const fresh = formatJobDescriptionLocal(job.description, job.title);
    const next: StructuredDescription = { ...current };
    const changes: string[] = [];

    const oldRespMax = maxLen(current.responsibilities);
    const newRespMax = maxLen(fresh.responsibilities);
    const respBad = oldRespMax > 320
      || /medical benefits|value system|why westinghouse|what we offer|401\(k\)/i.test(asText(current.responsibilities));
    if (
      respBad
      && responsibilitiesLookSane(fresh.responsibilities)
      && newRespMax <= 320
      && newRespMax < oldRespMax - 40
    ) {
      next.responsibilities = fresh.responsibilities;
      changes.push("responsibilities");
    }

    const oldQuals = lines(current.qualifications);
    const freshQuals = lines(fresh.qualifications);
    const qualBad = oldQuals.length === 0
      || oldQuals.some((line) => line.length > 320 || /^- [a-z]/.test(line))
      || /welcome with your application|we interview candidates/i.test(asText(current.qualifications));
    if (
      qualBad
      && freshQuals.length >= 2
      && freshQuals.every((line) => line.length <= 320 && !/^- [a-z]/.test(line))
      && qualsLookReal(fresh.qualifications)
    ) {
      next.qualifications = fresh.qualifications;
      if (fresh.desired) next.desired = fresh.desired;
      changes.push("qualifications");
    }

    if (BROCHURE.test(asText(current.about)) && fresh.about && !BROCHURE.test(fresh.about)) {
      next.about = fresh.about;
      changes.push("about");
    }

    const oldLoc = asText(current.location_details);
    const newLoc = asText(fresh.location_details);
    if (
      /essential functions|reasonable accommodation/i.test(oldLoc)
      && newLoc
      && !/essential functions|reasonable accommodation/i.test(newLoc)
    ) {
      next.location_details = fresh.location_details;
      changes.push("location");
    }

    if (changes.length === 0) {
      skipped++;
      continue;
    }

    if (
      fresh.notices
      && /\$\s?\d|equal opportunity|equal employment/i.test(fresh.notices)
      && (!asText(next.notices) || /why westinghouse/i.test(asText(next.notices)))
    ) {
      next.notices = fresh.notices;
      changes.push("notices");
    }

    const fitted = applyGeneratedFit(next, {
      title: job.title,
      companyName: companyNames.get(job.company_id) ?? job.company_id,
      location: job.location,
      category: job.category,
      description: job.description,
    });
    if (!hasUsableFit(fitted) && current.fit) fitted.fit = current.fit;
    job.structured_description = fitted;
    improved++;
    for (const change of changes) fieldCounts[change] = (fieldCounts[change] ?? 0) + 1;
    if (samples.length < 10) {
      samples.push(
        `${job.company_id} | ${job.title} | ${changes.join(", ")} | resp ${oldRespMax}->${maxLen(fitted.responsibilities)} | quals ${lines(fitted.qualifications).length}`,
      );
    }
  }

  if (!DRY) {
    const tempPath = `${JOBS_PATH}.reformat.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2) + "\n");
    fs.renameSync(tempPath, JOBS_PATH);
  }

  console.log(
    `${DRY ? "[dry-run] " : ""}reformatted ${improved}, left as-is ${skipped}`,
  );
  console.log(fieldCounts);
  for (const sample of samples) console.log(sample);
}

main();
