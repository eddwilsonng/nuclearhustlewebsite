import { NextResponse } from 'next/server';
import { getAllActiveStates, getAllActiveStateCategoryCombos } from '@/lib/data/employer';

const BASE_URL = 'https://www.nuclearhustle.com';
const lastmod = new Date().toISOString().split('T')[0];

export async function GET() {
  const [activeStates, combos] = await Promise.all([
    getAllActiveStates(),
    getAllActiveStateCategoryCombos(),
  ]);
  const slugs = activeStates.map(({ state }) => state.slug);

  const stateEntries = slugs.map((slug) => `  <url>
    <loc>${BASE_URL}/jobs/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);

  // State×role intersection pages — only those with live listings.
  const comboEntries = combos.map(({ stateSlug, category }) => `  <url>
    <loc>${BASE_URL}/jobs/${stateSlug}/${category}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`);

  const entries = [...stateEntries, ...comboEntries].join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
