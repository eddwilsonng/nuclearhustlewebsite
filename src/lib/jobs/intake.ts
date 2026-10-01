import plantsData from "@/data/plants.json";
import { getStateByCode, getStateBySlug, normalizeStateSlug } from "@/lib/states";

export type WorkMode = "on-site" | "hybrid" | "remote";
export type SalaryPeriod = "hour" | "year";

export interface PlantOption {
  id: string;
  name: string;
  city: string;
  state: string;
}

export const PLANT_OPTIONS: PlantOption[] = (
  plantsData as { plants: PlantOption[] }
).plants
  .map(({ id, name, city, state }) => ({ id, name, city, state }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function getPlantOption(id: string | null | undefined): PlantOption | undefined {
  return id ? PLANT_OPTIONS.find((plant) => plant.id === id) : undefined;
}

export const TITLE_MAX_LENGTH = 70;
export const ABOUT_MIN_LENGTH = 80;
export const ABOUT_MAX_LENGTH = 1200;

// Plant names that are also common words or surnames would reject legitimate titles.
const AMBIGUOUS_PLANT_NAMES = new Set(["Byron", "Clinton", "Cooper", "Farley", "Hatch", "Perry", "Robinson", "Salem"]);

const PLANT_NAME_PATTERNS = PLANT_OPTIONS.filter(
  (plant) => !AMBIGUOUS_PLANT_NAMES.has(plant.name),
).map(
  (plant) => new RegExp(`\\b${plant.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"),
);

/** Problems with a job title, in the order the poster should fix them. */
export function getTitleIssues(title: string): string[] {
  const issues: string[] = [];
  const trimmed = title.trim();

  if (trimmed.length > TITLE_MAX_LENGTH) {
    issues.push(`Keep the title under ${TITLE_MAX_LENGTH} characters — just the role name.`);
  }
  if (/\b(needed|wanted|asap|urgent|immediate(ly)?|hiring|now)\b/i.test(trimmed)) {
    issues.push('Drop words like "Needed", "ASAP" or "Hiring" — the title is the role name only.');
  }
  if (/\b(remote|hybrid|on-?site)\b/i.test(trimmed)) {
    issues.push("Set remote or hybrid under Work mode instead of in the title.");
  }
  if (
    /\([A-Z]{2}\)/.test(trimmed) ||
    /\b(generating station|clean energy center|nuclear (plant|station)|power station)\b/i.test(trimmed) ||
    PLANT_NAME_PATTERNS.some((pattern) => pattern.test(trimmed))
  ) {
    issues.push("Pick the plant and location below rather than adding them to the title.");
  }
  if (/\b[A-Z]{6,}\b/.test(trimmed)) {
    issues.push("Avoid all-caps words.");
  }

  return issues;
}

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const URL_PATTERN = /\bhttps?:\/\/|\bwww\.[\w-]+\./i;
const PHONE_PATTERN = /\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/;
const APPLY_INSTRUCTION_PATTERN =
  /\b(send|email|forward|submit)\b[^.\n]{0,40}\b(resume|résumé|cv)\b|\bif you or someone you know\b/i;

/** Returns an error message if description copy contains contact or apply instructions. */
export function getContactDetailsIssue(text: string): string | null {
  if (EMAIL_PATTERN.test(text) || PHONE_PATTERN.test(text)) {
    return "Remove email addresses and phone numbers from the description. Candidates apply with the Apply button — set where applications go under How to apply.";
  }
  if (URL_PATTERN.test(text)) {
    return "Remove links from the description. Put your application link under How to apply.";
  }
  if (APPLY_INSTRUCTION_PATTERN.test(text)) {
    return 'Remove "send your resume to…" instructions. Candidates apply with the Apply button.';
  }
  return null;
}

const LIST_MARKER = /^\s*(?:[-–—•*·▪o]|\d+[.)])\s+/;

/** One item per line, each rendered as a bullet. Lines ending in ":" stay as subheadings. */
export function normalizeList(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(LIST_MARKER, "").trim())
    .filter(Boolean)
    .map((line) => (line.endsWith(":") ? line : `- ${line}`))
    .join("\n");
}

/** Collapses runs of blank lines and trims trailing whitespace on each line. */
export function normalizeProse(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function composeLocation(workMode: WorkMode, city: string, stateCode: string): string {
  if (workMode === "remote") return "Remote";
  return `${city.trim()}, ${stateCode.toUpperCase()}`;
}

/** Splits a stored "City, ST" location back into form fields. */
export function parseLocation(location: string): { city: string; stateCode: string } {
  const match = location.match(/^(.+),\s*([A-Za-z]{2})$/);
  if (match && getStateByCode(match[2])) {
    return { city: match[1].trim(), stateCode: match[2].toUpperCase() };
  }
  return { city: location === "Remote" ? "" : location, stateCode: "" };
}

export function stateCodeToSlug(code: string): string | null {
  return normalizeStateSlug(code);
}

export function stateSlugToCode(slug: string | null | undefined): string {
  return (slug && getStateBySlug(slug)?.code) || "";
}

export function parseSalaryAmount(value: string): number | null {
  const cleaned = value.replace(/[$,\s]/g, "");
  if (!cleaned) return null;
  const amount = Number(cleaned);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}
