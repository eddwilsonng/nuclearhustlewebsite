import { NextResponse } from 'next/server';
import { getCompanies } from '@/lib/data/static';

const BASE_URL = 'https://nuclearhustle.com';
const lastmod = new Date().toISOString().split('T')[0];

export function GET() {
  const companies = getCompanies();

  const entries = companies.map((company) => `  <url>
    <loc>${BASE_URL}/companies/${company.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

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
