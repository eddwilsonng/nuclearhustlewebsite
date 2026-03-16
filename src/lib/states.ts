export interface StateInfo {
  code: string;
  name: string;
  slug: string;
}

export const US_STATES: StateInfo[] = [
  { code: 'AL', name: 'Alabama', slug: 'alabama' },
  { code: 'AK', name: 'Alaska', slug: 'alaska' },
  { code: 'AZ', name: 'Arizona', slug: 'arizona' },
  { code: 'AR', name: 'Arkansas', slug: 'arkansas' },
  { code: 'CA', name: 'California', slug: 'california' },
  { code: 'CO', name: 'Colorado', slug: 'colorado' },
  { code: 'CT', name: 'Connecticut', slug: 'connecticut' },
  { code: 'DE', name: 'Delaware', slug: 'delaware' },
  { code: 'FL', name: 'Florida', slug: 'florida' },
  { code: 'GA', name: 'Georgia', slug: 'georgia' },
  { code: 'HI', name: 'Hawaii', slug: 'hawaii' },
  { code: 'ID', name: 'Idaho', slug: 'idaho' },
  { code: 'IL', name: 'Illinois', slug: 'illinois' },
  { code: 'IN', name: 'Indiana', slug: 'indiana' },
  { code: 'IA', name: 'Iowa', slug: 'iowa' },
  { code: 'KS', name: 'Kansas', slug: 'kansas' },
  { code: 'KY', name: 'Kentucky', slug: 'kentucky' },
  { code: 'LA', name: 'Louisiana', slug: 'louisiana' },
  { code: 'ME', name: 'Maine', slug: 'maine' },
  { code: 'MD', name: 'Maryland', slug: 'maryland' },
  { code: 'MA', name: 'Massachusetts', slug: 'massachusetts' },
  { code: 'MI', name: 'Michigan', slug: 'michigan' },
  { code: 'MN', name: 'Minnesota', slug: 'minnesota' },
  { code: 'MS', name: 'Mississippi', slug: 'mississippi' },
  { code: 'MO', name: 'Missouri', slug: 'missouri' },
  { code: 'MT', name: 'Montana', slug: 'montana' },
  { code: 'NE', name: 'Nebraska', slug: 'nebraska' },
  { code: 'NV', name: 'Nevada', slug: 'nevada' },
  { code: 'NH', name: 'New Hampshire', slug: 'new-hampshire' },
  { code: 'NJ', name: 'New Jersey', slug: 'new-jersey' },
  { code: 'NM', name: 'New Mexico', slug: 'new-mexico' },
  { code: 'NY', name: 'New York', slug: 'new-york' },
  { code: 'NC', name: 'North Carolina', slug: 'north-carolina' },
  { code: 'ND', name: 'North Dakota', slug: 'north-dakota' },
  { code: 'OH', name: 'Ohio', slug: 'ohio' },
  { code: 'OK', name: 'Oklahoma', slug: 'oklahoma' },
  { code: 'OR', name: 'Oregon', slug: 'oregon' },
  { code: 'PA', name: 'Pennsylvania', slug: 'pennsylvania' },
  { code: 'RI', name: 'Rhode Island', slug: 'rhode-island' },
  { code: 'SC', name: 'South Carolina', slug: 'south-carolina' },
  { code: 'SD', name: 'South Dakota', slug: 'south-dakota' },
  { code: 'TN', name: 'Tennessee', slug: 'tennessee' },
  { code: 'TX', name: 'Texas', slug: 'texas' },
  { code: 'UT', name: 'Utah', slug: 'utah' },
  { code: 'VT', name: 'Vermont', slug: 'vermont' },
  { code: 'VA', name: 'Virginia', slug: 'virginia' },
  { code: 'WA', name: 'Washington', slug: 'washington' },
  { code: 'WV', name: 'West Virginia', slug: 'west-virginia' },
  { code: 'WI', name: 'Wisconsin', slug: 'wisconsin' },
  { code: 'WY', name: 'Wyoming', slug: 'wyoming' },
  { code: 'DC', name: 'District of Columbia', slug: 'district-of-columbia' },
];

// Map of state code/name to StateInfo for quick lookup
const stateByCode = new Map<string, StateInfo>();
const stateByName = new Map<string, StateInfo>();
const stateBySlug = new Map<string, StateInfo>();

for (const state of US_STATES) {
  stateByCode.set(state.code.toUpperCase(), state);
  stateByName.set(state.name.toLowerCase(), state);
  stateBySlug.set(state.slug, state);
}

/**
 * Extract state from a location string
 * Handles formats like:
 * - "Chicago, IL"
 * - "Chicago, Illinois"
 * - "Illinois"
 * - "Braidwood, IL 60408"
 */
export function extractState(location: string): string | null {
  if (!location) return null;

  const normalized = location.trim();

  // Try to match state code pattern (e.g., ", IL" or ", IL 60408")
  const codeMatch = normalized.match(/,\s*([A-Z]{2})(?:\s+\d{5})?(?:\s*$|,)/i);
  if (codeMatch) {
    const code = codeMatch[1].toUpperCase();
    const state = stateByCode.get(code);
    if (state) return state.slug;
  }

  // Try to match full state name
  const lowerLocation = normalized.toLowerCase();
  for (const state of US_STATES) {
    if (lowerLocation.includes(state.name.toLowerCase())) {
      return state.slug;
    }
  }

  // Try standalone state code at end (e.g., "Remote - IL")
  const standaloneCode = normalized.match(/\b([A-Z]{2})\s*$/);
  if (standaloneCode) {
    const code = standaloneCode[1].toUpperCase();
    const state = stateByCode.get(code);
    if (state) return state.slug;
  }

  return null;
}

export function getStateBySlug(slug: string): StateInfo | null {
  return stateBySlug.get(slug) || null;
}

export function getStateByCode(code: string): StateInfo | null {
  return stateByCode.get(code.toUpperCase()) || null;
}

export function getAllStates(): StateInfo[] {
  return US_STATES;
}

/**
 * Generate a URL-friendly slug from job title and location
 */
export function generateJobSlug(title: string, location: string, id: string): string {
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);

  const locationSlug = location
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 20);

  // Use first 8 chars of ID for uniqueness
  const idSuffix = id.substring(0, 8);

  return `${titleSlug}-${locationSlug}-${idSuffix}`.replace(/-+/g, '-').replace(/^-|-$/g, '');
}
