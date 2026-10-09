import { getAllJobs } from '@/lib/data/employer';
import { SITEMAP_BASE_URL, lastmodTag, newestJobDate, xmlResponse } from '@/lib/sitemap';

const sitemaps = [
  'sitemap-static.xml',
  'sitemap-jobs.xml',
  'sitemap-states.xml',
  'sitemap-categories.xml',
  'sitemap-companies.xml',
  'sitemap-plants.xml',
];

export async function GET() {
  const lastmod = newestJobDate(await getAllJobs());

  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((name) => `  <sitemap>
    <loc>${SITEMAP_BASE_URL}/${name}</loc>${lastmodTag(lastmod)}
  </sitemap>`).join('\n')}
</sitemapindex>`);
}
