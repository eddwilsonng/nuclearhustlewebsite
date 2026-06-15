import type { Job } from '@/lib/types';

const SITE_URL = 'https://www.nuclearhustle.com';

export function generateOrganizationSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Nuclear Hustle',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/favicon.svg`,
      width: 512,
      height: 512,
    },
    description: 'Specialist job board for US nuclear power plant professionals — operators, engineers, health physicists, and maintenance crews.',
    sameAs: ['https://x.com/nuclearhustle'],
  };
}

export function generateWebSiteSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Nuclear Hustle',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/jobs?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateJobPostingSchema(
  job: Job,
  company: { name: string; id: string }
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: `${company.name} is hiring for a ${job.category} role in ${job.state || 'the US'}.`,
    jobLocation: {
      '@type': 'Place',
      name: job.state ? `${job.state}, US` : 'United States',
    },
    hiringOrganization: {
      '@type': 'Organization',
      name: company.name,
    },
    datePosted: job.scraped_at || new Date().toISOString(),
    employmentType: 'FULL_TIME',
    url: `https://www.nuclearhustle.com/job/${job.slug}`,
  };
}

export function generateCategoryPageSchema(params: {
  categoryName: string;
  categoryDescription: string;
  jobCount: number;
  jobs: Job[];
  companies: Map<string, string>;
  states: string[];
  url: string;
}): object {
  const jobPostings = params.jobs.slice(0, 50).map((job) => {
    const companyName = params.companies.get(job.company_id) || job.company_id;
    return generateJobPostingSchema(job, { name: companyName, id: job.company_id });
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'JobCollectionPage',
    name: `Nuclear ${params.categoryName} Jobs`,
    description: params.categoryDescription,
    url: params.url,
    jobLocations: params.states.map((state) => ({
      '@type': 'Place',
      name: `${state}, US`,
    })),
    mainEntity: jobPostings,
    numberOfItems: params.jobCount,
  };
}
