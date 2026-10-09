import plantsData from '@/data/plants.json';
import { getJobsWithCompany } from '@/lib/data/static';
import { OPERATOR_TO_COMPANY } from '@/lib/plants/operators';
import {
  SITEMAP_BASE_URL,
  groupJobsBy,
  lastmodTag,
  newestJobDate,
  xmlResponse,
} from '@/lib/sitemap';

export function GET() {
  // Plant pages list the operator's scraped jobs, so that's what changes them.
  const jobsByCompany = groupJobsBy(getJobsWithCompany(), (job) => job.company_id);

  const plantEntries = plantsData.plants.map((plant) => {
    const operatorJobs = jobsByCompany.get(OPERATOR_TO_COMPANY[plant.operator]) ?? [];
    return `  <url>
    <loc>${SITEMAP_BASE_URL}/plants/${plant.id}</loc>${lastmodTag(newestJobDate(operatorJobs))}
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('\n');

  const indexEntry = `  <url>
    <loc>${SITEMAP_BASE_URL}/plants</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;

  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexEntry}
${plantEntries}
</urlset>`);
}
