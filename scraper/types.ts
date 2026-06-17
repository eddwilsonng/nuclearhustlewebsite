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
  | 'phenom'
  | 'successfactors';

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
  /**
   * For SuccessFactors CSB sites that paginate via path offset rather than
   * ?startrow=n (e.g. /go/All-Careers/8736400/25/). When set, careersUrl
   * must point to the category listing page and the scraper appends /{offset}/.
   */
  csbPathPagination?: boolean;
}
