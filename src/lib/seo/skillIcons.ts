// Maps skill tags to icon category names (used with lucide-react).
// Icon categories: 'award' | 'zap' | 'monitor' | 'shield' | 'tag'
//
// Facet is the source of truth (src/lib/skills/taxonomy.ts): certifications →
// award, clearances → shield. Within the general 'skill' facet we still sub-type
// by keyword so reactor types / software / regulatory get distinct icons.

import { getSkillFacet } from '@/lib/skills/taxonomy';

type IconCategory = 'award' | 'zap' | 'monitor' | 'shield' | 'tag';

const REACTOR_KEYWORDS = [
  'pwr', 'bwr', 'smr', 'candu', 'pressurized', 'boiling water',
  'reactor', 'nuclear fuel', 'core', 'loca', 'eccs', 'nsss',
];

const SOFTWARE_KEYWORDS = [
  'maximo', 'sap', 'wms', 'pi system', 'eqss', 'nuclear university',
  'passport', 'corrective action', 'work management', 'dms',
  'oracle', 'sharepoint', 'ansys', 'matlab', 'mathcad', 'etap',
  'autocad', 'cad', 'python', 'mcnp', 'relap', 'gothic', 'plc', 'dcs',
  'primavera',
];

const REGULATORY_KEYWORDS = [
  '10 cfr', 'cfr 50', 'inpo', 'alara', 'nrc', 'radiation protection',
  'dosimetry', 'radiological', 'health physics', 'rad protection',
  'nqa', 'ansi', 'asme', 'iso 9001', 'quality assurance',
];

export function getSkillIconCategory(skill: string): IconCategory {
  const facet = getSkillFacet(skill);
  if (facet === 'certification') return 'award';
  if (facet === 'clearance') return 'shield';

  const lower = skill.toLowerCase();
  if (REACTOR_KEYWORDS.some((k) => lower.includes(k))) return 'zap';
  if (SOFTWARE_KEYWORDS.some((k) => lower.includes(k))) return 'monitor';
  if (REGULATORY_KEYWORDS.some((k) => lower.includes(k))) return 'shield';

  return 'tag';
}
