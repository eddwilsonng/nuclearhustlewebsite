/**
 * Controlled vocabulary for nuclear job skills, derived from clustering the
 * free-form tags our extractor (scraper/backfill-skills.ts) produced across the
 * live job set. This is the single source of truth for skill normalization and
 * the shared asset that will later power job-seeker profiles + employer
 * candidate search — so `slug` values are STABLE identifiers, do not rename.
 *
 * Three facets, mirroring how NukeWorker structures credentials:
 *   - certification — formal credentials a person holds (licenses, certs, training)
 *   - clearance     — security clearances and site access
 *   - skill         — everything else (reactor types, software, standards, domain)
 */

export type SkillFacet = 'certification' | 'clearance' | 'skill';

export interface CanonicalSkill {
  /** Stable id — used in URLs/profiles/search later. Never rename. */
  slug: string;
  /** Canonical display label. */
  name: string;
  facet: SkillFacet;
  /**
   * Lowercased variants that map to this entry. Matched two ways (see
   * `matchCanonical`): exact equality (for short tokens like "pwr", "sro"), or
   * substring containment for aliases ≥ 5 chars (for "sro license" etc).
   */
  aliases: string[];
}

export const SKILL_TAXONOMY: CanonicalSkill[] = [
  // ── Certifications / licenses / training ──────────────────────────────────
  {
    slug: 'sro-license',
    name: 'SRO License',
    facet: 'certification',
    aliases: ['sro license', 'sro', 'senior reactor operator license', 'senior reactor operator'],
  },
  {
    slug: 'ro-license',
    name: 'RO License',
    facet: 'certification',
    aliases: ['ro license', 'ro', 'reactor operator license'],
  },
  {
    slug: 'nrc-license',
    name: 'NRC License',
    facet: 'certification',
    aliases: ['nrc license', 'nrc operator license'],
  },
  {
    slug: 'pe-license',
    name: 'PE License',
    facet: 'certification',
    aliases: ['pe license', 'pe registration', 'pe certification', 'professional engineer', 'professional engineering license'],
  },
  {
    slug: 'eit-certification',
    name: 'EIT Certification',
    facet: 'certification',
    aliases: ['eit certification', 'eit', 'engineer in training', 'fe exam'],
  },
  {
    slug: 'pmp',
    name: 'PMP',
    facet: 'certification',
    aliases: ['pmp certification', 'pmp', 'project management professional'],
  },
  {
    slug: 'nrrpt',
    name: 'NRRPT',
    facet: 'certification',
    aliases: ['nrrpt certification', 'nrrpt', 'national registry of radiation protection technologists'],
  },
  {
    slug: 'chp',
    name: 'CHP',
    facet: 'certification',
    aliases: ['certified health physicist', 'chp'],
  },
  {
    slug: 'hazwoper',
    name: 'HAZWOPER',
    facet: 'certification',
    aliases: ['hazwoper', 'hazwopr', '40 hr osha hazwoper', '40-hour hazwoper', '24 hr hazwoper', 'osha hazwoper'],
  },
  {
    slug: 'cpr-first-aid',
    name: 'CPR / First Aid',
    facet: 'certification',
    aliases: ['cpr/first aid', 'cpr / first aid', 'cpr and first aid', 'first aid certification'],
  },
  {
    slug: 'rwi',
    name: 'RWI',
    facet: 'certification',
    aliases: ['rwi'],
  },
  {
    slug: 'rwii',
    name: 'RWII',
    facet: 'certification',
    aliases: ['rwii'],
  },
  {
    slug: 'instructor-certification',
    name: 'Instructor Certification',
    facet: 'certification',
    aliases: ['instructor certification', 'sat instructor', 'certified instructor'],
  },

  // ── Security clearances / site access ─────────────────────────────────────
  {
    slug: 'security-clearance',
    name: 'Security Clearance',
    facet: 'clearance',
    aliases: ['security clearance', 'clearance'],
  },
  {
    slug: 'unescorted-access',
    name: 'Unescorted Access',
    facet: 'clearance',
    aliases: ['unescorted access clearance', 'unescorted access', 'unescorted plant access'],
  },
  {
    slug: 'doe-q-clearance',
    name: 'DOE Q Clearance',
    facet: 'clearance',
    aliases: ['doe q clearance', 'doe q', 'q clearance'],
  },
  {
    slug: 'doe-l-clearance',
    name: 'DOE L Clearance',
    facet: 'clearance',
    aliases: ['doe l clearance', 'doe l', 'l clearance'],
  },
  {
    slug: 'dod-secret',
    name: 'DOD Secret',
    facet: 'clearance',
    aliases: ['dod secret', 'secret clearance'],
  },
  {
    slug: 'dod-top-secret',
    name: 'DOD Top Secret',
    facet: 'clearance',
    aliases: ['dod top secret', 'top secret clearance', 'top secret'],
  },

  // ── Skills: reactor types / plant ─────────────────────────────────────────
  { slug: 'pwr', name: 'PWR', facet: 'skill', aliases: ['pwr', 'pressurized water reactor'] },
  { slug: 'bwr', name: 'BWR', facet: 'skill', aliases: ['bwr', 'boiling water reactor'] },
  { slug: 'ap1000', name: 'AP1000', facet: 'skill', aliases: ['ap1000'] },
  { slug: 'ap300', name: 'AP300', facet: 'skill', aliases: ['ap300'] },
  { slug: 'smr', name: 'SMR', facet: 'skill', aliases: ['smr', 'small modular reactor'] },
  { slug: 'nsss', name: 'NSSS', facet: 'skill', aliases: ['nsss', 'nuclear steam supply system'] },
  { slug: 'reactor-operations', name: 'Reactor Operations', facet: 'skill', aliases: ['reactor operations', 'nuclear operations', 'plant operations', 'nuclear power plant operations', 'nuclear plant operations'] },
  { slug: 'fuel-handling', name: 'Fuel Handling', facet: 'skill', aliases: ['fuel handling'] },
  { slug: 'steam-generator-inspection', name: 'Steam Generator Inspection', facet: 'skill', aliases: ['steam generator inspection'] },

  // ── Skills: standards / regulatory ────────────────────────────────────────
  { slug: 'radiation-protection', name: 'Radiation Protection', facet: 'skill', aliases: ['radiation protection', 'radiological protection', 'rad protection', 'radiological controls'] },
  { slug: 'health-physics', name: 'Health Physics', facet: 'skill', aliases: ['health physics'] },
  { slug: 'alara', name: 'ALARA', facet: 'skill', aliases: ['alara'] },
  { slug: 'dosimetry', name: 'Dosimetry', facet: 'skill', aliases: ['dosimetry'] },
  { slug: 'radiochemistry', name: 'Radiochemistry', facet: 'skill', aliases: ['radiochemistry', 'radiation chemistry'] },
  { slug: 'ansi-ans-3-1', name: 'ANSI/ANS-3.1', facet: 'skill', aliases: ['ansi/ans-3.1-2014', 'ansi/ans-3.1', 'ans-3.1'] },
  { slug: 'nqa-1', name: 'ASME NQA-1', facet: 'skill', aliases: ['asme nqa-1', 'nqa-1', 'nqa1'] },
  { slug: 'asme', name: 'ASME Codes', facet: 'skill', aliases: ['asme section iii', 'asme standards', 'asme code', 'asme codes', 'asme bpvc', 'asme b31.1', 'asme'] },
  { slug: 'aisc', name: 'AISC', facet: 'skill', aliases: ['aisc'] },
  { slug: 'aci', name: 'ACI', facet: 'skill', aliases: ['aci'] },
  { slug: 'iso-9001', name: 'ISO 9001', facet: 'skill', aliases: ['iso 9001', 'iso9001'] },
  { slug: '10-cfr-50', name: '10 CFR 50', facet: 'skill', aliases: ['10 cfr 50 appendix b', '10 cfr 50.59', '10 cfr 50', '10cfr50'] },
  { slug: '10-cfr-21', name: '10 CFR 21', facet: 'skill', aliases: ['10 cfr 21'] },
  { slug: 'nrc-regulations', name: 'NRC Regulations', facet: 'skill', aliases: ['nrc regulations', 'nrc compliance', 'nrc licensing', 'regulatory compliance', 'nrc'] },
  { slug: 'inpo', name: 'INPO', facet: 'skill', aliases: ['inpo'] },
  { slug: 'sat', name: 'SAT', facet: 'skill', aliases: ['sat', 'systematic approach to training'] },
  { slug: 'quality-assurance', name: 'Quality Assurance', facet: 'skill', aliases: ['quality assurance', 'supplier quality', 'supplier management'] },
  { slug: 'configuration-management', name: 'Configuration Management', facet: 'skill', aliases: ['configuration management'] },
  { slug: 'root-cause-analysis', name: 'Root Cause Analysis', facet: 'skill', aliases: ['root cause analysis'] },
  { slug: 'nuclear-safety', name: 'Nuclear Safety', facet: 'skill', aliases: ['nuclear safety culture', 'nuclear safety', 'safety analysis'] },

  // ── Skills: NDE / craft ───────────────────────────────────────────────────
  { slug: 'nde', name: 'NDE / NDT', facet: 'skill', aliases: ['non-destructive testing', 'nondestructive testing', 'nde', 'ndt'] },
  { slug: 'welding', name: 'Welding', facet: 'skill', aliases: ['welding'] },
  { slug: 'calibration', name: 'Calibration', facet: 'skill', aliases: ['calibration'] },
  { slug: 'relay-testing', name: 'Relay Testing', facet: 'skill', aliases: ['relay testing'] },

  // ── Skills: engineering domains ───────────────────────────────────────────
  { slug: 'i-and-c', name: 'I&C Systems', facet: 'skill', aliases: ['i&c systems', 'i&c', 'instrumentation and controls', 'instrumentation & controls'] },
  { slug: 'thermal-hydraulics', name: 'Thermal Hydraulics', facet: 'skill', aliases: ['thermal-hydraulic analysis', 'thermal hydraulics', 'thermal-hydraulics'] },
  { slug: 'structural-analysis', name: 'Structural Analysis', facet: 'skill', aliases: ['structural analysis'] },
  { slug: 'electrical-engineering', name: 'Electrical Engineering', facet: 'skill', aliases: ['electrical engineering', 'electrical systems', 'electrical design'] },
  { slug: 'mechanical-engineering', name: 'Mechanical Engineering', facet: 'skill', aliases: ['mechanical engineering', 'mechanical design'] },
  { slug: 'systems-engineering', name: 'Systems Engineering', facet: 'skill', aliases: ['systems engineering'] },
  { slug: 'nuclear-engineering', name: 'Nuclear Engineering', facet: 'skill', aliases: ['nuclear engineering', 'nuclear analysis'] },
  { slug: 'pra', name: 'PRA', facet: 'skill', aliases: ['probabilistic risk assessment', 'pra'] },
  { slug: 'fea', name: 'FEA', facet: 'skill', aliases: ['finite element analysis', 'fea'] },
  { slug: 'gdt', name: 'GD&T', facet: 'skill', aliases: ['gd&t', 'geometric dimensioning and tolerancing'] },
  { slug: 'piping-design', name: 'Piping Design', facet: 'skill', aliases: ['piping design'] },
  { slug: 'project-management', name: 'Project Management', facet: 'skill', aliases: ['project management', 'project controls', 'outage planning', 'cost estimating'] },
  { slug: 'commissioning', name: 'Commissioning', facet: 'skill', aliases: ['commissioning'] },

  // ── Skills: software / tools ──────────────────────────────────────────────
  { slug: 'sap', name: 'SAP', facet: 'skill', aliases: ['sap'] },
  { slug: 'maximo', name: 'Maximo', facet: 'skill', aliases: ['maximo'] },
  { slug: 'primavera-p6', name: 'Primavera P6', facet: 'skill', aliases: ['primavera p6', 'primavera'] },
  { slug: 'ansys', name: 'ANSYS', facet: 'skill', aliases: ['ansys'] },
  { slug: 'matlab', name: 'MATLAB', facet: 'skill', aliases: ['matlab'] },
  { slug: 'mathcad', name: 'Mathcad', facet: 'skill', aliases: ['mathcad'] },
  { slug: 'etap', name: 'ETAP', facet: 'skill', aliases: ['etap'] },
  { slug: 'autocad', name: 'AutoCAD', facet: 'skill', aliases: ['autocad'] },
  { slug: 'cad', name: 'CAD', facet: 'skill', aliases: ['cad'] },
  { slug: 'python', name: 'Python', facet: 'skill', aliases: ['python'] },
  { slug: 'mcnp', name: 'MCNP', facet: 'skill', aliases: ['mcnp'] },
  { slug: 'relap', name: 'RELAP', facet: 'skill', aliases: ['relap'] },
  { slug: 'gothic', name: 'GOTHIC', facet: 'skill', aliases: ['gothic'] },
  { slug: 'plc', name: 'PLC', facet: 'skill', aliases: ['plc'] },
  { slug: 'dcs', name: 'DCS', facet: 'skill', aliases: ['dcs'] },
];

// Aliases ≥ this length are eligible for substring matching; shorter ones must
// match exactly (avoids "ro" hitting "radiation pROtection", "sap" hitting
// "landSAPe", etc).
const SUBSTRING_MIN_LEN = 5;

function normalizeRaw(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, ' ');
}

/** Resolve a raw tag to its canonical entry, or null if unrecognized. */
export function matchCanonical(raw: string): CanonicalSkill | null {
  const n = normalizeRaw(raw);
  if (!n) return null;

  // Pass 1: exact alias equality (handles short tokens precisely).
  for (const entry of SKILL_TAXONOMY) {
    if (entry.aliases.includes(n)) return entry;
  }
  // Pass 2: substring containment for longer, unambiguous aliases.
  for (const entry of SKILL_TAXONOMY) {
    for (const alias of entry.aliases) {
      if (alias.length >= SUBSTRING_MIN_LEN && n.includes(alias)) return entry;
    }
  }
  return null;
}

function titleCase(raw: string): string {
  // Preserve already-capitalized acronyms (e.g. "GD&T"); only fix ALL-CAPS words.
  return raw
    .trim()
    .split(/\s+/)
    .map((w) => (w === w.toUpperCase() && w.length > 3 ? w.charAt(0) + w.slice(1).toLowerCase() : w))
    .join(' ');
}

export interface GroupedSkills {
  certifications: string[];
  clearances: string[];
  skills: string[];
}

/**
 * Bucket a job's raw skill tags into the three display facets, deduplicated by
 * canonical name. Unrecognized tags are kept (never dropped) in `skills`,
 * lightly cleaned — losing extracted information would be worse than an
 * occasional uncanonicalized tag.
 */
export function groupSkills(raw: string[] = []): GroupedSkills {
  const certifications: string[] = [];
  const clearances: string[] = [];
  const skills: string[] = [];
  const seen = new Set<string>();

  const push = (bucket: string[], value: string) => {
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    bucket.push(value);
  };

  for (const tag of raw) {
    if (!tag || !tag.trim()) continue;
    const canonical = matchCanonical(tag);
    if (canonical) {
      const bucket =
        canonical.facet === 'certification'
          ? certifications
          : canonical.facet === 'clearance'
          ? clearances
          : skills;
      push(bucket, canonical.name);
    } else {
      push(skills, titleCase(tag));
    }
  }

  return { certifications, clearances, skills };
}

/** Facet for a single raw/canonical tag — used by icon logic. */
export function getSkillFacet(skill: string): SkillFacet {
  return matchCanonical(skill)?.facet ?? 'skill';
}
