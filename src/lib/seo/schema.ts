import type { Job } from '@/lib/types';

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
