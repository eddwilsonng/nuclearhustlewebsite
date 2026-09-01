import Anthropic from "@anthropic-ai/sdk";
import { StructuredDescription } from "./types";
import { applyGeneratedFit } from "./jobs/generateFit";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROCESS_PROMPT = `You are a job editor for Nuclear Hustle, a specialist job board for US nuclear energy professionals (reactor operators, nuclear engineers, health physicists, RP techs, maintenance crews).

Take a raw scraped job description and do three things in one pass:
1. Decide if this is a genuine nuclear-industry role (ops, engineering, health physics, radiological protection, nuclear maintenance, chemistry, training, quality, security at a nuclear site, fuel, licensing). Plant-support roles at a named nuclear site count. Gas, transmission, retail, solar, wind, fossil, and generic corporate roles do not.
2. Format the description for the job board.
3. Extract 3–6 concise skill/technology tags explicitly mentioned.

Formatting rules:
- STRIP all boilerplate: EEO, privacy/cookie, accessibility, visa, pay-transparency, benefits marketing
- FIX run-together text ("2026More than a career" → "More than a career")
- CONSOLIDATE duplicate section headers
- KEEP only job-relevant content
- Edit "about" if it's vague corporate filler — make it specific to a job seeker

Output ONLY valid JSON (no markdown, no explanation):
{
  "keep": true,
  "agent_confidence": "high",
  "review_notes": "One sentence: nuclear verdict plus anything a human should know.",
  "structured_description": {
    "about": "2-3 sentence summary. Punchy, specific. No 'Join our team'.",
    "responsibilities": "Bullet points, one per line, each starting with '- '. Real job duties only.",
    "qualifications": "Bullet points, one per line, each starting with '- '. Required only.",
    "desired": "Preferred/nice-to-have. Omit if none.",
    "location_details": "One line: shift, travel %, remote/onsite, physical requirements. Omit if not mentioned.",
    "skills": ["TAG1", "TAG2"]
  }
}

keep:
- true if this is a nuclear or plant-support role that belongs on the board
- false if it is clearly not nuclear (gas, transmission, retail, solar, wind, fossil, generic HQ)

agent_confidence:
- "high" if keep is true AND the role is clearly nuclear AND responsibilities have at least 3 real bullets
- "low" if keep is true but the role is borderline, the description is thin (<3 responsibility bullets), or truncated
- "low" if keep is false

skills:
- Only tags explicitly stated — no hallucination
- Certifications (SRO, RO, NRC License), reactor types (PWR, BWR, SMR), tools (Maximo, SAP, PI System), standards (10 CFR 50, INPO, ALARA), clearances (DOE Q), domain (Radiation Protection, Dosimetry)
- SHORT ALL-CAPS tags: "PWR" not "Pressurized Water Reactor"
- Omit generic terms ("communication skills", "Microsoft Office")
- Omit the field if none

Omit any structured_description field that has no content.`;

export interface ProcessJobResult {
  keep: boolean;
  structured_description: StructuredDescription;
  review_notes: string;
  agent_confidence: "high" | "low";
}

function stripFence(text: string): string {
  return text
    .replace(/^```json?\n?/, "")
    .replace(/\n?```$/, "")
    .trim();
}

function withLocalFit(
  structured: StructuredDescription,
  jobTitle: string,
  companyName: string,
  rawDescription: string,
  extra?: { location?: string; category?: string },
): StructuredDescription {
  const rest = { ...structured };
  delete rest.fit;
  return applyGeneratedFit(rest, {
    title: jobTitle,
    companyName,
    location: extra?.location,
    category: extra?.category,
    description: rawDescription,
  });
}

export async function processJobDescription(
  rawDescription: string,
  jobTitle: string,
  companyName: string,
  category: string,
  location?: string,
): Promise<ProcessJobResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2560,
    messages: [
      {
        role: "user",
        content: `Job title: ${jobTitle}\nCompany: ${companyName}\nCategory: ${category}${location ? `\nLocation: ${location}` : ""}\n\nRaw description:\n${rawDescription.slice(0, 6000)}`,
      },
    ],
    system: PROCESS_PROMPT,
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";
  const cleaned = stripFence(text);

  try {
    const result = JSON.parse(cleaned);
    const keep = result.keep !== false;
    const confidence: "high" | "low" =
      result.agent_confidence === "low" || !keep ? "low" : "high";
    const structured: StructuredDescription = result.structured_description ?? {
      about: rawDescription.slice(0, 500),
    };
    return {
      keep,
      structured_description: withLocalFit(
        structured,
        jobTitle,
        companyName,
        rawDescription,
        {
          location,
          category,
        },
      ),
      review_notes: result.review_notes ?? "No notes.",
      agent_confidence: confidence,
    };
  } catch {
    return {
      keep: true,
      structured_description: withLocalFit(
        { about: rawDescription.slice(0, 500) },
        jobTitle,
        companyName,
        rawDescription,
        { location, category },
      ),
      review_notes: "Agent review failed to parse — manual review recommended.",
      agent_confidence: "low",
    };
  }
}

/** Fill `fit` from structured fields. Local, no API. */
export function generateJobFit(input: {
  rawDescription: string;
  jobTitle: string;
  companyName: string;
  category: string;
  location?: string;
  structured: StructuredDescription;
}): StructuredDescription {
  const {
    rawDescription,
    jobTitle,
    companyName,
    category,
    location,
    structured,
  } = input;
  return withLocalFit(structured, jobTitle, companyName, rawDescription, {
    location,
    category,
  });
}
