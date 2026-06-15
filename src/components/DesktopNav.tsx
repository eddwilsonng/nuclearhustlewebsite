'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BROWSE_LINKS = [
  { href: '/jobs', label: 'Jobs' },
  { href: '/companies', label: 'Companies' },
  { href: '/status', label: 'Fleet Status' },
  { href: '/about', label: 'About' },
];

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
