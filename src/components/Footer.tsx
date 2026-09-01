import Link from 'next/link';
import { getActiveStates } from '@/lib/data/static';

const YEAR = new Date().getFullYear();

// Descriptive anchors that match real search intent (e.g. "nuclear engineering
// jobs") — better for SEO than bare category names, without keyword stuffing.
const ROLE_LINKS: { href: string; label: string }[] = [
  { href: '/jobs', label: 'All nuclear jobs' },
  { href: '/jobs/role/engineering', label: 'Nuclear engineering jobs' },
  { href: '/jobs/role/operations', label: 'Nuclear operations jobs' },
  { href: '/jobs/role/maintenance', label: 'Maintenance technician jobs' },
  { href: '/jobs/role/health-physics', label: 'Health physics jobs' },
  { href: '/jobs/role/administrative', label: 'Administrative & support jobs' },
  { href: '/companies', label: 'Browse employers' },
];

const linkClass =
  'font-sans text-sm text-secondary hover:text-ink';

export function Footer() {
  const topStates = getActiveStates().slice(0, 6);

  return (
    <footer className="mt-auto border-t border-rule bg-canvas">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="mb-4 inline-flex items-center">
              <span className="font-sans text-sm font-semibold tracking-tight text-ink">
                Nuclear Hustle
              </span>
            </Link>
            <p className="font-sans text-sm text-secondary leading-relaxed max-w-[200px]">
              The specialist job board for nuclear energy professionals.
            </p>
            <a
              href="https://www.linkedin.com/showcase/nuclearhustle"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 group"
              aria-label="Nuclear Hustle on LinkedIn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-secondary group-hover:text-ink transition-colors" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span className="font-sans text-sm text-secondary group-hover:text-ink">LinkedIn</span>
            </a>
          </div>

          {/* Jobs by role */}
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-secondary mb-4">Jobs by role</p>
            <ul className="space-y-3">
              {ROLE_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Jobs by location */}
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-secondary mb-4">Jobs by location</p>
            <ul className="space-y-3">
              {topStates.map(({ state }) => (
                <li key={state.slug}>
                  <Link href={`/jobs/${state.slug}`} className={linkClass}>
                    Nuclear jobs in {state.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/status" className={linkClass}>
                  US reactor fleet map
                </Link>
              </li>
            </ul>
          </div>

          {/* Employers */}
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-secondary mb-4">Employers</p>
            <ul className="space-y-3">
              <li>
                <Link href="/signup/employer" className={linkClass}>
                  Post a nuclear job
                </Link>
              </li>
              <li>
                <Link href="/signup/employer" className={linkClass}>
                  Create employer account
                </Link>
              </li>
              <li>
                <Link href="/login" className={linkClass}>
                  Log in
                </Link>
              </li>
            </ul>
          </div>

          {/* Plants */}
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-secondary mb-4">Plants</p>
            <ul className="space-y-3">
              <li>
                <Link href="/plants" className={linkClass}>All plants directory</Link>
              </li>
              <li>
                <Link href="/plants/palo-verde" className={linkClass}>Palo Verde</Link>
              </li>
              <li>
                <Link href="/plants/vogtle" className={linkClass}>Vogtle</Link>
              </li>
              <li>
                <Link href="/plants/diablo-canyon" className={linkClass}>Diablo Canyon</Link>
              </li>
              <li>
                <Link href="/plants/three-mile-island" className={linkClass}>Crane Clean Energy Center</Link>
              </li>
              <li>
                <Link href="/plants/turkey-point" className={linkClass}>Turkey Point</Link>
              </li>
              <li>
                <Link href="/plants/north-anna" className={linkClass}>North Anna</Link>
              </li>
            </ul>
          </div>

          {/* Site */}
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-secondary mb-4">Site</p>
            <ul className="space-y-3">
              <li>
                <Link href="/this-week" className={linkClass}>
                  This week&rsquo;s picks
                </Link>
              </li>
              <li>
                <Link href="/nuclear-salary" className={linkClass}>
                  Salary guide
                </Link>
              </li>
              <li>
                <Link href="/nuclear-skills" className={linkClass}>
                  Skills report
                </Link>
              </li>
              <li>
                <Link href="/status" className={linkClass}>
                  Fleet status
                </Link>
              </li>
              <li>
                <Link href="/about" className={linkClass}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={linkClass}>
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className={linkClass}>
                  Terms of use
                </Link>
              </li>
              <li>
                <Link href="/sitemap" className={linkClass}>
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-start justify-between gap-3 border-t border-rule pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-xs uppercase tracking-widest text-secondary">
            © {YEAR} Nuclear Hustle. All rights reserved.
          </p>
          <p className="font-sans text-sm text-secondary">
            Reactor data from the U.S. NRC. Job listings aggregated from public employer career sites.
          </p>
        </div>
      </div>
    </footer>
  );
}
