import { getAllJobs } from '@/lib/data/employer';
import { SITEMAP_BASE_URL, lastmodTag, xmlResponse } from '@/lib/sitemap';

export async function GET() {
  const jobs = await getAllJobs();

  const entries = jobs.map((job) => `  <url>
    <loc>${SITEMAP_BASE_URL}/job/${job.slug}</loc>${lastmodTag(job.scraped_at.split('T')[0])}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`);
}
