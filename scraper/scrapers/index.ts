import { BaseScraper, BrowserBaseScraper } from './base';
import { WorkdayScraper } from './workday';
import { GenericBrowserScraper, GenericScraper } from './generic';
import { ConstellationScraper } from './constellation';
import { TVAScraper } from './tva';
import { CompanyConfig } from '../types';

export function createScraper(config: CompanyConfig): BaseScraper {
  // Use company-specific scrapers where available
  switch (config.id) {
    case 'constellation':
      return new ConstellationScraper(config);
    case 'tva':
      return new TVAScraper(config);
    case 'duke':
      return new WorkdayScraper(config);
    default:
      // Use workday scraper for workday sites, generic browser scraper for others
      if (config.scraperType === 'workday') {
        return new WorkdayScraper(config);
      }
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
  TVAScraper
};
