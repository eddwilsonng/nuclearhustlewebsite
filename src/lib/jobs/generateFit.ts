import type { JobFit, StructuredDescription } from "../types";
import plantsData from "../../data/plants.json";
import { applyFit, fitSourceText, sanitizeFit } from "./fit";

type Plant = { name: string; city: string; state: string };

const PLANTS: Plant[] = (plantsData as { plants: Plant[] }).plants
  .slice()
  .sort((a, b) => b.name.length - a.name.length);

const PLANT_ALIASES: Record<string, string> = {
  harris: "Shearon Harris",
  "shearon harris": "Shearon Harris",
  robinson: "Robinson",
  "h.b. robinson": "Robinson",
  "hb robinson": "Robinson",
};

function textOf(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map((v) => String(v)).join("\n");
  return String(value);
}

function skillsOf(sd?: StructuredDescription | null): string[] {
  return (sd?.skills ?? []).map((s) => s.toUpperCase());
}

function hasSkill(skills: string[], ...needles: string[]): boolean {
  return needles.some((n) => {
    const re = new RegExp(
      `\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i",
    );
    return skills.some((s) => re.test(s));
  });
}

function matchPlantIn(hay: string): Plant | undefined {
  for (const plant of PLANTS) {
    const re = new RegExp(
      `\\b${plant.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i",
    );
    if (re.test(hay)) return plant;
  }
  return undefined;
}

function findPlant(corpus: string, title: string): Plant | undefined {
  const fromTitle = matchPlantIn(title);
  if (fromTitle) return fromTitle;

  const titled = title.match(
    /\b([A-Z][a-zA-Z.]+(?:\s+[A-Z][a-zA-Z.]+){0,2})\s+Nuclear\s+(?:Power\s+)?(?:Plant|Station)\b/,
  );
  const short = titled?.[1]?.trim();
  if (short) {
    const aliased = PLANT_ALIASES[short.toLowerCase()] ?? short;
    const known = PLANTS.find(
      (p) => p.name.toLowerCase() === aliased.toLowerCase(),
    );
    if (known) return known;
  }

  return matchPlantIn(corpus);
}

function travelPct(corpus: string): string | undefined {
  const range = corpus.match(/(\d+)\s*(?:-|–|\bto\b)\s*(\d+)\s*%/i);
  if (range) return `${range[1]} to ${range[2]}%`;
  const single = corpus.match(
    /\b(\d+)\s*%\s*travel|travel[^.]{0,40}?(\d+)\s*%/i,
  );
  if (single) return `${single[1] || single[2]}%`;
  return undefined;
}

function yearsRequired(title: string, quals: string): string | undefined {
  let requirement: string | undefined;
  const range = quals.match(
    /(?<!\d)(?<!\d\.)(\d+)\s*(?:-|–|\bto\b)\s*(\d+)\s+years?\s+(?:of\s+)?(?:relevant\s+|related\s+|work-related\s+|professional\s+|engineering\s+|nuclear\s+|commercial\s+)?experience/i,
  );
  if (range) {
    if (Number(range[1]) === 0) return undefined;
    requirement = `${range[1]} to ${range[2]} years of experience`;
  } else {
    const matches = [
      ...quals.matchAll(
        /(?<!\d)(?<!\d\.)(\d+)(\+)?\s+years?\s+(?:of\s+)?(?:relevant\s+|related\s+|work-related\s+|professional\s+|engineering\s+|nuclear\s+|commercial\s+)?experience/gi,
      ),
    ];
    if (matches.length === 0) return undefined;

    const highest = matches.reduce((best, current) =>
      Number(current[1]) > Number(best[1]) ? current : best,
    );
    const count = Number(highest[1]);
    requirement = `${count}${highest[2] ?? ""} ${
      count === 1 ? "year" : "years"
    } of experience`;
  }

  if (/\bII\b.*\bIII\b/i.test(title)) return `${requirement} for Level III`;
  if (/\bI\b.*\bII\b/i.test(title)) return `${requirement} for Level II`;
  if (/\bIII\b.*\bSenior\b/i.test(title))
    return `${requirement}, depending on level`;
  return requirement;
}

function experienceBullet(
  title: string,
  quals: string,
  requirement: string,
): {
  line: string;
  includesPe: boolean;
} {
  const peAlternative = quals.match(
    /(\d+)\s+years?[^.]{0,60}experience\s+(?:or|\+)\s+(\d+)\s+years?[^.]{0,100}(?:professional engineer|\bpe\b)/i,
  );
  if (peAlternative && /\bI\b.*\bII\b/i.test(title)) {
    const alternateYears = Number(peAlternative[2]);
    return {
      line: `For Level II, you have ${peAlternative[1]} years of experience, or ${
        peAlternative[2]
      } ${alternateYears === 1 ? "year" : "years"} with PE registration`,
      includesPe: true,
    };
  }

  const level = requirement.match(/^(.+) for (Level [IV]+)$/);
  if (level) {
    return {
      line: `For ${level[2]}, you have ${level[1].toLowerCase()}`,
      includesPe: false,
    };
  }

  return { line: `You have ${requirement}`, includesPe: false };
}

function plantWhere(plant: Plant, location?: string): string {
  const cleanLocation = location?.trim();
  if (
    cleanLocation &&
    !/^(remote|multiple locations|\d+\s+locations?|united states)$/i.test(
      cleanLocation,
    )
  ) {
    return `${plant.name} in ${cleanLocation}`;
  }
  return plant.name;
}

function sentence(text: string): string {
  const t = text
    .replace(/[—–]/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim()
    .replace(/\.+$/, "");
  if (!t) return t;
  const capped = t.charAt(0).toUpperCase() + t.slice(1);
  return `${capped}.`;
}

/**
 * Factual "Good fit if" lines from the posting. No skip list, no "you want this
 * city", no visa boilerplate. Brand voice: facts, numbers, no hype.
 */
export function generateFitLocal(input: {
  title: string;
  companyName: string;
  location?: string;
  category?: string;
  description?: string;
  structured?: StructuredDescription | null;
}): JobFit | undefined {
  const sd = input.structured;
  const quals = textOf(sd?.qualifications);
  const locDetails = textOf(sd?.location_details);
  const about = textOf(sd?.about);
  const desired = textOf(sd?.desired);
  const skills = skillsOf(sd);
  const source = fitSourceText(input);
  const focused = [
    input.title,
    about,
    quals,
    desired,
    locDetails,
    skills.join(" "),
  ].join("\n");
  const plant = findPlant(focused, input.title);

  const onsite =
    /\bon-?site\b|\bplant-site\b|\bin the plant\b|\boperating plant\b|\bfield walk/i.test(
      focused,
    );
  const hybrid = /\bhybrid\b/i.test(focused);
  const rotating = /rotating\s+shift|nights? and weekends|night\s+shift/i.test(
    focused,
  );
  const onCall = /\bon-?call\b|\bero\b|emergency (callout|response)/i.test(
    focused,
  );
  const optionalOnCall =
    /may be required[\s\S]{0,240}(on-?call|emergency response)/i.test(focused);
  const unescorted = /unescorted/i.test(focused);
  const doeQ = /\bdoe\s*q\b|\bq clearance\b/i.test(focused);
  const pe =
    hasSkill(skills, "PE LICENSE") ||
    /\bprofessional engineer\b|\bpe\b.{0,20}(license|registration)/i.test(
      quals + desired,
    );
  const sro =
    hasSkill(skills, "SRO") || /\bsro\b|senior reactor operator/i.test(focused);
  const ro =
    hasSkill(skills, "RO") ||
    /\breactor operator\b|\bro license\b/i.test(focused);
  const nlo =
    /operator/i.test(input.title + about) &&
    !/\bnlo\b|non-licensed operator/i.test(input.title) &&
    (hasSkill(skills, "NLO") ||
      /\bnlo\b|non-licensed operator/i.test(quals + desired + about));
  const ndeLevel = focused.match(/\bvt\s*level\s*(i{1,3}|\d)\b/i)?.[0];
  const pwr =
    hasSkill(skills, "PWR") || /\bpwr\b|pressurized water/i.test(focused);
  const bwr = hasSkill(skills, "BWR") || /\bbwr\b|boiling water/i.test(focused);
  const travel = travelPct(locDetails) ?? travelPct(focused);
  const years = yearsRequired(input.title, quals);
  const outageDuty =
    /outage (support|schedule|assignment|duty|campaign|work)/i.test(focused);

  const good: string[] = [];
  const add = (line: string) => {
    const s = sentence(line);
    if (s && !good.includes(s)) good.push(s);
  };

  if (plant) {
    const where = plantWhere(plant, input.location);
    if (hybrid) add(`You can work a hybrid schedule based at ${where}`);
    else if (onsite || rotating || unescorted)
      add(`You can work on-site at ${where}`);
    else add(`You can work from ${where}`);
  } else if (hybrid) {
    const split = focused.match(/(\d+)\s+in office and\s+(\d+)\s+remote/i);
    if (split)
      add(
        `You can work a hybrid schedule, ${split[1]} days in office and ${split[2]} remote`,
      );
    else add("You can work a hybrid schedule");
  }

  if (rotating)
    add("You can work rotating shifts, including nights and weekends");
  else if (optionalOnCall)
    add("You can cover an on-call and emergency-response rotation if assigned");
  else if (onCall)
    add("You can join the on-call and emergency-response rotation");

  const requiredSro =
    /current or previous[^.]{0,60}(sro|senior reactor operator)|sro (license|certification)/i.test(
      quals,
    );
  if (requiredSro) add("You hold or have held an SRO license or certification");
  else if (sro && ro) add("You have SRO or RO experience");
  else if (sro) add("You have SRO experience");
  else if (ro) add("You hold or have held an RO license");
  else if (nlo) add("You have NLO / non-licensed operator experience");

  if (unescorted && plant)
    add(`You can meet unescorted-access requirements at ${plant.name}`);

  if (doeQ) add("You meet the DOE Q clearance requirement");

  const experience = years
    ? experienceBullet(input.title, quals, years)
    : undefined;
  if (experience) add(experience.line);

  if (pe && !experience?.includesPe) add("You hold a PE license");
  if (ndeLevel) add(`You are ${ndeLevel.replace(/\s+/g, " ")} qualified`);
  else if (hasSkill(skills, "NDE") && !/\bnde\b/i.test(input.title))
    add("You hold an NDE qualification");

  if (pwr && !bwr) add("You have PWR experience");
  if (bwr && !pwr) add("You have BWR experience");

  if (outageDuty) add("You can support outages");
  if (travel) add(`You can travel ${travel} of the time`);

  return sanitizeFit({ good: good.slice(0, 5) }, source);
}

export function applyGeneratedFit(
  structured: StructuredDescription,
  input: {
    title: string;
    companyName: string;
    location?: string;
    category?: string;
    description?: string;
  },
): StructuredDescription {
  const fit = generateFitLocal({ ...input, structured });
  const source = fitSourceText({ ...input, structured });
  return applyFit(structured, fit, source);
}
