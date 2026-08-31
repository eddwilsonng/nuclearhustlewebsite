import type { StructuredDescription } from './types';

type Field =
  | 'about'
  | 'responsibilities'
  | 'qualifications'
  | 'desired'
  | 'location_details';

const SECTION_MAP: { match: string; field: Field }[] = [
  { match: 'Specific responsibilities may include', field: 'responsibilities' },
  { match: 'Required Education and Experience', field: 'qualifications' },
  { match: 'Principal Accountabilities', field: 'responsibilities' },
  { match: 'Responsibilities and Duties', field: 'responsibilities' },
  { match: 'General Summary', field: 'about' },
  { match: 'Summary', field: 'about' },
  { match: 'Bonus Qualifications', field: 'desired' },
  { match: 'Job Duties / Responsibilities', field: 'responsibilities' },
  { match: 'Primary Purpose of Position', field: 'about' },
  { match: 'Primary Purpose of the Role', field: 'about' },
  { match: 'Additional Preferred Qualifications', field: 'desired' },
  { match: 'Required/Basic Qualifications', field: 'qualifications' },
  { match: 'Required Basic Qualifications', field: 'qualifications' },
  { match: 'Minimum Requirements', field: 'qualifications' },
  { match: 'Minimum Qualifications', field: 'qualifications' },
  { match: 'Required Qualifications', field: 'qualifications' },
  { match: 'Basic Qualifications', field: 'qualifications' },
  { match: 'Preferred Qualifications', field: 'desired' },
  { match: 'Desired Qualifications', field: 'desired' },
  { match: 'Key Responsibilities', field: 'responsibilities' },
  { match: 'Job Responsibilities', field: 'responsibilities' },
  { match: 'Primary Responsibilities', field: 'responsibilities' },
  { match: 'Job Duties', field: 'responsibilities' },
  { match: 'Primary Duties', field: 'responsibilities' },
  { match: 'Position Description', field: 'about' },
  { match: 'Position Summary', field: 'about' },
  { match: 'Job Summary / Purpose', field: 'about' },
  { match: 'Job Summary', field: 'about' },
  { match: 'Primary Purpose', field: 'about' },
  { match: 'Travel Requirements', field: 'location_details' },
  { match: 'Working Conditions', field: 'location_details' },
  { match: 'Work Environment', field: 'location_details' },
  { match: 'Specific Requirements', field: 'qualifications' },
  { match: 'Responsibilities', field: 'responsibilities' },
  { match: 'Qualifications', field: 'qualifications' },
  { match: 'Requirements', field: 'qualifications' },
  { match: 'Education', field: 'qualifications' },
  { match: 'Experience', field: 'qualifications' },
  { match: 'Duties', field: 'responsibilities' },
  { match: 'Travel', field: 'location_details' },
  { match: 'Preferred', field: 'desired' },
];
SECTION_MAP.sort((a, b) => b.match.length - a.match.length);

const MARKETING =
  /join (our|the) team|more than a career|make a difference|friendly work environment|who we are|total rewards|powered by passion|thanks for your interest|you'll find a friendly|build an exciting|we're creating healthier|cultivating a workplace|11:59|job posting expire|submit your application|important application/i;

const STRIP: RegExp[] = [
  /Important Application Submission Information[\s\S]*?(?=(?:Position Summary|Position Description|Job Summary|Primary Purpose|Job Title:|PMC ))/i,
  /please submit your application by[^.]*\./gi,
  /More than a career[\s\S]*?competitive pay and benefits\.?/gi,
  /Consider joining the Duke Energy team[\s\S]*?pay and benefits\.?/gi,
  /\*?Depending upon the desired qualifications of the successful applicant[\s\S]*?job hierarchy\*?\.?/gi,
  /Who We Are[\s\S]*?(?=Primary Purpose|Job Summary|Position Summary|This position)/i,
  /Total Rewards[\s\S]*?(?=Primary Purpose|Job Summary|Expected salary|This position)/i,
  /Thanks for your interest in Oklo!?\s*/i,
  /At Talen Energy[\s\S]*?(?:drive meaningful change by:|In this role[,:]?)/i,
  /Relocation Assistance Provided[\s\S]*$/i,
  /We are an [Ee]qual [Oo]pportunity[\s\S]*$/g,
  /Equal Opportunity Employer[\s\S]*$/g,
  /Duke Energy is an [Ee]qual[\s\S]*$/gi,
  /TerraPower is an [Ee]qual[\s\S]*$/gi,
  /Oklo is an [Ee]qual[\s\S]*$/gi,
  /Constellation is proud to be an[\s\S]*$/gi,
  /Privacy(?: Policy)?[\s\S]*$/i,
  /This site is protected by[\s\S]*$/i,
  /Do [Nn]ot [Ss]ell[\s\S]*$/i,
  /Pay Transparency[\s\S]*$/i,
  /Click here[\s\S]*?benefits[\s\S]*$/i,
];

const UNIQUE_HEADERS = new Set(
  [
    'Specific responsibilities may include',
    'Bonus Qualifications',
    'Primary Duties and Accountabilities',
    'Principal Accountabilities',
    'Responsibilities and Duties',
    'Required Education and Experience',
    'General Summary',
    'Summary',
    'Job Duties / Responsibilities',
    'Primary Purpose of Position',
    'Primary Purpose of the Role',
    'Additional Preferred Qualifications',
    'Required/Basic Qualifications',
    'Required Basic Qualifications',
    'Minimum Requirements',
    'Minimum Qualifications',
    'Required Qualifications',
    'Basic Qualifications',
    'Preferred Qualifications',
    'Desired Qualifications',
    'Key Responsibilities',
    'Job Responsibilities',
    'Primary Responsibilities',
    'Job Duties',
    'Primary Duties',
    'Position Description',
    'Position Summary',
    'Job Summary / Purpose',
    'Job Summary',
    'Primary Purpose',
    'Travel Requirements',
    'Working Conditions',
    'Specific Requirements',
  ].map((s) => s.toLowerCase()),
);

const ACTION_SPLIT =
  /\b(Ability|Analyze|Apply|Assist|Assure|Build|Collaborate|Communicate|Complete|Conduct|Contribute|Coordinate|Create|Deliver|Demonstrate|Design|Develop|Direct|Drive|Ensure|Establish|Evaluate|Execute|Facilitate|Identify|Implement|Lead|Maintain|Manage|Monitor|Operate|Oversee|Participate|Perform|Plan|Prepare|Provide|Review|Support|Verify|Work)\b/;

const SKILL_PATTERNS: [RegExp, string][] = [
  [/\bSRO\b/, 'SRO'],
  [/\bSenior Reactor Operator\b/i, 'SRO'],
  [/\bReactor Operator\b/i, 'RO'],
  [/\bRO license\b/i, 'RO LICENSE'],
  [/\bPWR\b/, 'PWR'],
  [/\bBWR\b/, 'BWR'],
  [/\bSMR\b/, 'SMR'],
  [/\bALARA\b/, 'ALARA'],
  [/\bNDE\b/, 'NDE'],
  [/\bASME\b/, 'ASME'],
  [/\bNFPA\b/, 'NFPA'],
  [/\bINPO\b/, 'INPO'],
  [/\bNRC\b/, 'NRC'],
  [/\b10\s*CFR\b/i, '10 CFR'],
  [/\bMaximo\b/i, 'MAXIMO'],
  [/\bSAP\b/, 'SAP'],
  [/\bPI System\b/i, 'PI SYSTEM'],
  [/\bEmerson\b/, 'EMERSON DCS'],
  [/\bDCS\b/, 'DCS'],
  [/\bNERC CIP\b/i, 'NERC CIP'],
  [/\bI\s*&\s*C\b/, 'I&C'],
  [/\bfire protection/i, 'FIRE PROTECTION'],
  [/\bcriticality/i, 'CRITICALITY'],
  [/\bdosimetr/i, 'DOSIMETRY'],
  [/\bhealth physics/i, 'HEALTH PHYSICS'],
  [/\bradiation protection/i, 'RADIATION PROTECTION'],
  [/\bDOE Q\b/i, 'DOE Q'],
  [/\bunescorted access/i, 'UNESCORTED ACCESS'],
  [/\bAP1000\b/i, 'AP1000'],
  [/\bcyber security/i, 'CYBER SECURITY'],
  [/\bNEIL\b/, 'NEIL'],
  [/\bNSCA\b/, 'NSCA'],
];

export function normalizeAtsText(raw: string): string {
  let t = raw.replace(/\r\n/g, '\n');
  t = t.replace(/[“”]/g, '"');
  t = t.replace(/([a-z])([A-Z])/g, '$1 $2');
  t = t.replace(/([a-zA-Z])(\d)/g, '$1 $2');
  t = t.replace(/(\d)([A-Z])/g, '$1 $2');
  t = t.replace(/([a-z])\.([A-Z])/g, '$1. $2');
  t = t.replace(/([a-z]):([A-Z])/g, '$1: $2');
  t = t.replace(/([a-z)])([A-Z])/g, '$1 $2');
  t = t.replace(/([A-Z]{2,})([A-Z][a-z]{3,})/g, '$1 $2');
  t = t.replace(/theonboarding/g, 'the onboarding');
  t = t.replace(/#LI-\w+/g, '');
  t = t.replace(/[ \t]+/g, ' ');
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

function stripBoilerplate(text: string): string {
  let t = text;
  for (const re of STRIP) {
    t = t.replace(re, ' ');
  }
  return t.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function insertSectionBreaks(text: string): string {
  let t = text;
  const tokens: string[] = [];
  for (const { match } of SECTION_MAP) {
    const unique = UNIQUE_HEADERS.has(match.toLowerCase());
    const token = `<<HDR:${tokens.length}>>`;
    tokens.push(match);
    const re = unique
      ? new RegExp(`\\b${escapeRe(match)}(?=[A-Z\\s:]|$)\\s*:?`, 'gi')
      : new RegExp(`(^|[.!?])\\s*${escapeRe(match)}(?=[A-Z\\s:]|$)\\s*:?`, 'gi');
    t = t.replace(re, unique ? `\n\n${token}\n` : `$1\n\n${token}\n`);
  }
  for (let i = tokens.length - 1; i >= 0; i--) {
    t = t.replaceAll(`<<HDR:${i}>>`, `@@${tokens[i]}@@`);
  }
  return t;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fieldForHeader(header: string): Field | null {
  const lower = header.toLowerCase();
  for (const { match, field } of SECTION_MAP) {
    if (match.toLowerCase() === lower) return field;
  }
  return null;
}

function splitIntoItems(text: string): string[] {
  let remaining = text.replace(/[•●]/g, '\n- ');
  remaining = remaining.replace(/;\s+(?=[A-Z])/g, '.\n');
  remaining = remaining.replace(/([.!?])\s+(?=[A-Z])/g, '$1\n');

  const lines = remaining.split('\n').map((l) => l.trim()).filter(Boolean);
  const items: string[] = [];

  for (const line of lines) {
    let cleaned = line
      .replace(/^[-–—*•●]\s*/, '')
      .replace(/^\d+[.)]\s*/, '')
      .replace(/you.ll do more than contribute[\s\S]*?by:\s*/i, '')
      .trim();
    if (cleaned.length < 20) continue;
    if (/\(\s*i\.e\.?\s*$/i.test(cleaned)) continue;
    if (/\b(and|or|the|of|including|with)\s*$/i.test(cleaned)) continue;
    if (/privacy|cookie|do not sell|terms of use|equal opportunity|eeo|§§|@@/i.test(cleaned)) continue;
    if (MARKETING.test(cleaned)) continue;
    items.push(cleaned.replace(/\s+/g, ' '));
  }

  return items;
}

function toBullets(items: string[], cap: number): string {
  return items.slice(0, cap).map((i) => `- ${i}`).join('\n');
}

function sentences(text: string, max: number, maxChars: number): string {
  const parts = text
    .replace(/[“”]/g, '"')
    .replace(/^["'\s]+/, '')
    .replace(/^Summary\s+/i, '')
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map((s) => s.trim().replace(/^["'\s]+/, ''))
    .filter((s) => s.length > 25 && !MARKETING.test(s));

  let out = '';
  for (const s of parts.slice(0, max)) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > maxChars) break;
    out = next;
  }
  return out || parts[0]?.slice(0, maxChars) || '';
}

function extractSkills(text: string): string[] {
  const found: string[] = [];
  for (const [re, tag] of SKILL_PATTERNS) {
    if (re.test(text) && !found.includes(tag)) found.push(tag);
    if (found.length >= 6) break;
  }
  return found;
}

/**
 * Deterministic ATS dump → structured_description. No API.
 * Good enough to match the job-detail layout of Haiku-formatted listings.
 */
export function formatJobDescriptionLocal(
  rawDescription: string,
  jobTitle?: string,
): StructuredDescription {
  if (!rawDescription || rawDescription.trim().length < 80) {
    return {};
  }

  const cleaned = stripBoilerplate(normalizeAtsText(rawDescription));
  const broken = insertSectionBreaks(cleaned);

  const buckets: Record<Field, string[]> = {
    about: [],
    responsibilities: [],
    qualifications: [],
    desired: [],
    location_details: [],
  };

  const parts = broken.split('\n\n').map((p) => p.trim()).filter(Boolean);
  let current: Field | null = null;
  const preamble: string[] = [];

  for (const part of parts) {
    const headerMatch = part.match(/^@@(.+?)@@\n?([\s\S]*)$/);
    if (headerMatch) {
      current = fieldForHeader(headerMatch[1]);
      const rest = headerMatch[2]?.trim();
      if (rest && current) buckets[current].push(rest);
      continue;
    }
    if (current) {
      buckets[current].push(part);
    } else {
      preamble.push(part);
    }
  }

  const aboutSource = [...buckets.about, ...preamble].join(' ');
  let about = sentences(aboutSource, 3, 420);

  if (!buckets.responsibilities.length && preamble.length) {
    buckets.responsibilities.push(preamble.join(' '));
  }

  const respItems = splitIntoItems(buckets.responsibilities.join(' ')).filter(
    (i) => ACTION_SPLIT.test(i) || i.length > 40,
  );
  const responsibilities = toBullets(respItems, 10);
  const qualifications = toBullets(splitIntoItems(buckets.qualifications.join(' ')), 8);
  const desired = toBullets(splitIntoItems(buckets.desired.join(' ')), 6);

  if (!about || (jobTitle && about.replace(/\.$/, '') === jobTitle)) {
    const fromResp = respItems.slice(0, 2).join(' ');
    about = sentences(aboutSource, 3, 420) || sentences(fromResp, 3, 420);
  }

  const locRaw = buckets.location_details.join(' ').replace(/\s+/g, ' ').trim();
  const locClean = locRaw
    .replace(/Relocation Assistance[\s\S]*/i, '')
    .replace(/Visa Sponsored Position.*$/i, '')
    .replace(/Represented\/Union Position.*$/i, '')
    .trim();
  const location_details = locClean
    ? sentences(locClean, 2, 320)
    : extractLocationLine(cleaned);

  const sd: StructuredDescription = {};
  if (about) sd.about = about;
  else if (jobTitle) sd.about = `${jobTitle}.`;
  if (responsibilities) sd.responsibilities = responsibilities;
  if (qualifications) sd.qualifications = qualifications;
  if (desired) sd.desired = desired;
  if (location_details) sd.location_details = location_details;

  const skills = extractSkills(`${jobTitle || ''} ${cleaned}`);
  if (skills.length) sd.skills = skills;

  return sd;
}

function extractLocationLine(text: string): string | undefined {
  const m = text.match(
    /\b(Hybrid[^.]*\.|Onsite[^.]*\.|On-site[^.]*\.|This (?:position|role) is (?:hybrid|remote|onsite)[^.]*\.|Must live within[^.]*\.|\d+%\s*travel[^.]*\.)/i,
  );
  return m?.[0]?.trim();
}

/** Mixed-fleet I&C / PMC generation roles that slipped past title matching. */
export function isMixedFleetFalsePositive(job: {
  title: string;
  location?: string;
  description?: string;
  company_id: string;
}): boolean {
  const MIXED = new Set([
    'duke', 'dominion', 'entergy', 'constellation', 'ameren', 'dte',
    'aep', 'pseg', 'xcel', 'aps', 'pge', 'talen',
  ]);
  if (!MIXED.has(job.company_id)) return false;

  const title = job.title;
  if (/\bnuclear\b/i.test(title)) return false;

  const desc = job.description || '';
  const pmc = /project management and construction|\bPMC is\b/i.test(desc);
  const generation = /\b(renewable solar|combined cycle|simple and combined|bulk energy storage|natural gas)\b/i.test(desc);
  const ic = /\bi\s*&?\s*c\b|instrumentation (?:and|&) control/i.test(title);

  if (ic && pmc && generation) return true;
  if (pmc && generation && !/\bnuclear (plant|station|site|engineer|operator|chemistry|radiation)\b/i.test(`${title} ${desc.slice(0, 1500)}`)) {
    return true;
  }
  if (/\(Pwr Gen\)|\bPwr Gen\b/i.test(title)) return true;
  return false;
}
