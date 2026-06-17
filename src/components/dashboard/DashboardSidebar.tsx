'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut, setAdminViewRole } from '@/lib/auth/actions';
import type { Profile } from '@/lib/types';
import type { AdminViewRole } from '@/lib/admin';

interface DashboardSidebarProps {
  profile: Profile;
  isAdmin?: boolean;
  viewRole?: AdminViewRole;
}

type NavLink = { href: string; label: string; exact?: boolean };

function NavLinks({
  links,
  pathname,
  onNavigate,
}: {
  links: NavLink[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = (path: string, exact?: boolean) =>
    exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          className={`block font-mono text-xs tracking-widest uppercase py-2 transition-colors border-l-2 pl-3 ${
            isActive(link.href, link.exact)
              ? 'border-yellow-400 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-900 hover:border-[#CFC8BC]'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}

export function DashboardSidebar({ profile, isAdmin, viewRole }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const jobSeekerLinks: NavLink[] = [
    { href: '/dashboard', label: 'Overview', exact: true },
    { href: '/dashboard/profile', label: 'My Profile' },
    { href: '/dashboard/saved', label: 'Saved Jobs' },
  ];

  const employerLinks: NavLink[] = [
    { href: '/dashboard', label: 'Overview', exact: true },
    { href: '/dashboard/profile', label: 'Company Profile' },
    { href: '/dashboard/jobs', label: 'Job Postings' },
    { href: '/dashboard/jobs/new', label: 'Post a Job' },
  ];

  const adminLinks: NavLink[] = [
    { href: '/dashboard/admin', label: 'Operations', exact: true },
    { href: '/dashboard/admin/review', label: 'Content Review' },
    { href: '/dashboard/admin/scrape', label: 'Scraper' },
    { href: '/dashboard/admin/jobs', label: 'Manage Jobs' },
    { href: '/dashboard/admin/email', label: 'Email Health' },
  ];

  const effectiveRole = isAdmin ? (viewRole ?? profile.role) : profile.role;
  const links = effectiveRole === 'employer' ? employerLinks : jobSeekerLinks;
  const close = () => setOpen(false);

  const sidebarContent = (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 md:block">
        <p className="font-mono text-xs tracking-widest uppercase text-stone-300">
          {effectiveRole === 'employer' ? 'Employer' : 'Job Seeker'}
        </p>
        <button
          type="button"
          onClick={close}
          className="md:hidden font-mono text-xs tracking-widest uppercase text-stone-500 hover:text-stone-900 transition-colors"
          aria-label="Close account menu"
        >
          Close
        </button>
      </div>

      {isAdmin && (
        <div className="mb-6 border border-[#CFC8BC] p-1 flex gap-1">
          <button
            type="button"
            onClick={() => setAdminViewRole('employer', pathname)}
            className={`flex-1 font-mono text-[10px] tracking-widest uppercase py-1.5 transition-colors ${
              effectiveRole === 'employer' ? 'bg-yellow-400 text-stone-900' : 'text-stone-400 hover:text-stone-900'
            }`}
          >
            Employer
          </button>
          <button
            type="button"
            onClick={() => setAdminViewRole('job_seeker', pathname)}
            className={`flex-1 font-mono text-[10px] tracking-widest uppercase py-1.5 transition-colors ${
              effectiveRole === 'job_seeker' ? 'bg-yellow-400 text-stone-900' : 'text-stone-400 hover:text-stone-900'
            }`}
          >
            Job Seeker
          </button>
        </div>
      )}

      <nav className="space-y-1">
        <NavLinks links={links} pathname={pathname} onNavigate={close} />
      </nav>

      {isAdmin && (
        <>
          <div className="my-6 border-t border-[#CFC8BC]" />
          <p className="font-mono text-xs tracking-widest uppercase text-yellow-500 mb-4">
            Operations
          </p>
          <nav className="space-y-1">
            <NavLinks links={adminLinks} pathname={pathname} onNavigate={close} />
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
  );

  return (
    <>
      <div className="md:hidden border-b border-[#CFC8BC] bg-[#EDE8DF] px-4 py-3 flex items-center justify-between">
        <span className="font-mono text-xs tracking-widest uppercase text-stone-900">
          Account
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-mono text-xs tracking-widest uppercase text-stone-600 hover:text-stone-900 transition-colors px-2 py-1"
          aria-expanded={open}
          aria-label="Open account menu"
        >
          Menu
        </button>
      </div>

      {open && (
        <button
          type="button"
          className="md:hidden fixed inset-0 top-14 bg-stone-900/20 z-40"
          onClick={close}
          aria-label="Close account menu overlay"
        />
      )}

      <aside
        className={`w-full md:w-56 md:shrink-0 bg-[#EDE8DF] border-r border-[#CFC8BC] md:min-h-[calc(100vh-57px)] fixed md:static top-14 left-0 z-50 h-[calc(100vh-3.5rem)] md:h-auto overflow-y-auto transition-transform duration-200 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
