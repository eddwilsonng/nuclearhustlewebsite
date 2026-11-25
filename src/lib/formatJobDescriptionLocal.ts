import type { StructuredDescription } from './types';

type Field =
  | 'about'
  | 'responsibilities'
  | 'qualifications'
  | 'desired'
  | 'location_details';

const SECTION_MAP: { match: string; field: Field }[] = [
  { match: 'Duties & Responsibilities', field: 'responsibilities' },
  { match: 'Duties and Responsibilities', field: 'responsibilities' },
  { match: 'Specific responsibilities may include', field: 'responsibilities' },
  { match: 'Required Education and Experience', field: 'qualifications' },
  { match: 'Principal Accountabilities', field: 'responsibilities' },
  { match: 'Responsibilities and Duties', field: 'responsibilities' },
  { match: 'General Summary', field: 'about' },
  { match: 'Summary of Position Duties', field: 'about' },
  { match: 'Summary of Job Duties', field: 'about' },
  { match: 'Summary', field: 'about' },
  { match: 'Job Requirements', field: 'qualifications' },
  { match: 'Educational Requirements', field: 'qualifications' },
  { match: 'Knowledge, Skills and Abilities', field: 'qualifications' },
  { match: 'Bonus Qualifications', field: 'desired' },
  { match: 'Primary Duties and Accountabilities', field: 'responsibilities' },
  { match: 'Job Duties/Responsibilities', field: 'responsibilities' },
  { match: 'Job Summary/Purpose', field: 'about' },
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
  { match: "What You'll Do", field: 'responsibilities' },
  { match: 'What You Will Do', field: 'responsibilities' },
  { match: 'Key Accountabilities', field: 'responsibilities' },
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
  /join (our|the) team|more than a career|make a difference|friendly work environment|who we are|total rewards|powered by passion|thanks for your interest|you'll find a friendly|build an exciting|build the future of nuclear|we're creating healthier|cultivating a workplace|11:59|job posting expire|submit your application|important application/i;

/** Company brochure copy that must not become "About this role". */
const BROCHURE =
  /raise living standards|pioneers in nuclear|largest wholesale electricity|one of america.s largest|about the callaway energy center|requisition id:|ready to make a lasting impact|at its core, the company|global nuclear energy industry.s first choice|we are committed to transparency and equity/i;

const BENEFIT_NOISE =
  /comprehensive medical|401\(k\)|health savings account|wellness program|employee referral program|value system:|why westinghouse|paid vacations and company holidays|educational reimbursement|click here to learn more|welcome with your application|we interview candidates on a continuous basis|for more information about the role|get connected with|without regard to race|our global headquarters are located|equal opportunity employer|what we offer|employee assistance|company holidays|work-life balance|flexible work arrangements|designed to support employees|support employees' retirement|flexible work/i;

/** Common words that are only section headers with a colon or on their own line. */
const AMBIGUOUS_HEADERS = new Set([
  'summary',
  'experience',
  'education',
  'duties',
  'travel',
  'preferred',
  'requirements',
  'qualifications',
  'responsibilities',
]);

const ABOUT_SKIP =
  /benefits offered for this position|\.pdf\b|total compensation and benefits|nyse:\s*so\b|net-zero greenhouse|facebook\.com\/southernnuclear|in one or two sentences, provide a brief overview/i;

const STRIP: RegExp[] = [
  /Important Application Submission Information[\s\S]*?(?=(?:Position Summary|Position Description|Job Summary|Primary Purpose|Job Title:|PMC ))/i,
  /please submit your application by[^.]*\./gi,
  /More than a career[\s\S]*?competitive pay and benefits\.?/gi,
  /Consider joining the Duke Energy team[\s\S]*?pay and benefits\.?/gi,
  /\*?Depending upon the (?:desired )?qualifications of the successful (?:applicant|candidate)[\s\S]*?job hierarchy\*?\.?\s*/gi,
  /If you have what it takes to become part of the Vistra family[\s\S]*?apply online\.?\s*/gi,
  /(?:PS )?Job Title:\s*.{3,140}?\s+Work Place Flexibility:\s*\w+\s+Legal Entity:\s*\S+(?:\s+\S+){0,8}/gi,
  /Work Place Flexibility:\s*\w+\s+Legal Entity:\s*\S+(?:\s+\S+){0,6}/gi,
  /Posting End Date:\s*\d{1,2}\/\d{1,2}\/\d{2,4}\s*/gi,
  /Accessibility:\s*Entergy provides reasonable accommodations[\s\S]*?regarding your request\.\s*/gi,
  /Additional Responsibilities:\s*As a provider of essential services[\s\S]*?(?=Know Your Rights|Equal Opportunity|Equal Employment|$)/gi,
  /Know Your Rights:\s*Workplace Discrimination is Illegal[\s\S]*$/gi,
  /However, employees who have access to the compensation information[\s\S]*?(?:41 CFR[\s\S]*?\.\s*|$)/gi,
  /Who We Are[\s\S]*?(?=Primary Purpose|Job Summary|Position Summary|This position)/i,
  /Total Rewards[\s\S]*?(?=Primary Purpose|Job Summary|Expected salary|This position)/i,
  /Thanks for your interest in Oklo!?\s*/i,
  /Are you interested in being part of an innovative team[\s\S]*?About the role:\s*/gi,
  /As the largest private-sector power producer[\s\S]*?tomorrow\.\s*/gi,
  /At Talen Energy[\s\S]*?(?:drive meaningful change by:|In this role[,:]?)/i,
  /Relocation Assistance Provided[\s\S]*$/i,
  /Privacy(?: Policy)?[\s\S]*$/i,
  /This site is protected by[\s\S]*$/i,
  /Do [Nn]ot [Ss]ell[\s\S]*$/i,
  /Click here[\s\S]*?benefits[\s\S]*$/i,
  /A summary of the benefits offered[\s\S]*?(?=Job Identification|$)/i,
  /Southern Company invests in the well-being[\s\S]*?hiring process\./gi,
  /https?:\/\/seo\.nlx\.org\/\S+/gi,
  /Twitter:\s*@SouthernNuclear[\s\S]*?www\.southernnuclear\.com/gi,
  /Southern Company \(NYSE:\s*SO\s*\)[\s\S]*?visit www\.southerncompany\.com\s*\.?/gi,
  /Southern Nuclear\s*, a subsidiary of Southern Company[\s\S]*?www\.southernnuclear\.com/gi,
];

const ACTION_SPLIT =
  /\b(Ability|Analyze|Apply|Assist|Assure|Build|Collaborate|Communicate|Complete|Conduct|Contribute|Coordinate|Create|Deliver|Demonstrate|Design|Develop|Direct|Drive|Ensure|Establish|Evaluate|Execute|Facilitate|Identify|Implement|Lead|Maintain|Manage|Monitor|Operate|Oversee|Participate|Perform|Plan|Prepare|Provide|Review|Support|Verify|Work)(?:s|es|ed|ing)?\b/;

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
  t = t.replace(/&#39;|&apos;|&#8217;|&rsquo;/g, "'");
  t = t.replace(/&amp;/g, '&');
  t = t.replace(/&nbsp;/g, ' ');
  t = t.replace(/&quot;|&#34;/g, '"');
  t = t.replace(/&#\d+;/g, ' ');
  t = t.replace(/[“”]/g, '"');
  t = t.replace(/[\u200b\u200c\u200d\ufeff]+/g, '');
  t = t.replace(/([a-z])([A-Z])/g, '$1 $2');
  t = t.replace(/([a-z])(\d)/g, '$1 $2');
  t = t.replace(/(\d)([A-Za-z])/g, '$1 $2');
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

/** Constellation repeats the whole posting after the first quals block. */
function dropDuplicatedPosting(text: string): string {
  const markers = [
    'primary purpose of position',
    'primary duties and accountabilities',
    'job duties/responsibilities',
    'job summary/purpose',
  ];
  const qualMarkers = [
    'minimum qualifications',
    'minimum requirements',
    'required qualifications',
    'basic qualifications',
  ];
  const lower = text.toLowerCase();
  let cut = text.length;
  for (const marker of markers) {
    const first = lower.indexOf(marker);
    if (first < 0) continue;
    const second = lower.indexOf(marker, first + marker.length);
    if (second > first && second < cut) cut = second;
  }
  if (cut === text.length) return text.trim();
  const before = lower.slice(0, cut);
  if (!qualMarkers.some((q) => before.includes(q))) return text.trim();
  return text.slice(0, cut).trim();
}

/** Case-insensitive literal that does not turn [A-Z] lookaheads into lowercase matches. */
function ciLiteral(s: string): string {
  return s
    .split(/\s+/)
    .map((part) =>
      part
        .split('')
        .map((ch) => {
          if (!/[A-Za-z]/.test(ch)) return escapeRe(ch);
          return `[${ch.toUpperCase()}${ch.toLowerCase()}]`;
        })
        .join(''),
    )
    .join('\\s+');
}

function insertSectionBreaks(text: string): string {
  let t = text;
  const tokens: string[] = [];
  for (const { match } of SECTION_MAP) {
    const token = `<<HDR:${tokens.length}>>`;
    tokens.push(match);
    const word = ciLiteral(match);
    // Short headers ("Experience", "Summary") are only headers with a colon
    // or on their own line. The old /i flag made [A-Z] match "with", so
    // "Experience with EDMS" lost its first word and glued onto the bullet above.
    const ambiguous = AMBIGUOUS_HEADERS.has(match.toLowerCase());
    // "Experience with EDMS" is a bullet, not a header. "Qualifications:" mid-line is.
    const re = ambiguous
      ? new RegExp(`(?:^|\\n)\\s*${word}\\s*(?:\\n|$)|\\b${word}\\s*:\\s*`, 'g')
      : new RegExp(`(?:^|[\\n.!?])\\s*${word}\\s*:?\\s*(?=\\n|[A-Z]|$)`, 'g');
    t = t.replace(re, `\n\n${token}\n`);
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

const DUTY_VERB =
  'Act|Acquire|Administer|Analyze|Apply|Assist|Assign|Build|Clean|Collaborate|Collect|Communicate|Complete|Conduct|Coordinate|Create|Demonstrate|Develop|Direct|Ensure|Evaluate|Foster|Guide|Handle|Housekeep|Identify|Implement|Inspect|Issue|Keep|Lead|Maintain|Manage|Meet|Monitor|Obtain|Operate|Order|Oversee|Participate|Pass|Perform|Plan|Prepare|Prioritize|Process|Provide|Requisition|Respond|Retrieve|Review|Schedule|Segregate|Serve|Stock|Supervise|Support|Survey|Train|Understand|Use|Verify';

const DUTY_START = new RegExp(`^(?:${DUTY_VERB})(?:s|es|ed|ing)?\\b`, 'i');

function isDutyItem(item: string): boolean {
  return DUTY_START.test(item);
}

function isRequirementItem(item: string): boolean {
  return /^(?:high school|bachelor|master|associate|ged\b|juris|proficient|ability to|knowledge of|deep knowledge|demonstrated\b|\d+\+?\s*years|experience\b)/i.test(item)
    || /\b(degree|diploma|\bged\b|years of (?:experience|related)|licen[sc]ure|licensed|clearance|accredited|security screening)\b/i.test(item)
    || (/\brequired\b/i.test(item) && !/\bas required\b/i.test(item) && item.length < 140);
}

function isPreferredItem(item: string): boolean {
  return (/\bpreferred\b|\bmeritorious\b|\ban advantage\b|\ba plus\b/i.test(item) && !/\brequired\b/i.test(item));
}

function isIntroFluff(item: string): boolean {
  return BROCHURE.test(item)
    || BENEFIT_NOISE.test(item)
    || /^(?:job duties|facility duties|general maintenance duties|position specific description|job overview|about the position|about the role|key responsibilities)\b/i.test(item)
    || /\b(take the next step|tailored energy solutions|employees and contractors|you can learn more by visiting|highly efficient, low-cost|offers a wide range of benefits)\b/i.test(item);
}

function roleIntro(text: string): string | undefined {
  const seeking = text.match(
    /\b([A-Z][\w'’.&-]*(?:\s+[A-Z][\w'’.&-]*){0,8}\s+is seeking\b[\s\S]{40,700}?)(?=\s+As\s+[A-Z]|\s+Key\s+[A-Z]|\n\n|$)/,
  );
  if (seeking) {
    const intro = sentences(seeking[1], 2, 420);
    if (intro && !BROCHURE.test(intro)) return intro;
  }
  const marked = text.match(
    /(?:About the role|Position Specific Description|About The Position|About the Position|Job Overview)\s*:?\s*([\s\S]{60,900}?)(?=(?:Key Responsibilities|Job Duties|Qualifications|Minimum Qualifications|Requirements|You will report)\b|$)/i,
  );
  if (!marked) return undefined;
  const intro = sentences(marked[1], 2, 420);
  return intro && !BROCHURE.test(intro) ? intro : undefined;
}

function splitIntoItems(text: string): string[] {
  let remaining = text.replace(/[•●·∙]/g, '\n- ');
  remaining = remaining.replace(/;\s+(?=[A-Z])/g, '.\n');
  remaining = remaining.replace(/([.!?])\s+(?=[A-Z])/g, '$1\n');
  remaining = remaining.replace(/([.!?])\s+(?=\d)/g, '$1\n');
  // Flattened ATS bullets: "supplies Operates decontamination equipment"
  remaining = remaining.replace(
    new RegExp(
      `(?<=[a-z0-9),:])\\s+(?=(?:${DUTY_VERB})(?:s|es|ed|ing)?\\b)`,
      'g',
    ),
    '\n',
  );
  remaining = remaining.replace(
    /(?<=[a-z.)])\s+(?=(?:Education|Experience|Qualifications|Requirements|Working Conditions|Additional Information|Preferred Qualifications|Special Requirements)\s*:?)/g,
    '\n',
  );
  remaining = remaining.replace(
    /(?<=[a-z.)])\s+(?=(?:Special Requirements|Preferred Qualifications|NextEra Energy offers|We are committed)\b)/g,
    '\n',
  );
  remaining = remaining.replace(/\s+(?=\d+\.\s+)/g, '\n');
  remaining = remaining.replace(
    /(?<=[a-z0-9.)])\s+(?=(?:Ability to|Excellent|Associates degree|High School Diploma|Bachelor(?:'|’)s|Master(?:'|’)s|And one of the following|Valid Driver|\d+\+?\s+years)\b)/g,
    '\n',
  );
  // "CNC operator experience preferred Production welding experience preferred"
  // Do not split "level I" — the next token has to be a word, not a single capital.
  remaining = remaining.replace(
    /\s+(?=(?:[A-Z]{2,}|[A-Z][a-z]{2,})(?:\s+\S+){0,6}\s+experience preferred\b)/g,
    '\n',
  );
  // Noun-phrase lists with no periods: "Small assembly builds Large assembly builds".
  // Only on unpunctuated lines so a normal sentence is left intact.
  remaining = remaining
    .split('\n')
    .map((line) => {
      if (/[.!?]/.test(line) || line.length < 80) return line;
      return line.replace(/(?<=\b[a-z]{3,})\s+(?=[A-Z][a-z]+\s+[a-z])/g, '\n');
    })
    .join('\n');
  remaining = remaining.replace(/\s+(?=OR\s+[A-Z])/g, '\n');

  const lines = remaining.split('\n').map((l) => l.trim()).filter(Boolean);
  const items: string[] = [];

  for (const line of lines) {
    const cleaned = line
      .replace(/^[-–—*•●]\s*/, '')
      .replace(/^\d+[.)]\s*/, '')
      .replace(/^(?:qualifications|requirements|preferred qualifications|education|experience)\s*:\s*/i, '')
      .replace(/^(?:qualifications|requirements)\s+(?=[A-Z])/i, '')
      .replace(/^and accountabilities\s+/i, '')
      .replace(/you.ll do more than contribute[\s\S]*?by:\s*/i, '')
      .trim();
    if (cleaned.length < 12) continue;
    if (cleaned.length < 20 && !isDutyItem(cleaned) && !isRequirementItem(cleaned)) continue;
    if (/:\s*$/.test(cleaned) && cleaned.length < 80) continue;
    if (/^(?:qualifications and skills|key qualifications and skills)$/i.test(cleaned)) continue;
    if (/safely lift|repetitive work|special senses|work conditions:|motor abilities|typing\/keyboard|disclosed their own pay|medical or religious documentation/i.test(cleaned)) continue;
    if (/^job requirements:/i.test(cleaned)) continue;
    if (/\(\s*i\.e\.?\s*$/i.test(cleaned)) continue;
    if (cleaned.length < 45 && /\b(and|or|the|of|including|with)\s*$/i.test(cleaned)) continue;
    if (isIntroFluff(cleaned)) continue;
    if (/privacy|cookie|do not sell|terms of use|§§|@@/i.test(cleaned)) continue;
    if (/\b(equal employment opportunit|this policy applies to all terms|expressly prohibits any form|complies with applicable state and local laws governing non-discrimination|improper interference with the ability)\b/i.test(cleaned)) continue;
    if (/job posting end date|if you have what it takes|exciting employment opportunities/i.test(cleaned)) continue;
    if (/^depending upon the (?:desired )?qualifications of the successful/i.test(cleaned)) continue;
    if (/work place flexibility:|reasonable accommodation|\baccessibility:/i.test(cleaned)) continue;
    if (/^(\[\[|ps )?job title:/i.test(cleaned)) continue;
    if (/additional responsibilities:|know your rights|compensation information of other employees|absolutely not tolerated|41 CFR/i.test(cleaned)) continue;
    if (MARKETING.test(cleaned) || ABOUT_SKIP.test(cleaned)) continue;
    items.push(cleaned.replace(/\s+/g, ' '));
  }

  return items;
}

function dedupeItems(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 160);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function toBullets(items: string[], cap: number): string {
  return dedupeItems(items).slice(0, cap).map((i) => `- ${i}`).join('\n');
}

function sentences(text: string, max: number, maxChars: number): string {
  const parts = text
    .replace(/[“”]/g, '"')
    .replace(/^["'\s]+/, '')
    .replace(/^Summary\s+/i, '')
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map((s) => s.trim().replace(/^["'\s]+/, ''))
    .filter((s) => s.length > 25 && !MARKETING.test(s) && !ABOUT_SKIP.test(s) && !BROCHURE.test(s));

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

const NOTICE_RE =
  /\b(equal opportunity|equal employment|eeo\b|pay transparency|salary range|compensation range|pay range|\$\s?\d|visa sponsorship|visa sponsored|work authorization|reasonable accommodation|qualified applicants will receive)\b/i;

/** Pull legally relevant ad lines out of the body so formatting does not drop them. */
export function extractLegalNotices(text: string): { notices?: string; body: string } {
  const chunks = text
    .split(/\n+|(?<=[.])\s+(?=[A-Z])/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const notices: string[] = [];
  const kept: string[] = [];
  for (const chunk of chunks) {
    if (NOTICE_RE.test(chunk) && chunk.length < 900) notices.push(chunk);
    else kept.push(chunk);
  }

  const unique = [...new Set(notices.map(tidyNotice).filter((n) => n.length > 20))];
  return {
    notices: unique.length > 0 ? unique.join("\n") : undefined,
    body: kept.join("\n"),
  };
}

function tidyNotice(chunk: string): string {
  return chunk
    .replace(/\s*#LI-[\w-]+[\s\S]*$/i, '')
    .replace(/\s*Why Westinghouse\?[\s\S]*$/i, '')
    .replace(/\s*Get connected with[\s\S]*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
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

  const { notices, body } = extractLegalNotices(rawDescription);
  const cleaned = dropDuplicatedPosting(stripBoilerplate(normalizeAtsText(body)));
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

  const aboutJoined = buckets.about.join(' ');
  const typicalSplit = aboutJoined.split(/\btypical examples of the duties are:\s*/i);
  if (typicalSplit.length > 1) {
    buckets.about = [typicalSplit[0]];
    buckets.responsibilities.unshift(typicalSplit.slice(1).join(' '));
  }

  const aboutSource = [...buckets.about, ...preamble].join('\n');
  let about = roleIntro(cleaned) || sentences(aboutSource, 3, 420);
  about = about
    .replace(/^(of\s+)?(position\s+)?duties:\s*/i, '')
    .replace(/^job description\s+/i, '')
    .replace(/^[\s\S]{0,240}?(?:job summary\/purpose|description of organization:)\s*/i, '')
    .replace(/[•●·∙]\s*/g, '')
    .replace(/^of\s+position\s+duties\s+/i, '')
    .trim();

  if (!buckets.responsibilities.length) {
    if (preamble.length) buckets.responsibilities.push(preamble.join('\n'));
    else if (buckets.about.length) buckets.responsibilities.push(buckets.about.join('\n'));
  }

  let respItems = splitIntoItems(buckets.responsibilities.join('\n')).filter(
    (i) => isDutyItem(i) || ACTION_SPLIT.test(i) || i.length > 18,
  );
  if (!respItems.length && buckets.about.length) {
    respItems = splitIntoItems(buckets.about.join('\n')).filter(
      (i) => isDutyItem(i) || ACTION_SPLIT.test(i) || i.length > 18,
    );
  }
  const qualFromDuties: string[] = [];
  const preferredFromDuties: string[] = [];
  respItems = respItems
    .map((i) => i.replace(/^job description\s+/i, ''))
    .filter((i) => {
      if (/education, experience, & skills required/i.test(i)) return false;
      if (isPreferredItem(i)) {
        preferredFromDuties.push(i);
        return false;
      }
      if (isRequirementItem(i) && !isDutyItem(i)) {
        qualFromDuties.push(i);
        return false;
      }
      return true;
    });
  if (qualFromDuties.length) buckets.qualifications.push(qualFromDuties.join('\n'));
  if (preferredFromDuties.length) buckets.desired.push(preferredFromDuties.join('\n'));

  let qualItems = splitIntoItems(buckets.qualifications.join('\n'));
  const dutiesFromQuals: string[] = [];
  const preferredFromQuals: string[] = [];
  qualItems = qualItems.filter((i) => {
    if (isPreferredItem(i)) {
      preferredFromQuals.push(i);
      return false;
    }
    if (isDutyItem(i) && !isRequirementItem(i)) {
      dutiesFromQuals.push(i);
      return false;
    }
    return true;
  });
  respItems.push(...dutiesFromQuals);
  respItems = respItems.filter((i) => !isIntroFluff(i));
  const dutyCount = respItems.filter(isDutyItem).length;
  if (dutyCount >= 3) {
    respItems = respItems.filter((i) => isDutyItem(i) || i.length <= 160);
  }
  if (preferredFromQuals.length) buckets.desired.push(preferredFromQuals.join('\n'));

  const responsibilities = toBullets(respItems, 12);
  const qualifications = toBullets(qualItems, 12);
  const desired = toBullets(splitIntoItems(buckets.desired.join('\n')), 6);

  if (!about || BROCHURE.test(about) || (jobTitle && about.replace(/\.$/, '') === jobTitle)) {
    const fromResp = respItems.slice(0, 2).join(' ');
    about = roleIntro(cleaned) || sentences(aboutSource, 3, 420) || sentences(fromResp, 3, 420);
  }

  const locRaw = buckets.location_details.join('\n').replace(/[ \t]+/g, ' ').trim();
  const locClean = locRaw
    .replace(/Relocation Assistance[\s\S]*/i, '')
    .replace(/Visa Sponsored Position.*$/i, '')
    .replace(/Represented\/Union Position.*$/i, '')
    .trim();
  const locationBad = /essential functions|reasonable accommodation|motor abilities|physical exertion/i;
  const location_details =
    locClean && !locationBad.test(locClean)
      ? sentences(locClean, 2, 320)
      : extractLocationLine(cleaned);

  const sd: StructuredDescription = {};
  if (about) sd.about = about;
  else if (jobTitle) sd.about = `${jobTitle}.`;
  if (responsibilities) sd.responsibilities = responsibilities;
  if (qualifications) sd.qualifications = qualifications;
  if (desired) sd.desired = desired;
  if (location_details) sd.location_details = location_details;
  if (notices) sd.notices = notices;

  const skills = extractSkills(`${jobTitle || ''} ${cleaned}`);
  if (skills.length) sd.skills = skills;

  return sd;
}

function extractLocationLine(text: string): string | undefined {
  const labeled = text.match(
    /\b(?:model of work|work place flexibility)\s*:\s*(hybrid|remote|on-?site|onsite)\b/i,
  );
  if (labeled) {
    const mode = labeled[1].toLowerCase();
    if (mode.startsWith('on')) return 'On-site.';
    return mode.charAt(0).toUpperCase() + mode.slice(1) + '.';
  }
  if (/\b100%\s*on-?site\b/i.test(text) || /\byou will be\s+100%\s*on-?site\b/i.test(text)) {
    return 'On-site.';
  }
  const travel = text.match(/\btravels?\s*:\s*(\d+\s*(?:-|–|to)\s*\d+\s*%)/i)
    || text.match(/\b(\d+\s*(?:-|–|to)\s*\d+\s*%)\s*(?:of (?:your|the) time|travel)/i);
  if (travel) return `${travel[1].replace(/\s+/g, ' ')} travel.`;
  const shift = text.match(/\b(standard day shift|rotating shifts?|night shifts?)[^.]{0,80}/i);
  if (shift) return shift[0].trim().replace(/\.$/, '') + '.';
  return undefined;
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
    'aep', 'pseg', 'xcel', 'aps', 'pge', 'talen', 'nextera',
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
