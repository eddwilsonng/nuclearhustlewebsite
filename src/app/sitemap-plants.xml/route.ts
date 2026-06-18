import { NextResponse } from 'next/server';
import plantsData from '@/data/plants.json';

const BASE_URL = 'https://www.nuclearhustle.com';
const lastmod = new Date().toISOString().split('T')[0];

export function GET() {
  const plantEntries = plantsData.plants.map((plant) => `  <url>
    <loc>${BASE_URL}/plants/${plant.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');

  const indexEntry = `  <url>
    <loc>${BASE_URL}/plants</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexEntry}
${plantEntries}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
