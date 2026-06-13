import Link from 'next/link';
import { MobileNav } from './MobileNav';

export function Header() {
  return (
    <header className="bg-[#EDE8DF] border-b border-[#CFC8BC] relative">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-mono text-stone-500 text-sm select-none" aria-hidden="true">##</span>
          <span className="font-mono font-bold text-xs tracking-widest uppercase text-stone-900">
            nuclearhustle
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/jobs" className="font-mono text-xs tracking-widest uppercase text-stone-600 hover:text-stone-900 transition-colors">
            Jobs
          </Link>
          <Link href="/companies" className="font-mono text-xs tracking-widest uppercase text-stone-600 hover:text-stone-900 transition-colors">
            Companies
          </Link>
          <Link href="/status" className="font-mono text-xs tracking-widest uppercase text-stone-600 hover:text-stone-900 transition-colors">
            Fleet Status
          </Link>
          <Link href="/about" className="font-mono text-xs tracking-widest uppercase text-stone-600 hover:text-stone-900 transition-colors">
            About
          </Link>
          <Link href="/login" className="font-mono text-xs tracking-widest uppercase text-stone-600 hover:text-stone-900 transition-colors">
            Log In
          </Link>
          <Link href="/signup" className="font-mono text-xs tracking-widest uppercase px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors">
            Sign Up
          </Link>
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
