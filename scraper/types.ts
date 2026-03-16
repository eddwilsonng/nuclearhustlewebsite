export interface ScrapedJob {
  title: string;
  location: string;
  url: string;
  description?: string;
}

export interface ScraperResult {
  companyId: string;
  jobs: ScrapedJob[];
  success: boolean;
  error?: string;
}

export interface CompanyConfig {
  id: string;
  name: string;
  careersUrl: string;
  scraperType: 'custom' | 'workday';
}
