import { getAllJobs } from '@/lib/data/employer';
import { SITEMAP_BASE_URL, lastmodTag, newestJobDate, xmlResponse } from '@/lib/sitemap';

const pages = [
  { path: '', priority: '1.0', changefreq: 'daily', listsJobs: true },
  { path: '/jobs', priority: '0.9', changefreq: 'daily', listsJobs: true },
  { path: '/companies', priority: '0.9', changefreq: 'daily', listsJobs: true },
  { path: '/about', priority: '0.5', changefreq: 'monthly', listsJobs: false },
  { path: '/contact', priority: '0.5', changefreq: 'monthly', listsJobs: false },
  { path: '/privacy', priority: '0.3', changefreq: 'monthly', listsJobs: false },
  { path: '/terms', priority: '0.3', changefreq: 'monthly', listsJobs: false },
];

export async function GET() {
  const newestJob = newestJobDate(await getAllJobs());

  const entries = pages.map(({ path, priority, changefreq, listsJobs }) => `  <url>
    <loc>${SITEMAP_BASE_URL}${path}</loc>${lastmodTag(listsJobs ? newestJob : undefined)}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n');

  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`);
}
