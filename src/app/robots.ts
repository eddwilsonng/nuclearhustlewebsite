import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/onboarding/', '/api/', '/login', '/signup/'],
    },
    sitemap: 'https://www.nuclearhustle.com/sitemap.xml',
  };
}
