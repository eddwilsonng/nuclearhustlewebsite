'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Profile } from '@/lib/types';

interface DashboardSidebarProps {
  profile: Profile;
}

export function DashboardSidebar({ profile }: DashboardSidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

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

  const links = profile.role === 'employer' ? employerLinks : jobSeekerLinks;

  return (
    <aside className="w-56 bg-white border-r border-gray-100 min-h-[calc(100vh-57px)]">
      <div className="p-6">
        <p className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-6">
          {profile.role === 'employer' ? 'Employer' : 'Job Seeker'}
        </p>
        <nav className="space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block font-mono text-xs tracking-widest uppercase py-2 transition-colors border-l-2 pl-3 ${
                isActive(link.href)
                  ? 'border-yellow-400 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-900 hover:border-gray-200'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
