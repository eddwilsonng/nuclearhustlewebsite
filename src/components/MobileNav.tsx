'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/lib/auth/actions';

const PRIMARY_LINKS = [
  { href: '/jobs',      label: 'Jobs',        num: '01' },
  { href: '/companies', label: 'Companies',   num: '02' },
  { href: '/status',    label: 'Fleet Status', num: '03' },
  { href: '/about',     label: 'About',       num: '04' },
];

const RESOURCES_LINKS = [
  { href: '/salary', label: 'Nuclear Salary Guide' },
];

const LOGGED_OUT_LINKS = [
  { href: '/login',  label: 'Log In' },
  { href: '/signup', label: 'Sign Up' },
];

const LOGGED_IN_LINKS = [
  { href: '/dashboard',         label: 'Dashboard' },
  { href: '/dashboard/profile', label: 'Profile' },
];

export function MobileNav({ isAuthed = false }: { isAuthed?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const close = () => setOpen(false);
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Hamburger */}
      <button
        className="md:hidden flex flex-col justify-center items-center w-10 h-10 -mr-2 gap-[5px]"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <span className="block w-5 h-px bg-stone-900" />
        <span className="block w-5 h-px bg-stone-900" />
        <span className="block w-5 h-px bg-stone-900" />
      </button>

      {/* Full-screen overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-[#EDE8DF] z-50 flex flex-col transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Header — matches the main site header exactly */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#CFC8BC]">
          <Link href="/" onClick={close} className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs tracking-widest uppercase text-stone-900">nuclearhustle</span>
          </Link>
          <button
            onClick={close}
            aria-label="Close menu"
            className="font-mono text-xs tracking-widest uppercase text-stone-500 hover:text-stone-900 transition-colors px-2 py-1"
          >
            Close
          </button>
        </div>

        {/* Primary links */}
        <nav className="flex-1 flex flex-col px-6 pt-2 overflow-y-auto">
          {PRIMARY_LINKS.map(({ href, label, num }, i) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                aria-current={active ? 'page' : undefined}
                style={{ transitionDelay: open ? `${120 + i * 50}ms` : '0ms' }}
                className={`group flex items-baseline justify-between py-6 border-b border-[#CFC8BC] transform transition-all duration-300 ${
                  open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                }`}
              >
                <div className="flex items-baseline gap-4">
                  <span className={`font-mono text-[10px] tracking-widest ${active ? 'text-yellow-500' : 'text-stone-400'}`}>{num}</span>
                  <span className={`font-mono text-base font-bold tracking-widest uppercase transition-colors ${
                    active ? 'text-yellow-500' : 'text-stone-900 group-hover:text-yellow-500'
                  }`}>
                    {label}
                  </span>
                </div>
                <span className={`font-mono text-xs transition-colors ${
                  active ? 'text-yellow-500' : 'text-stone-400 group-hover:text-yellow-500'
                }`}>→</span>
              </Link>
            );
          })}

          {/* Resources */}
          <div className="mt-2 flex flex-col">
            <p className="font-mono text-[9px] tracking-widest uppercase text-stone-400 pt-6 pb-2">Resources</p>
            {RESOURCES_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={close}
                className="group flex items-center justify-between py-4 border-b border-[#CFC8BC]/60"
              >
                <span className="font-mono text-xs tracking-widest uppercase text-stone-500 group-hover:text-stone-900 transition-colors">
                  {label}
                </span>
                <span className="font-mono text-xs text-stone-400 group-hover:text-stone-900 transition-colors">→</span>
              </Link>
            ))}
          </div>

          {/* Secondary links */}
          <div className="mt-6 flex flex-col">
            {(isAuthed ? LOGGED_IN_LINKS : LOGGED_OUT_LINKS).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={close}
                className="group flex items-center justify-between py-4 border-b border-[#CFC8BC]/60"
              >
                <span className="font-mono text-xs tracking-widest uppercase text-stone-500 group-hover:text-stone-900 transition-colors">
                  {label}
                </span>
                <span className="font-mono text-xs text-stone-400 group-hover:text-stone-900 transition-colors">→</span>
              </Link>
            ))}
            {isAuthed && (
              <form action={signOut} onSubmit={close}>
                <button
                  type="submit"
                  className="group w-full flex items-center justify-between py-4 border-b border-[#CFC8BC]/60"
                >
                  <span className="font-mono text-xs tracking-widest uppercase text-red-600 transition-colors">
                    Sign Out
                  </span>
                  <span className="font-mono text-xs text-red-400 transition-colors">→</span>
                </button>
              </form>
            )}
          </div>
        </nav>

        {/* CTAs */}
        <div className="px-6 pb-8 pt-4 flex flex-col gap-3 border-t border-[#CFC8BC]">
          <Link
            href="/jobs"
            onClick={close}
            className="font-mono text-xs tracking-widest uppercase font-bold px-5 py-4 bg-yellow-400 hover:bg-yellow-300 text-stone-900 transition-colors text-center"
          >
            Browse All Jobs →
          </Link>
          <Link
            href="/signup/employer"
            onClick={close}
            className="font-mono text-xs tracking-widest uppercase px-5 py-4 border border-[#CFC8BC] hover:border-stone-400 text-stone-600 hover:text-stone-900 transition-colors text-center"
          >
            Post a Job
          </Link>
        </div>
      </div>
    </>
  );
}
