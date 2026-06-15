import Anthropic from '@anthropic-ai/sdk';
import { StructuredDescription } from './types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const REVIEW_PROMPT = `You are a quality editor for Nuclear Hustle, a specialist job board for US nuclear energy professionals (reactor operators, nuclear engineers, health physicists, maintenance technicians, etc.).

You will receive a formatted job description and job metadata. Your job is to:
1. Check if this is genuinely a nuclear industry role (reactor operations, nuclear engineering, health physics, radiological protection, nuclear maintenance, etc.)
2. Edit the "about" field if it's vague corporate filler — make it specific and useful to a job seeker
3. Clean up any remaining concatenated text or formatting issues in any field
4. Flag if the content is too thin (under 3 bullet points in responsibilities) or seems like a non-nuclear role that slipped through scraping
5. Extract 3–6 concise skill/technology tags explicitly mentioned in the description

Output ONLY valid JSON (no markdown, no explanation):
{
  "structured_description": {
    "about": "...",
    "responsibilities": "...",
    "qualifications": "...",
    "desired": "...",
    "location_details": "...",
    "skills": ["TAG1", "TAG2", "TAG3"]
  },
  "review_notes": "One sentence: what you changed and/or any flags for the human reviewer.",
  "agent_confidence": "high" or "low"
}

For the skills array:
- Include only tags explicitly stated in the description — no hallucination
- Focus on: certifications (SRO, RO, NRC License, SRO License), reactor types (PWR, BWR, SMR, CANDU), software tools (Maximo, SAP, WMS, PI System, EQSS), regulatory standards (10 CFR 50, INPO, ALARA, NRC), clearances (DOE Q Clearance, L Clearance), domain skills (Radiation Protection, Dosimetry, LOCA, ECCS)
- Format as SHORT ALL-CAPS tags: "PWR" not "Pressurized Water Reactor", "SRO License" not "Senior Reactor Operator License"
- Omit generic terms like "communication skills" or "Microsoft Office"
- If no nuclear-relevant skills are found, omit the skills field entirely

Set agent_confidence to "low" if:
- The role doesn't clearly relate to nuclear energy operations
- Responsibilities section has fewer than 3 meaningful bullet points
- The description seems truncated or missing key sections

Omit any structured_description fields that have no content.`;

export async function reviewJobDescription(
  formatted: StructuredDescription,
  jobTitle: string,
  companyName: string,
  category: string
): Promise<{ structured_description: StructuredDescription; review_notes: string; agent_confidence: 'high' | 'low' }> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Job title: ${jobTitle}\nCompany: ${companyName}\nCategory: ${category}\n\nFormatted description:\n${JSON.stringify(formatted, null, 2)}`,
      },
    ],
    system: REVIEW_PROMPT,
  });

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
  const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();

  try {
    const result = JSON.parse(cleaned);
    return {
      structured_description: result.structured_description ?? formatted,
      review_notes: result.review_notes ?? 'No notes.',
      agent_confidence: result.agent_confidence === 'low' ? 'low' : 'high',
    };
  } catch {
    return {
      structured_description: formatted,
      review_notes: 'Agent review failed to parse — manual review recommended.',
      agent_confidence: 'low',
    };
  }
}
