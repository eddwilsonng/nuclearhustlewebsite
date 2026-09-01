import type { JobFit, StructuredDescription } from "../types";
import plantsData from "../../data/plants.json";

export const MIN_GOOD_FIT_BULLETS = 2;
const MAX_GOOD_FIT_BULLETS = 5;

const GENERIC_RE = [
  /you'?ll love/i,
  /great opportunity/i,
  /fast[- ]paced/i,
  /career growth/i,
  /grow your career/i,
  /make a difference/i,
  /join our team/i,
  /\bpassionate\b/i,
  /\bthrive\b/i,
  /\bexciting\b/i,
  /world-class/i,
  /cutting-edge/i,
  /game-changing/i,
  /next-gen/i,
  /state-of-the-art/i,
  /\bunlock\b/i,
  /supercharge/i,
  /looking to grow/i,
  /want to grow/i,
  /new challenge/i,
  /leading (company|utility|operator)/i,
  /work in the nuclear industry/i,
  /nuclear experience\.?$/i,
  /hit the ground running/i,
  /make an impact/i,
  /dynamic (environment|team)/i,
  /want this role at/i,
  /you want (this|the) role/i,
  /visa sponsorship/i,
  /work in the us without visa/i,
  /authorized to work/i,
  /work authorization/i,
  /without (a )?visa/i,
  /commercial nuclear (site|plant|facility)/i,
  /you'll love/i,
];

/** Concrete constraints a fit bullet must name. Not vibes, not visa boilerplate. */
const CONCRETE_RE =
  /\b(sro|nlo|nrc|nrrpt|alara|pwr|bwr|smr|ap1000|candu|inpo|maximo|unescorted|clearance|doe|outage|shift|on-?call|on-?site|onsite|remote|hybrid|relocati|union|represented|travel|weekend|ero|rotating|night\s+shift|health physics|radiological|rp tech|radiation protection|reactor operator|professional engineer|pe license|\bpe\b|nde|10\s*cfr|\d+\s*%|\d+\+?\s*years?)\b|\bro\b/i;

const STOPWORDS = new Set([
  "this",
  "that",
  "with",
  "from",
  "have",
  "want",
  "role",
  "work",
  "site",
  "plant",
  "team",
  "your",
  "you",
  "the",
  "and",
  "for",
  "are",
  "not",
  "but",
  "can",
  "hold",
  "need",
  "looking",
  "experience",
  "nuclear",
  "job",
  "good",
  "fit",
  "skip",
  "only",
  "must",
  "able",
  "into",
  "over",
  "than",
  "also",
]);

const PLANT_HINTS: string[] = (
  plantsData as { plants: { name: string; city: string }[] }
).plants
  .flatMap((p) => [p.name, p.city])
  .filter((s) => s.length >= 4);

const CLAIM_CHECKS: { claim: RegExp; required: RegExp }[] = [
  { claim: /\bpwr\b/i, required: /pwr|pressurized water/i },
  { claim: /\bbwr\b/i, required: /bwr|boiling water/i },
  { claim: /\bsmr\b/i, required: /smr|small modular/i },
  { claim: /\bsro\b/i, required: /\bsro\b|senior reactor/i },
  { claim: /\bnlo\b/i, required: /\bnlo\b|non-licensed|non licensed/i },
  { claim: /\bap1000\b/i, required: /ap1000/i },
];

export function hasUsableFit(sd?: StructuredDescription | null): boolean {
  return (sd?.fit?.good?.length ?? 0) >= MIN_GOOD_FIT_BULLETS;
}

export function fitSourceText(input: {
  title: string;
  companyName: string;
  location?: string;
  category?: string;
  description?: string;
  structured?: StructuredDescription | null;
}): string {
  const sd = input.structured;
  return [
    input.title,
    input.companyName,
    input.location,
    input.category,
    input.description,
    fieldToText(sd?.about),
    fieldToText(sd?.responsibilities),
    fieldToText(sd?.qualifications),
    fieldToText(sd?.desired),
    fieldToText(sd?.location_details),
    sd?.skills?.join(" "),
  ]
    .filter(Boolean)
    .join("\n");
}

function fieldToText(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map((v) => String(v)).join("\n");
  return String(value);
}

function coerceBulletList(value: unknown): string[] {
  const lines = Array.isArray(value)
    ? value.map((v) => (typeof v === "string" ? v : String(v)))
    : typeof value === "string"
      ? value.split("\n")
      : [];

  return lines
    .map((line) => line.replace(/^[-•*–]\s+/, "").trim())
    .filter(Boolean);
}

function isUselessPlace(bullet: string): boolean {
  return /^(you want )?this role at [^.]+\.?$/i.test(bullet.trim());
}

function tidyBullet(bullet: string): string {
  const t = bullet
    .replace(/[—–]/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
  if (!t) return t;
  const capped = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(capped) ? capped : `${capped}.`;
}

function mentionsUnknownPlant(bullet: string, source: string): boolean {
  const lowerSource = source.toLowerCase();
  return PLANT_HINTS.some((name) => {
    const re = new RegExp(`\\b${escapeRegExp(name)}\\b`, "i");
    return re.test(bullet) && !lowerSource.includes(name.toLowerCase());
  });
}

function inventsClaim(bullet: string, source: string): boolean {
  return CLAIM_CHECKS.some(
    ({ claim, required }) => claim.test(bullet) && !required.test(source),
  );
}

function hasConcreteToken(bullet: string): boolean {
  return CONCRETE_RE.test(bullet);
}

function sharesDistinctiveToken(bullet: string, source: string): boolean {
  const sourceLower = source.toLowerCase();
  const tokens = bullet
    .toLowerCase()
    .replace(/[^a-z0-9+%]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t));

  return tokens.some((t) => sourceLower.includes(t));
}

function isGeneric(bullet: string): boolean {
  return (
    GENERIC_RE.some((re) => re.test(bullet)) ||
    isUselessPlace(bullet) ||
    isCityOnly(bullet)
  );
}

function isCityOnly(bullet: string): boolean {
  const plantNames = (plantsData as { plants: { name: string }[] }).plants.map(
    (p) => p.name,
  );
  const hasPlant = plantNames.some(
    (n) =>
      n.length >= 4 && new RegExp(`\\b${escapeRegExp(n)}\\b`, "i").test(bullet),
  );
  if (hasPlant) return false;
  return /\b(at|in)\s+[A-Za-z .']+,\s*[A-Z]{2}\.?$/i.test(bullet.trim());
}

function restatesTitle(bullet: string, source: string): boolean {
  const title = source.split("\n")[0] ?? "";
  const titleTokens = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t));
  if (titleTokens.length === 0) return false;
  if (!/experience|background/.test(bullet.toLowerCase())) return false;
  const hits = titleTokens.filter((t) => bullet.toLowerCase().includes(t));
  return hits.length >= Math.min(2, titleTokens.length);
}

function isGrounded(bullet: string, source: string): boolean {
  if (bullet.length < 10 || bullet.length > 180) return false;
  if (isGeneric(bullet)) return false;
  if (restatesTitle(bullet, source)) return false;
  if (mentionsUnknownPlant(bullet, source)) return false;
  if (inventsClaim(bullet, source)) return false;
  return hasConcreteToken(bullet) || sharesDistinctiveToken(bullet, source);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function sanitizeFit(
  raw: unknown,
  sourceText: string,
): JobFit | undefined {
  if (raw == null || typeof raw !== "object") return undefined;
  const obj = raw as { good?: unknown };

  const good = coerceBulletList(obj.good)
    .map(tidyBullet)
    .filter((b) => isGrounded(b, sourceText))
    .slice(0, MAX_GOOD_FIT_BULLETS);

  if (good.length < MIN_GOOD_FIT_BULLETS) return undefined;
  return { good };
}

export function applyFit(
  structured: StructuredDescription,
  rawFit: unknown,
  sourceText: string,
): StructuredDescription {
  const fit = sanitizeFit(rawFit, sourceText);
  if (!fit) {
    if (!structured.fit) return structured;
    const rest = { ...structured };
    delete rest.fit;
    return rest;
  }
  return { ...structured, fit };
}

export function fitMetaDescription(
  title: string,
  companyName: string,
  location: string,
  fit?: JobFit,
): string {
  const loc = `${title} at ${companyName} in ${location}`;
  const first = fit?.good?.[0];
  if (!first) return `${loc}. Apply now on Nuclear Hustle.`;

  const core = `${loc}. ${first}`;
  const withStop = /[.!?]$/.test(core) ? core : `${core}.`;
  if (withStop.length <= 155) return withStop;
  return `${withStop.slice(0, 154).trim()}…`;
}
