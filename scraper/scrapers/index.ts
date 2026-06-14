import { BaseScraper, BrowserBaseScraper } from './base';
import { WorkdayScraper } from './workday';
import { GenericBrowserScraper, GenericScraper } from './generic';
import { ConstellationScraper } from './constellation';
import { TVAScraper } from './tva';
import { GreenhouseScraper } from './greenhouse';
import { LeverScraper } from './lever';
import { PhenomScraper } from './phenom';
import { CompanyConfig } from '../types';

export function createScraper(config: CompanyConfig): BaseScraper {
  // API-based ATS adapters first — selected by scraperType, work for any company.
  switch (config.scraperType) {
    case 'greenhouse':
      return new GreenhouseScraper(config);
    case 'lever':
      return new LeverScraper(config);
    case 'phenom':
      return new PhenomScraper(config);
    case 'workday':
      return new WorkdayScraper(config);
  }

  // Company-specific custom scrapers (legacy fallbacks).
  switch (config.id) {
    case 'constellation':
      return new ConstellationScraper(config);
    case 'tva':
      return new TVAScraper(config);
    default:
      return new GenericBrowserScraper(config);
  }
}

export {
  BaseScraper,
  BrowserBaseScraper,
  WorkdayScraper,
  GenericScraper,
  GenericBrowserScraper,
  ConstellationScraper,
  TVAScraper,
  GreenhouseScraper,
  LeverScraper,
  PhenomScraper
};
