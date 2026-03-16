import type { JobCategory } from './categorize';

export interface Company {
  id: string;
  name: string;
  careers_url: string;
  scraper_type: 'workday' | 'custom' | 'taleo' | 'dayforce';
  last_scraped: string | null;
  description?: string | null;
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
}

export interface JobWithCompany extends Job {
  company: Company;
  isEmployerJob?: boolean;
  application_type?: 'link' | 'form';
  employment_type?: string;
  structured_description?: StructuredDescription | null;
}

export type Region = Plant['region'];

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
  location: string | null;
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
  expires_at: string | null;
  created_at: string;
}


export interface EmployerJobWithProfile extends EmployerJob {
  employer: EmployerProfile;
}
