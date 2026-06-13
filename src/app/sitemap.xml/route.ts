import { NextResponse } from 'next/server';

const BASE_URL = 'https://nuclearhustle.com';
const lastmod = new Date().toISOString().split('T')[0];

const sitemaps = [
  'sitemap-static.xml',
  'sitemap-jobs.xml',
  'sitemap-states.xml',
  'sitemap-categories.xml',
  'sitemap-companies.xml',
];

export function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((name) => `  <sitemap>
    <loc>${BASE_URL}/${name}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
