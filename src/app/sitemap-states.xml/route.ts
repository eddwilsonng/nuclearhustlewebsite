import {
  getAllActiveStates,
  getAllActiveStateCategoryCombos,
  getAllJobs,
} from '@/lib/data/employer';
import {
  SITEMAP_BASE_URL,
  groupJobsBy,
  lastmodTag,
  newestJobDate,
  xmlResponse,
} from '@/lib/sitemap';

export async function GET() {
  const [activeStates, combos, jobs] = await Promise.all([
    getAllActiveStates(),
    getAllActiveStateCategoryCombos(),
    getAllJobs(),
  ]);

  const jobsByState = groupJobsBy(jobs, (job) => job.state);
  const jobsByCombo = groupJobsBy(jobs, (job) => job.state && `${job.state}|${job.category}`);

  const stateEntries = activeStates.map(({ state }) => `  <url>
    <loc>${SITEMAP_BASE_URL}/jobs/${state.slug}</loc>${lastmodTag(newestJobDate(jobsByState.get(state.slug) ?? []))}
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);

  // State×role intersection pages — only those with live listings.
  const comboEntries = combos.map(({ stateSlug, category }) => `  <url>
    <loc>${SITEMAP_BASE_URL}/jobs/${stateSlug}/${category}</loc>${lastmodTag(newestJobDate(jobsByCombo.get(`${stateSlug}|${category}`) ?? []))}
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`);

  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...stateEntries, ...comboEntries].join('\n')}
</urlset>`);
}
