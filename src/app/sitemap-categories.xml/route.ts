import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/categorize';

const BASE_URL = 'https://nuclearhustle.com';
const lastmod = new Date().toISOString().split('T')[0];

export function GET() {
  const categories = getAllCategories();

  const entries = categories.map((category) => `  <url>
    <loc>${BASE_URL}/jobs/role/${category}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
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
