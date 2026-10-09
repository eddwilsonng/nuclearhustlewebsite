import { getAllCompanies, getAllJobs } from '@/lib/data/employer';
import {
  SITEMAP_BASE_URL,
  groupJobsBy,
  lastmodTag,
  newestJobDate,
  xmlResponse,
} from '@/lib/sitemap';

export async function GET() {
  const [companies, jobs] = await Promise.all([getAllCompanies(), getAllJobs()]);
  const jobsByCompany = groupJobsBy(jobs, (job) => job.company_id);

  const entries = companies.map((company) => `  <url>
    <loc>${SITEMAP_BASE_URL}/companies/${company.id}</loc>${lastmodTag(newestJobDate(jobsByCompany.get(company.id) ?? []))}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`);
}
