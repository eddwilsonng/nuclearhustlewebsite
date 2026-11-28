import { Facebook, Linkedin } from 'lucide-react';
import { ExternalLinkButton } from '@/components/ui/LinkButton';

interface CommunityBannerProps {
  variant?: 'jobs' | 'outages';
}

export function CommunityBanner({ variant = 'jobs' }: CommunityBannerProps) {
  const facebookUrl =
    variant === 'jobs'
      ? 'https://www.facebook.com/groups/1086918477294291?utm_source=site&utm_medium=jobs_banner&utm_campaign=community'
      : 'https://www.facebook.com/groups/1086918477294291?utm_source=site&utm_medium=outages_banner&utm_campaign=community';

  const linkedinUrl =
    variant === 'jobs'
      ? 'https://www.linkedin.com/showcase/129954376?utm_source=site&utm_medium=jobs_banner&utm_campaign=community'
      : 'https://www.linkedin.com/showcase/129954376?utm_source=site&utm_medium=outages_banner&utm_campaign=community';

  const copy =
    variant === 'jobs'
      ? 'Get one hand-picked nuclear job every weekday. Join our free Facebook group.'
      : 'Get weekly outage-season updates and job picks.';

  return (
    <section className="border-b border-rule bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="font-sans text-sm text-ink sm:text-base">{copy}</p>
          <div className="flex flex-wrap gap-2">
            <ExternalLinkButton
              href={facebookUrl}
              variant="primary"
              size="compact"
              target="_blank"
            >
              <Facebook className="h-4 w-4" />
              Join Facebook group
            </ExternalLinkButton>
            <ExternalLinkButton
              href={linkedinUrl}
              variant="secondary"
              size="compact"
              target="_blank"
            >
              <Linkedin className="h-4 w-4" />
              Follow on LinkedIn
            </ExternalLinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
