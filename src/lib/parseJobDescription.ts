// Parses raw job description text into structured sections

export interface JobSection {
  title: string;
  content: string[];
  type: 'paragraph' | 'list';
}

export interface ParsedJobDescription {
  overview: string;
  sections: JobSection[];
}

// Section headers to look for
const SECTION_HEADERS = [
  'Responsibilities',
  'Key Responsibilities',
  'Job Responsibilities',
  'Primary Responsibilities',
  'Duties',
  'Requirements',
  'Required Qualifications',
  'Basic Qualifications',
  'Required/Basic Qualifications',
  'Minimum Qualifications',
  'Preferred Qualifications',
  'Desired Qualifications',
  'Additional Preferred Qualifications',
  'Qualifications',
  'Skills',
  'Working Conditions',
  'Work Environment',
  'Education',
  'Experience',
  'Travel Requirements',
  'Specific Requirements',
  'Benefits',
  'What We Offer',
];

// Action verbs that typically start list items
const ACTION_VERBS = [
  'Ability', 'Able', 'Analyze', 'Apply', 'Assist', 'Assure', 'Build',
  'Collaborate', 'Communicate', 'Complete', 'Conduct', 'Contribute',
  'Coordinate', 'Create', 'Deliver', 'Demonstrate', 'Design', 'Develop',
  'Direct', 'Drive', 'Effectively', 'Ensure', 'Establish', 'Evaluate',
  'Execute', 'Experience', 'Facilitate', 'Follow', 'Handle', 'Help',
  'Identify', 'Implement', 'Improve', 'Knowledge', 'Lead', 'Maintain',
  'Manage', 'Monitor', 'Must', 'Operate', 'Oversee', 'Participate',
  'Perform', 'Plan', 'Prepare', 'Proficiency', 'Provide', 'Report',
  'Research', 'Review', 'Strong', 'Successfully', 'Support', 'Train',
  'Understand', 'Use', 'Utilize', 'Work', 'Write', 'Bachelor', 'Master',
  'Degree', 'Years', 'Minimum', 'At least',
];

export function parseJobDescription(rawText: string): ParsedJobDescription {
  if (!rawText || rawText.length < 100) {
    return { overview: rawText || '', sections: [] };
  }

  const result: ParsedJobDescription = {
    overview: '',
    sections: [],
  };

  // Step 1: Insert line breaks before section headers
  let text = rawText;
  for (const header of SECTION_HEADERS) {
    // Match header preceded by punctuation or start, case insensitive
    const regex = new RegExp(`([.!?\\s])(${header})\\b`, 'gi');
    text = text.replace(regex, '$1\n\n$2');
  }

  // Step 2: Split into rough sections
  const parts = text.split('\n\n').map(p => p.trim()).filter(p => p.length > 0);

  let currentSection: JobSection | null = null;
  const overviewParts: string[] = [];

  for (const part of parts) {
    // Check if this part starts with a section header
    const headerMatch = SECTION_HEADERS.find(h =>
      part.toLowerCase().startsWith(h.toLowerCase())
    );

    if (headerMatch) {
      // Save previous section
      if (currentSection && currentSection.content.length > 0) {
        result.sections.push(currentSection);
      }

      // Extract content after the header
      const contentAfterHeader = part.slice(headerMatch.length).trim();

      currentSection = {
        title: headerMatch,
        content: [],
        type: 'list', // Default to list for most job sections
      };

      // Process content after header
      if (contentAfterHeader) {
        const items = splitIntoItems(contentAfterHeader);
        currentSection.content.push(...items);
      }
    } else if (currentSection) {
      // Add to current section
      const items = splitIntoItems(part);
      currentSection.content.push(...items);
    } else {
      // Overview content
      overviewParts.push(part);
    }
  }

  // Don't forget last section
  if (currentSection && currentSection.content.length > 0) {
    result.sections.push(currentSection);
  }

  // Process overview
  const overviewText = overviewParts.join(' ');
  result.overview = extractOverview(overviewText);

  // Clean sections
  result.sections = result.sections
    .map(section => ({
      ...section,
      content: section.content.filter(item =>
        item.length > 10 &&
        !item.toLowerCase().includes('privacy') &&
        !item.toLowerCase().includes('cookie') &&
        !item.toLowerCase().includes('do not sell') &&
        !item.toLowerCase().includes('terms of use')
      ),
    }))
    .filter(section => section.content.length > 0);

  return result;
}

function splitIntoItems(text: string): string[] {
  const items: string[] = [];

  // First, try to split on sentence boundaries followed by action verbs
  let remaining = text;

  for (const verb of ACTION_VERBS) {
    // Split before action verbs that follow sentence endings
    const regex = new RegExp(`([.!?])\\s*(${verb})\\b`, 'g');
    remaining = remaining.replace(regex, '$1\n$2');
  }

  // Split by newlines
  const lines = remaining.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  for (const line of lines) {
    // Clean up the line
    let cleaned = line
      .replace(/^[•\-–—]\s*/, '') // Remove bullet points
      .replace(/^\d+[.)]\s*/, '') // Remove numbered list markers
      .trim();

    if (cleaned.length > 10) {
      items.push(cleaned);
    }
  }

  return items;
}

function extractOverview(text: string): string {
  // Split into sentences
  const sentences = text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 20);

  // Filter out boilerplate
  const meaningful = sentences.filter(s => {
    const lower = s.toLowerCase();
    return !lower.includes('submit your application') &&
           !lower.includes('important application') &&
           !lower.includes('privacy') &&
           !lower.includes('cookie');
  });

  // Take first 3 meaningful sentences
  return meaningful.slice(0, 3).join(' ');
}

// Format section title for display
export function formatSectionTitle(title: string): string {
  const normalizations: Record<string, string> = {
    'Required/Basic Qualifications': 'Requirements',
    'Basic Qualifications': 'Requirements',
    'Required Qualifications': 'Requirements',
    'Minimum Qualifications': 'Requirements',
    'Desired Qualifications': 'Preferred Qualifications',
    'Additional Preferred Qualifications': 'Preferred Qualifications',
    'Working Conditions': 'Work Environment',
    'Key Responsibilities': 'Responsibilities',
    'Job Responsibilities': 'Responsibilities',
    'Primary Responsibilities': 'Responsibilities',
  };

  return normalizations[title] || title;
}
