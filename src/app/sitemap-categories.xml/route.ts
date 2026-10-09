import { getAllCategories } from '@/lib/categorize';
import { getActiveEngineeringDisciplines, filterByEngineeringDiscipline } from '@/lib/data/static';
import { getAllJobs } from '@/lib/data/employer';
import {
  SITEMAP_BASE_URL,
  groupJobsBy,
  lastmodTag,
  newestJobDate,
  xmlResponse,
} from '@/lib/sitemap';

export async function GET() {
  const jobs = await getAllJobs();
  const jobsByCategory = groupJobsBy(jobs, (job) => job.category);

  const categoryEntries = getAllCategories().map((category) => `  <url>
    <loc>${SITEMAP_BASE_URL}/jobs/role/${category}</loc>${lastmodTag(newestJobDate(jobsByCategory.get(category) ?? []))}
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);

  // Engineering discipline facets — only those with live listings.
  const disciplineEntries = getActiveEngineeringDisciplines().map(({ slug }) => `  <url>
    <loc>${SITEMAP_BASE_URL}/jobs/role/engineering/${slug}</loc>${lastmodTag(newestJobDate(filterByEngineeringDiscipline(jobs, slug)))}
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`);

  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...categoryEntries, ...disciplineEntries].join('\n')}
</urlset>`);
}
