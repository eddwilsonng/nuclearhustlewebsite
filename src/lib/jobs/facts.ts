import plantsData from "../../data/plants.json";
import type { JobWithCompany, StructuredDescription } from "@/lib/types";

export interface PlantMatch {
  name: string;
  city: string;
  state: string;
}

export interface JobFacts {
  plant?: PlantMatch;
  workMode?: string;
  schedule?: string;
  travel?: string;
  employmentType?: string;
}

type PlantRecord = { name: string; city: string; state: string };

const PLANTS: PlantRecord[] = (plantsData as { plants: PlantRecord[] }).plants
  .slice()
  .sort((a, b) => b.name.length - a.name.length);

function asText(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map((item) => String(item)).join("\n");
  return String(value);
}

function corpusFrom(job: JobWithCompany): string {
  const structured = job.structured_description;
  return [
    job.title,
    job.location,
    job.description,
    asText(structured?.about),
    asText(structured?.location_details),
    asText(structured?.qualifications),
    asText(structured?.desired),
    asText(structured?.what_we_offer),
  ]
    .filter(Boolean)
    .join("\n");
}

function matchPlant(text: string, title: string): PlantMatch | undefined {
  for (const plant of PLANTS) {
    const re = new RegExp(
      `\\b${plant.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i",
    );
    if (re.test(title) || re.test(text)) return plant;
  }
  return undefined;
}

function workModeFrom(text: string): string | undefined {
  if (/\bhybrid\b/i.test(text)) return "Hybrid";
  if (/\bremote\b/i.test(text) && !/\bnot remote\b/i.test(text)) return "Remote";
  if (/\bon-?site\b|\bplant-site\b|\bin the plant\b|\bfield-based\b/i.test(text)) {
    return "On-site";
  }
  return undefined;
}

function scheduleFrom(text: string): string | undefined {
  if (/rotating\s+shift|nights? and weekends|night\s+shift/i.test(text)) {
    return "Rotating shifts";
  }
  if (/\bon-?call\b|\bero\b|emergency (callout|response)/i.test(text)) {
    return "On-call rotation";
  }
  if (/\bday shift\b/i.test(text)) return "Day shift";
  return undefined;
}

function travelFrom(text: string): string | undefined {
  const range = text.match(/(\d+)\s*(?:-|–|\bto\b)\s*(\d+)\s*%/i);
  if (range) return `${range[1]}–${range[2]}% travel`;
  const single = text.match(
    /\b(\d+)\s*%\s*travel|travel[^.]{0,40}?(\d+)\s*%/i,
  );
  if (single) return `${single[1] || single[2]}% travel`;
  return undefined;
}

function employmentTypeFrom(job: JobWithCompany, text: string): string | undefined {
  if (job.employment_type) {
    return (
      job.employment_type.charAt(0).toUpperCase() +
      job.employment_type.slice(1).toLowerCase()
    );
  }
  if (/\bfull[-\s]?time\b/i.test(text)) return "Full-time";
  if (/\bpart[-\s]?time\b/i.test(text)) return "Part-time";
  if (/\bcontract(or)?\b/i.test(text)) return "Contract";
  if (/\bintern(ship)?\b/i.test(text)) return "Internship";
  return undefined;
}

export function getJobFacts(job: JobWithCompany): JobFacts {
  const text = corpusFrom(job);
  return {
    plant: matchPlant(text, job.title),
    workMode: workModeFrom(text),
    schedule: scheduleFrom(text),
    travel: travelFrom(text),
    employmentType: employmentTypeFrom(job, text),
  };
}

export function structuredText(
  value: StructuredDescription[keyof StructuredDescription] | unknown,
): string {
  return asText(value).trim();
}
