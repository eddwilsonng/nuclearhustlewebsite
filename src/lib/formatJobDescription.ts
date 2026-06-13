import Anthropic from '@anthropic-ai/sdk';
import { StructuredDescription } from './types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FORMAT_PROMPT = `You are a job description editor for Nuclear Hustle, a specialist nuclear energy job board.

Your task: take a raw scraped job description (messy plain text) and output a clean, structured JSON object.

Rules:
- STRIP all boilerplate: EEO/equal opportunity statements, privacy/cookie notices, application deadline notices, accessibility statements, "Do Not Sell My Personal Information", visa sponsorship disclaimers, pay transparency statements, benefits marketing copy (e.g. "click here dombenefits.com")
- FIX run-together text where words are concatenated without spaces (e.g. "2026More than a career" → "More than a career")
- CONSOLIDATE duplicate section headers (e.g. multiple "EXPERIENCE" or "SKILLS" sections that appear because the parser split mid-sentence)
- KEEP only job-relevant content: role summary, responsibilities, qualifications, working conditions

Output ONLY valid JSON matching this exact shape (no markdown, no explanation):
{
  "about": "2-3 sentence summary of what the role is and who it's for. Punchy, specific. No filler like 'Join our team'.",
  "responsibilities": "Bullet points, one per line, starting each with a dash (- ). Only real job duties.",
  "qualifications": "Bullet points, one per line, starting with a dash (- ). Required qualifications only.",
  "desired": "Bullet points, one per line, starting with a dash (- ). Preferred/nice-to-have qualifications. Omit if none.",
  "location_details": "One line: shift pattern, travel %, remote/onsite, any physical requirements. Omit if not mentioned."
}

If a field has no content, omit it from the JSON entirely.`;

export async function formatJobDescription(
  rawDescription: string,
  jobTitle: string,
  companyName: string
): Promise<StructuredDescription> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Job title: ${jobTitle}\nCompany: ${companyName}\n\nRaw description:\n${rawDescription.slice(0, 6000)}`,
      },
    ],
    system: FORMAT_PROMPT,
  });

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';

  // Strip markdown code fences if model wrapped the JSON
  const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();

  try {
    return JSON.parse(cleaned) as StructuredDescription;
  } catch {
    // If JSON parse fails, return a minimal fallback
    return { about: rawDescription.slice(0, 500) };
  }
}
