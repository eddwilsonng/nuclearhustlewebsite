import { CompanyConfig } from './types';

/**
 * The Nuclear Hustle scrape universe.
 *
 * Derived from src/data/Nuclear Companies - Job search.csv (22 US nuclear operators)
 * plus advanced-reactor startups. Each source is mapped to the most reliable adapter
 * for its applicant-tracking system (ATS):
 *
 *   workday    — clean JSON API via network interception (best). Needs workdayHost.
 *   greenhouse — public boards API. Needs atsSlug (board token).
 *   lever      — public postings API. Needs atsSlug (company handle).
 *   custom     — bespoke Playwright scraper (GenericBrowserScraper or per-company).
 *
 * `verified: true` = confirmed producing jobs. Others are wired but need a live run /
 * dedicated adapter (tracked as Phase B follow-ups).
 */

export interface ScrapeSource extends CompanyConfig {
  verified?: boolean;
}

export const COMPANIES: ScrapeSource[] = [
  // ---- Workday operators (clean JSON API) ----
  {
    id: 'duke',
    name: 'Duke Energy',
    careersUrl: 'https://dukeenergy.wd1.myworkdayjobs.com/search',
    scraperType: 'workday',
    workdayHost: 'dukeenergy.wd1.myworkdayjobs.com',
    verified: true,
  },
  {
    id: 'ameren',
    name: 'Ameren Missouri',
    careersUrl: 'https://ameren.wd1.myworkdayjobs.com/External',
    scraperType: 'workday',
    workdayHost: 'ameren.wd1.myworkdayjobs.com',
  },
  {
    id: 'energy-northwest',
    name: 'Energy Northwest',
    careersUrl: 'https://energynorthwest.wd1.myworkdayjobs.com/External',
    scraperType: 'workday',
    workdayHost: 'energynorthwest.wd1.myworkdayjobs.com',
  },
  {
    id: 'talen',
    name: 'Talen Energy',
    careersUrl: 'https://talenenergy.wd1.myworkdayjobs.com/TalenCareers',
    scraperType: 'workday',
    workdayHost: 'talenenergy.wd1.myworkdayjobs.com',
  },

  // ---- Advanced-reactor startups (Greenhouse boards API) ----
  {
    id: 'oklo',
    name: 'Oklo',
    careersUrl: 'https://oklo.com/careers',
    scraperType: 'greenhouse',
    atsSlug: 'oklo',
  },
  {
    id: 'terrapower',
    name: 'TerraPower',
    careersUrl: 'https://www.terrapower.com/careers/',
    scraperType: 'greenhouse',
    atsSlug: 'terrapowerllc',
  },
  {
    id: 'kairos-power',
    name: 'Kairos Power',
    careersUrl: 'https://www.kairospower.com/careers/',
    scraperType: 'greenhouse',
    atsSlug: 'kairospower',
  },

  // ---- SuccessFactors / jobs2web operators (HTML tile parsing, no browser) ----
  {
    id: 'dominion',
    name: 'Dominion Energy',
    careersUrl: 'https://careers.dominionenergy.com/',
    scraperType: 'successfactors',
    searchKeyword: 'nuclear',
  },
  {
    id: 'entergy',
    name: 'Entergy',
    careersUrl: 'https://jobs.entergy.com/',
    scraperType: 'successfactors',
    searchKeyword: 'nuclear',
  },

  // ---- Constellation: Phenom /api/jobs (largest US nuclear operator) ----
  {
    id: 'constellation',
    name: 'Constellation Energy',
    careersUrl: 'https://jobs.constellationenergy.com/careers-home/',
    scraperType: 'phenom',
    searchKeyword: 'nuclear',
    verified: true,
  },

  // ---- Custom scrapers needing repair (Phase B follow-ups) ----
  // NextEra runs a JS-rendered search app; TVA sits behind Cloudflare. Both need
  // browser-based scraping with anti-bot handling — left on the legacy custom path.
  {
    id: 'nextera',
    name: 'NextEra Energy',
    careersUrl: 'https://www.nexteraenergy.com/careers/search-jobs.html',
    scraperType: 'custom',
  },
  {
    id: 'tva',
    name: 'Tennessee Valley Authority',
    careersUrl: 'https://www.tva.com/careers',
    scraperType: 'custom',
  },

  // ---- Additional operators from the master list (need a dedicated ATS adapter) ----
  // These run on Taleo / Dayforce / SuccessFactors / Phenom / iCIMS. Wired as `custom`
  // (GenericBrowserScraper) for now; each likely needs its own adapter to be reliable.
  {
    id: 'southern-nuclear',
    name: 'Southern Nuclear',
    careersUrl: 'https://southerncompany-nuclear.jobs/jobs/',
    scraperType: 'custom',
  },
  {
    id: 'aps',
    name: 'Arizona Public Service',
    careersUrl: 'https://careers.aps.com/',
    scraperType: 'successfactors',
    searchKeyword: 'nuclear',
  },
  {
    id: 'pge',
    name: 'Pacific Gas & Electric',
    careersUrl: 'https://jobs.pge.com/search-jobs',
    scraperType: 'successfactors',
    searchKeyword: 'nuclear',
  },
  {
    id: 'pseg',
    name: 'PSEG',
    careersUrl: 'https://jobs.pseg.com/viewalljobs/',
    scraperType: 'successfactors',
    searchKeyword: 'nuclear',
  },
  {
    id: 'xcel',
    name: 'Xcel Energy',
    careersUrl: 'https://xcelenergy.wd1.myworkdayjobs.com/External',
    scraperType: 'workday',
    workdayHost: 'xcelenergy.wd1.myworkdayjobs.com',
    searchKeyword: 'nuclear',
  },
  {
    id: 'dte',
    name: 'DTE Energy',
    careersUrl: 'https://careers.dteenergy.com/search/',
    scraperType: 'successfactors',
    searchKeyword: 'nuclear',
  },
  {
    id: 'aep',
    name: 'Indiana Michigan Power (AEP)',
    careersUrl: 'https://aep.wd1.myworkdayjobs.com/AEPCareerSite',
    scraperType: 'workday',
    workdayHost: 'aep.wd1.myworkdayjobs.com',
    searchKeyword: 'nuclear',
  },
  {
    id: 'vistra',
    name: 'Luminant (Vistra)',
    careersUrl: 'https://vistracorp.com/careers/',
    scraperType: 'custom',
  },
  {
    id: 'stp',
    name: 'STP Nuclear Operating Company',
    careersUrl: 'https://stp.dayforcehcm.com/CandidatePortal/en-US/stp',
    scraperType: 'custom',
  },
  {
    id: 'wolf-creek',
    name: 'Wolf Creek Nuclear Operating Corporation',
    careersUrl:
      'https://evergy.taleo.net/careersection/evergy_external_career_section/jobsearch.ftl',
    scraperType: 'custom',
  },
  {
    id: 'nppd',
    name: 'Nebraska Public Power District',
    careersUrl: 'https://www.nppd.com/careers',
    scraperType: 'custom',
  },
];

export function getCompany(id: string): ScrapeSource | undefined {
  return COMPANIES.find((c) => c.id === id);
}
