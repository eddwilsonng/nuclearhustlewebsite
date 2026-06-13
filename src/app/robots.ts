import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/onboarding/', '/api/', '/login', '/signup/'],
    },
    sitemap: 'https://nuclearhustle.com/sitemap.xml',
  };
}
