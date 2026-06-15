// Maps skill tag keywords to icon category names (used with lucide-react)
// Icon categories: 'award' | 'zap' | 'monitor' | 'shield' | 'tag'

type IconCategory = 'award' | 'zap' | 'monitor' | 'shield' | 'tag';

const CERTIFICATION_KEYWORDS = [
  'sro', 'ro license', 'nrc license', 'sro license', 'reactor operator',
  'senior reactor', 'license', 'certification', 'certified',
];

const REACTOR_KEYWORDS = [
  'pwr', 'bwr', 'smr', 'candu', 'pressurized', 'boiling water',
  'reactor', 'nuclear fuel', 'core', 'loca', 'eccs',
];

const SOFTWARE_KEYWORDS = [
  'maximo', 'sap', 'wms', 'pi system', 'eqss', 'nuclear university',
  'passport', 'corrective action', 'work management', 'dms',
  'oracle', 'sharepoint',
];

const REGULATORY_KEYWORDS = [
  '10 cfr', 'cfr 50', 'inpo', 'alara', 'nrc', 'doe q', 'l clearance',
  'q clearance', 'clearance', 'radiation protection', 'dosimetry',
  'radiological', 'health physics', 'rad protection',
];

export function getSkillIconCategory(skill: string): IconCategory {
  const lower = skill.toLowerCase();

  if (CERTIFICATION_KEYWORDS.some((k) => lower.includes(k))) return 'award';
  if (REACTOR_KEYWORDS.some((k) => lower.includes(k))) return 'zap';
  if (SOFTWARE_KEYWORDS.some((k) => lower.includes(k))) return 'monitor';
  if (REGULATORY_KEYWORDS.some((k) => lower.includes(k))) return 'shield';

  return 'tag';
}
