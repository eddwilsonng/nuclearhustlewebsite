export type JobCategory =
  | 'operations'
  | 'maintenance'
  | 'engineering'
  | 'health-physics'
  | 'security'
  | 'administrative'
  | 'other';

export interface CategoryInfo {
  id: JobCategory;
  name: string;
  description: string;
  keywords: string[];
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'operations',
    name: 'Operations',
    description: 'Reactor operators, control room staff, and plant operations personnel',
    keywords: ['reactor operator', 'sro', 'control room', 'nuclear operator', 'shift supervisor', 'unit supervisor', 'operations'],
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    description: 'Electrical, mechanical, and I&C technicians maintaining plant equipment',
    keywords: ['mechanic', 'electrician', 'i&c', 'maintenance', 'technician', 'welder', 'machinist', 'craft'],
  },
  {
    id: 'engineering',
    name: 'Engineering',
    description: 'Nuclear, mechanical, electrical, and systems engineers',
    keywords: ['engineer', 'engineering', 'design', 'systems', 'project'],
  },
  {
    id: 'health-physics',
    name: 'Health Physics',
    description: 'Radiation protection, chemistry, and environmental monitoring',
    keywords: ['radiation', 'health physics', 'hp tech', 'chemistry', 'dosimetry', 'radwaste', 'decontamination', 'radiological'],
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Nuclear security officers and protective force',
    keywords: ['security', 'armed', 'officer', 'protective force', 'guard'],
  },
  {
    id: 'administrative',
    name: 'Administrative',
    description: 'Management, administrative, and support roles',
    keywords: ['admin', 'clerk', 'coordinator', 'manager', 'director', 'analyst', 'specialist', 'planner', 'scheduler', 'procurement', 'supply chain', 'hr', 'human resources', 'training', 'instructor'],
  },
];

const CATEGORY_PATTERNS: Record<JobCategory, RegExp[]> = {
  operations: [
    /reactor operator/i,
    /\bsro\b/i,
    /\bro\b/i,
    /control room/i,
    /nuclear operator/i,
    /shift supervisor/i,
    /unit supervisor/i,
    /operations\s+(manager|supervisor|specialist)/i,
  ],
  maintenance: [
    /mechanic/i,
    /electrician/i,
    /i&c\s*tech/i,
    /i&c\s*specialist/i,
    /maintenance\s+tech/i,
    /maintenance\s+specialist/i,
    /welder/i,
    /machinist/i,
    /craft/i,
    /\bmaint\b/i,
  ],
  engineering: [
    /engineer/i,
    /engineering/i,
    /design\s+(specialist|analyst)/i,
  ],
  'health-physics': [
    /radiation\s+protection/i,
    /health\s+physics/i,
    /\bhp\s+tech/i,
    /chemistry\s+tech/i,
    /dosimetry/i,
    /radwaste/i,
    /decon/i,
    /radiological/i,
    /chemistry\s+(specialist|technician)/i,
  ],
  security: [
    /security\s+officer/i,
    /security\s+specialist/i,
    /armed\s+/i,
    /protective\s+force/i,
    /nuclear\s+security/i,
  ],
  administrative: [
    /\badmin\b/i,
    /coordinator/i,
    /\bmanager\b/i,
    /\bdirector\b/i,
    /\banalyst\b/i,
    /\bplanner\b/i,
    /\bscheduler\b/i,
    /procurement/i,
    /supply\s+chain/i,
    /human\s+resources/i,
    /\bhr\s/i,
    /training/i,
    /instructor/i,
    /document\s+control/i,
  ],
  other: [],
};

export function categorizeJob(title: string): JobCategory {
  const normalizedTitle = title.toLowerCase();

  // Check each category's patterns
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (category === 'other') continue;

    for (const pattern of patterns) {
      if (pattern.test(normalizedTitle)) {
        return category as JobCategory;
      }
    }
  }

  return 'other';
}

export function getCategoryInfo(category: JobCategory): CategoryInfo {
  return CATEGORIES.find(c => c.id === category) || {
    id: 'other',
    name: 'Other',
    description: 'Other nuclear industry positions',
    keywords: [],
  };
}

export function getAllCategories(): JobCategory[] {
  return ['operations', 'maintenance', 'engineering', 'health-physics', 'security', 'administrative', 'other'];
}
