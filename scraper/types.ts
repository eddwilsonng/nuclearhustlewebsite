export interface ScrapedJob {
  title: string;
  location: string;
  url: string;
  description?: string;
  department?: string;
}

export interface ScraperResult {
  companyId: string;
  jobs: ScrapedJob[];
  success: boolean;
  error?: string;
}

export type ScraperType =
  | 'custom'
  | 'workday'
  | 'greenhouse'
  | 'lever'
  | 'phenom';

export interface CompanyConfig {
  id: string;
  name: string;
  careersUrl: string;
  scraperType: ScraperType;
  /**
   * Slug/identifier used by API-based ATS adapters.
   * - greenhouse: board token, e.g. "nuscalepower"
   * - lever: company handle, e.g. "oklo"
   */
  atsSlug?: string;
  /**
   * Workday tenant host, e.g. "ameren.wd1.myworkdayjobs.com".
   * If omitted, the WorkdayScraper derives it from careersUrl.
   */
  workdayHost?: string;
  /**
   * Optional server-side keyword pre-filter for API adapters that support it
   * (e.g. Phenom `?keywords=nuclear`). Central relevance filtering still applies.
   */
  searchKeyword?: string;
}
