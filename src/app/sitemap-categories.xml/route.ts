import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/categorize';
import { getActiveEngineeringDisciplines } from '@/lib/data/static';

const BASE_URL = 'https://www.nuclearhustle.com';
const lastmod = new Date().toISOString().split('T')[0];

export function GET() {
  const categories = getAllCategories();

  const categoryEntries = categories.map((category) => `  <url>
    <loc>${BASE_URL}/jobs/role/${category}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);

  // Engineering discipline facets — only those with live listings.
  const disciplineEntries = getActiveEngineeringDisciplines().map(({ slug }) => `  <url>
    <loc>${BASE_URL}/jobs/role/engineering/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`);

  const entries = [...categoryEntries, ...disciplineEntries].join('\n');

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
