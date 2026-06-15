export type JobCategory =
  | 'operations'
  | 'maintenance'
  | 'engineering'
  | 'health-physics'
  | 'security'
  | 'training'
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
    id: 'training',
    name: 'Training & Licensing',
    description: 'License training, simulator instruction, and accreditation roles',
    keywords: ['instructor', 'training', 'simulator', 'license operator candidate', 'sro candidate', 'ro candidate', 'accreditation', 'inpo'],
  },
  {
    id: 'administrative',
    name: 'Administrative',
    description: 'Management, administrative, and support roles',
    keywords: ['admin', 'clerk', 'coordinator', 'manager', 'director', 'analyst', 'specialist', 'planner', 'scheduler', 'procurement', 'supply chain', 'hr', 'human resources'],
  },
];

// Patterns are evaluated in the order below — most specialized first, with
// `administrative` acting as the catch-all for any remaining white-collar role
// (Specialist / Manager / Coordinator / Counsel / etc). Order matters because
// broad terms collide: e.g. health-physics must claim "Radiation Protection
// Technician" before the generic maintenance `technician` rule sees it, and
// operations must claim "Operator" roles before training's generic `training`.
const CATEGORY_PATTERNS: Record<JobCategory, RegExp[]> = {
  operations: [
    /reactor operator/i,
    /\bsro\b/i,
    /control room/i,
    /nuclear operator/i,
    /shift supervisor/i,
    /unit supervisor/i,
    /shift manager/i,
    /operations\s+(manager|supervisor|specialist)/i,
    /\boperators?\b/i,
    /(supv|supervisor)\s+fuel\s+handling/i,
    /fuel\s+handling\s+(operator|technician|tech|equipment)/i,
    /(power\s+)?plant\s+supervisor/i,
    /field\s+operations/i,
    /(superintendent|supt)\b[\s\S]*production/i,
  ],
  training: [
    /instructor/i,
    /\btrainer\b/i,
    /\btraining\b/i,
    /licensed?\s+operator\s+candidate/i,
    /\b(sro|ro)\s+candidate/i,
    /accreditation/i,
    /instructional/i,
    /(licensed\s+)?exam\s+developer/i,
  ],
  engineering: [
    /engineer/i,
    /engineering/i,
    /\beng\b/i,
    /design\s+(specialist|analyst)/i,
  ],
  'health-physics': [
    /radiation\s+protection/i,
    /\brad\s+protection/i,
    /health\s+physics/i,
    /health\s+physicist/i,
    /\bhp\s+tech/i,
    /chemistry/i,
    /radiochemist/i,
    /dosimetry/i,
    /radwaste/i,
    /decon/i,
    /radiological/i,
  ],
  maintenance: [
    /mechanic/i,
    /electrician/i,
    /i&c\s*tech/i,
    /i&c\s*specialist/i,
    /i&e\s*tech/i,
    /maintenance\s+(supervisor|superintendent|supt|manager|mgr|tech|technician|mechanic|foreman)/i,
    /(supervisor|superintendent|supt|assistant|asst)\b[\s\S]*\bmaintenance\b/i,
    /\bmaintenance\b[\s\S]*\b(supervisor|superintendent|supt|manager|mgr|foreman)\b/i,
    /maintenance\s+tech/i,
    /maintenance\s+specialist/i,
    /\btechnician\b/i,
    /\bnde\b/i,
    /fabricat/i,
    /turbine\s+(services|svcs|equip)/i,
    /welder/i,
    /machinist/i,
    /craft/i,
    /\bmaint\b/i,
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
    /administrat/i,
    /coordinator/i,
    /\bcoord\b/i,
    /\bscheduling\b/i,
    /\bplanning\b/i,
    /business\s+analy/i,
    /\bmanager\b/i,
    /\bmgr\b/i,
    /\bdirector\b/i,
    /\banalyst\b/i,
    /\bplanner\b/i,
    /\bscheduler\b/i,
    /procurement/i,
    /sourcing/i,
    /supply\s+(chain|management)/i,
    /human\s+resources/i,
    /\bhr\s/i,
    /document\s+control/i,
    /\bcounsel\b/i,
    /\battorney\b/i,
    /\baccountant\b/i,
    /accounting/i,
    /\bfinance\b/i,
    /financial/i,
    /\bauditor\b/i,
    /\bconsultant\b/i,
    /\bassociate\b/i,
    /\bstorekeeper\b/i,
    /\bcontract\b/i,
    /quality/i,
    /project\s+(manager|mgr|manger|management|controls)/i,
    /\bsuperintendent\b/i,
    /\bsupt\b/i,
    /process\s+owner/i,
    /\bscientist\b/i,
    /\bnurse\b/i,
    /\bspecialist\b/i,
    /\bspec\b/i,
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
  return ['operations', 'maintenance', 'engineering', 'health-physics', 'security', 'training', 'administrative', 'other'];
}

// --- Engineering disciplines -------------------------------------------------
// Engineering is the largest category, so we expose discipline sub-facets for
// SEO landing pages (e.g. "nuclear electrical engineer jobs"). Unlike top-level
// categories these OVERLAP — a "Senior Mechanical Design Engineer" legitimately
// belongs on both the mechanical and design pages. A job only surfaces on a
// discipline page if it is already in the `engineering` category.

export interface EngineeringDisciplineInfo {
  slug: string;
  name: string;
  /** H1 / SEO phrase, e.g. "Nuclear Electrical Engineer". */
  title: string;
  description: string;
  pattern: RegExp;
}

export const ENGINEERING_DISCIPLINES: EngineeringDisciplineInfo[] = [
  {
    slug: 'electrical-engineering',
    name: 'Electrical',
    title: 'Nuclear Electrical Engineer',
    description: 'Electrical engineering roles — power systems, protection, and plant electrical design at US nuclear facilities.',
    pattern: /electrical/i,
  },
  {
    slug: 'mechanical-engineering',
    name: 'Mechanical',
    title: 'Nuclear Mechanical Engineer',
    description: 'Mechanical engineering roles — rotating equipment, piping, and component design at US nuclear facilities.',
    pattern: /mechanical/i,
  },
  {
    slug: 'design-engineering',
    name: 'Design',
    title: 'Nuclear Design Engineer',
    description: 'Design engineering roles — modifications, configuration, and plant design change at US nuclear facilities.',
    pattern: /design/i,
  },
  {
    slug: 'civil-engineering',
    name: 'Civil / Structural',
    title: 'Nuclear Civil & Structural Engineer',
    description: 'Civil and structural engineering roles — seismic, concrete, and structural analysis at US nuclear facilities.',
    pattern: /civil|structural/i,
  },
  {
    slug: 'i-and-c-engineering',
    name: 'I&C / Controls',
    title: 'Nuclear I&C Engineer',
    description: 'Instrumentation and controls engineering — digital I&C, instrumentation, and control systems at US nuclear facilities.',
    pattern: /i\s*&\s*c|i&c|instrument|controls?\b/i,
  },
  {
    slug: 'reactor-engineering',
    name: 'Reactor & Core',
    title: 'Reactor & Core Engineer',
    description: 'Reactor and core engineering roles — reactor engineering, core design, thermal hydraulics, criticality, and shielding at US nuclear facilities.',
    pattern: /\breactor\b|\bcore\b|criticality|shielding/i,
  },
  {
    slug: 'fuel-engineering',
    name: 'Fuel',
    title: 'Nuclear Fuel Engineer',
    description: 'Nuclear fuel engineering roles — fuel design, reload, and fuel cycle analysis at US nuclear facilities.',
    pattern: /\bfuel\b/i,
  },
];

/** Disciplines a job title belongs to. Empty unless the title matches at least
 * one discipline pattern — callers should only pass `engineering` jobs. */
export function getEngineeringDisciplines(title: string): string[] {
  return ENGINEERING_DISCIPLINES.filter((d) => d.pattern.test(title)).map((d) => d.slug);
}

export function getEngineeringDisciplineInfo(slug: string): EngineeringDisciplineInfo | undefined {
  return ENGINEERING_DISCIPLINES.find((d) => d.slug === slug);
}

export function getAllEngineeringDisciplineSlugs(): string[] {
  return ENGINEERING_DISCIPLINES.map((d) => d.slug);
}
