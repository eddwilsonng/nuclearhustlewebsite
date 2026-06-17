import type { JobCategory } from './categorize';

export interface Company {
  id: string;
  name: string;
  careers_url: string;
  scraper_type: 'workday' | 'custom' | 'taleo' | 'dayforce' | 'greenhouse' | 'lever';
  last_scraped: string | null;
  description?: string | null;
  logo_url?: string | null;
}

export interface Plant {
  id: string;
  company_id: string;
  name: string;
  region: 'Midwest' | 'Southeast' | 'Northeast' | 'Southwest' | 'West';
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  location: string;
  url: string;
  scraped_at: string;
  slug: string;
  state: string | null;
  category: JobCategory;
  description?: string;
  structured_description?: StructuredDescription | null;
  skills?: string[];
  status?: 'pending_review' | 'published' | 'rejected';
  agent_confidence?: 'high' | 'low';
  review_notes?: string;
}

export interface JobWithCompany extends Job {
  company: Company;
  isEmployerJob?: boolean;
  is_featured?: boolean;
  featured_until?: string | null;
  application_type?: 'link' | 'form';
  employment_type?: string;
  structured_description?: StructuredDescription | null;
}

export type Region = Plant['region'];

export interface JobListItem {
  id: string;
  company_id: string;
  title: string;
  location: string;
  slug: string;
  category: JobCategory;
  scraped_at: string;
  employment_type?: string;
  skills?: string[];
  isEmployerJob?: boolean;
  is_featured?: boolean;
  featured_until?: string | null;
  company: { id: string; name: string };
}

export const REGIONS: Region[] = ['Midwest', 'Southeast', 'Northeast', 'Southwest', 'West'];

// Auth types
export type UserRole = 'job_seeker' | 'employer';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface JobSeekerProfile {
  id: string;
  user_id: string;
  location: string | null; // city
  state: string | null; // state code, e.g. "IL"
  is_actively_looking: boolean;
  phone: string | null;
  resume_url: string | null;
  resume_filename: string | null;
  created_at: string;
}

export interface EmployerProfile {
  id: string;
  user_id: string;
  company_name: string;
  company_slug: string;
  company_website: string | null;
  company_description: string | null;
  company_logo_url: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface StructuredDescription {
  about?: string;
  responsibilities?: string;
  qualifications?: string;
  desired?: string;
  location_details?: string;
  what_we_offer?: string;
  skills?: string[];
}

export interface EmployerJob {
  id: string;
  employer_id: string;
  title: string;
  slug: string;
  location: string;
  state: string | null;
  category: string;
  description: string;
  structured_description?: StructuredDescription | null;
  employment_type: string;
  application_type: 'link' | 'form';
  application_url: string | null;
  application_email: string | null;
  is_active: boolean;
  is_featured: boolean;
  featured_until: string | null;
  expires_at: string | null;
  view_count: number;
  created_at: string;
}


export interface EmployerJobWithProfile extends EmployerJob {
  employer: EmployerProfile;
}

export type ApplicationStatus = 'new' | 'reviewed' | 'shortlisted' | 'rejected';

export interface JobApplication {
  id: string;
  job_id: string;
  employer_id: string;
  applicant_name: string;
  applicant_email: string;
  message: string | null;
  cv_path: string | null;
  status: ApplicationStatus;
  created_at: string;
}
