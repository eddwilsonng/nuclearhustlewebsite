'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef } from 'react';

const BROWSE_LINKS = [
  { href: '/jobs', label: 'Jobs' },
  { href: '/companies', label: 'Companies' },
  { href: '/status', label: 'Fleet Status' },
  { href: '/about', label: 'About' },
];

const RESOURCES_LINKS = [
  { href: '/nuclear-salary', label: 'Nuclear Salary Guide', desc: 'Pay ranges by role & state' },
  { href: '/nuclear-skills', label: 'Nuclear Skills Report', desc: 'Most in-demand skills & certs' },
];

function ResourcesDropdown({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };
  const hide = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        className={`group relative font-mono text-xs tracking-widest uppercase transition-colors flex items-center gap-1 ${
          active ? 'text-stone-900' : 'text-stone-600 hover:text-stone-900'
        }`}
      >
        Resources
        <span className={`text-[8px] transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        <span
          className={`absolute -bottom-[6px] left-0 h-px bg-yellow-400 transition-all duration-200 ${
            active ? 'w-full' : 'w-0 group-hover:w-full'
          }`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-3 w-52 bg-[#EDE8DF] border border-[#CFC8BC] z-50">
          {RESOURCES_LINKS.map(({ href, label, desc }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 border-b border-[#CFC8BC] last:border-b-0 hover:bg-[#E5DFD5] transition-colors group"
            >
              <span className="block font-mono text-xs font-semibold text-stone-900 group-hover:text-yellow-600 transition-colors">
                {label}
              </span>
              <span className="block font-mono text-[10px] text-stone-400 mt-0.5">{desc}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function DesktopNav({
  isAuthed,
  children,
}: {
  isAuthed: boolean;
  children?: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const resourcesActive = RESOURCES_LINKS.some(({ href }) => isActive(href));

  return (
    <nav className="hidden md:flex items-center gap-8">
      {BROWSE_LINKS.map(({ href, label }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`group relative font-mono text-xs tracking-widest uppercase transition-colors ${
              active ? 'text-stone-900' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {label}
            <span
              className={`absolute -bottom-[6px] left-0 h-px bg-yellow-400 transition-all duration-200 ${
                active ? 'w-full' : 'w-0 group-hover:w-full'
              }`}
            />
          </Link>
        );
      })}
      <ResourcesDropdown active={resourcesActive} />

      <span className="h-4 w-px bg-[#CFC8BC]" aria-hidden="true" />

      {isAuthed ? (
        children
      ) : (
        <>
          <Link
            href="/signup/employer"
            className="font-mono text-xs tracking-widest uppercase text-stone-600 hover:text-stone-900 transition-colors"
          >
            Post a Job
          </Link>
          <Link
            href="/login"
            className="font-mono text-xs tracking-widest uppercase text-stone-600 hover:text-stone-900 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="font-mono text-xs tracking-widest uppercase px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors"
          >
            Sign Up
          </Link>
        </>
      )}
    </nav>
  );
}
