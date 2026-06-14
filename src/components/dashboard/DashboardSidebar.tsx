'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/lib/auth/actions';
import type { Profile } from '@/lib/types';

interface DashboardSidebarProps {
  profile: Profile;
  isAdmin?: boolean;
}

export function DashboardSidebar({ profile, isAdmin }: DashboardSidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const jobSeekerLinks = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/profile', label: 'My Profile' },
  ];

  const employerLinks = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/profile', label: 'Company Profile' },
    { href: '/dashboard/jobs', label: 'Job Postings' },
    { href: '/dashboard/jobs/new', label: 'Post a Job' },
  ];

  const adminLinks = [
    { href: '/dashboard/admin', label: 'Operations', exact: true },
    { href: '/dashboard/admin/review', label: 'Content Review' },
    { href: '/dashboard/admin/scrape', label: 'Scraper' },
    { href: '/dashboard/admin/jobs', label: 'Manage Jobs' },
  ];

  const links = profile.role === 'employer' ? employerLinks : jobSeekerLinks;

  return (
    <aside className="w-56 bg-[#EDE8DF] border-r border-[#CFC8BC] min-h-[calc(100vh-57px)]">
      <div className="p-6">
        <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-6">
          {profile.role === 'employer' ? 'Employer' : 'Job Seeker'}
        </p>
        <nav className="space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block font-mono text-xs tracking-widest uppercase py-2 transition-colors border-l-2 pl-3 ${
                isActive(link.href)
                  ? 'border-yellow-400 text-stone-900'
                  : 'border-transparent text-stone-400 hover:text-stone-900 hover:border-[#CFC8BC]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {isAdmin && (
          <>
            <div className="my-6 border-t border-[#CFC8BC]" />
            <p className="font-mono text-xs tracking-widest uppercase text-yellow-500 mb-4">
              Operations
            </p>
            <nav className="space-y-1">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block font-mono text-xs tracking-widest uppercase py-2 transition-colors border-l-2 pl-3 ${
                    (link.exact ? pathname === link.href : isActive(link.href))
                      ? 'border-yellow-400 text-stone-900'
                      : 'border-transparent text-stone-400 hover:text-stone-900 hover:border-[#CFC8BC]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </>
        )}

        <div className="my-6 border-t border-[#CFC8BC]" />
        <form action={signOut}>
          <button
            type="submit"
            className="block w-full text-left font-mono text-xs tracking-widest uppercase py-2 border-l-2 border-transparent pl-3 text-red-500 hover:text-red-700 hover:border-red-300 transition-colors"
          >
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
