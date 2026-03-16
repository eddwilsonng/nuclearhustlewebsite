import { MetadataRoute } from 'next';
import { getAllJobSlugs, getAllStateSlugs, getCompanies } from '@/lib/data';
import { getAllCategories } from '@/lib/categorize';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://nuclearhustle.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/companies`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Job pages
  const jobSlugs = getAllJobSlugs();
  const jobPages: MetadataRoute.Sitemap = jobSlugs.map((slug) => ({
    url: `${baseUrl}/job/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // State pages
  const stateSlugs = getAllStateSlugs();
  const statePages: MetadataRoute.Sitemap = stateSlugs.map((slug) => ({
    url: `${baseUrl}/jobs/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Category pages
  const categories = getAllCategories();
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/jobs/role/${category}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Company pages
  const companies = getCompanies();
  const companyPages: MetadataRoute.Sitemap = companies.map((company) => ({
    url: `${baseUrl}/companies/${company.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...statePages,
    ...categoryPages,
    ...companyPages,
    ...jobPages,
  ];
}
