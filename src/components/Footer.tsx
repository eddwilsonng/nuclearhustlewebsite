import Link from 'next/link';

const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-[#CFC8BC] bg-[#EDE8DF] mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="font-mono text-stone-400 text-sm select-none">##</span>
              <span className="font-mono font-bold text-xs tracking-widest uppercase text-stone-900">
                nuclearhustle
              </span>
            </Link>
            <p className="font-mono text-xs text-stone-400 leading-relaxed max-w-[200px]">
              The specialist job board for nuclear energy professionals.
            </p>
          </div>

          {/* Jobs */}
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-4">Browse</p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/jobs" className="font-mono text-xs text-stone-600 hover:text-stone-900 transition-colors">
                  All jobs
                </Link>
              </li>
              <li>
                <Link href="/jobs/role/operations" className="font-mono text-xs text-stone-600 hover:text-stone-900 transition-colors">
                  Operations
                </Link>
              </li>
              <li>
                <Link href="/jobs/role/engineering" className="font-mono text-xs text-stone-600 hover:text-stone-900 transition-colors">
                  Engineering
                </Link>
              </li>
              <li>
                <Link href="/jobs/role/maintenance" className="font-mono text-xs text-stone-600 hover:text-stone-900 transition-colors">
                  Maintenance
                </Link>
              </li>
              <li>
                <Link href="/jobs/role/health-physics" className="font-mono text-xs text-stone-600 hover:text-stone-900 transition-colors">
                  Health Physics
                </Link>
              </li>
              <li>
                <Link href="/companies" className="font-mono text-xs text-stone-600 hover:text-stone-900 transition-colors">
                  Companies
                </Link>
              </li>
            </ul>
          </div>

          {/* Employers */}
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-4">Employers</p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/signup/employer" className="font-mono text-xs text-stone-600 hover:text-stone-900 transition-colors">
                  Post a job
                </Link>
              </li>
              <li>
                <Link href="/signup/employer" className="font-mono text-xs text-stone-600 hover:text-stone-900 transition-colors">
                  Create account
                </Link>
              </li>
              <li>
                <Link href="/login" className="font-mono text-xs text-stone-600 hover:text-stone-900 transition-colors">
                  Log in
                </Link>
              </li>
            </ul>
          </div>

          {/* Site */}
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-4">Site</p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/status" className="font-mono text-xs text-stone-600 hover:text-stone-900 transition-colors">
                  Fleet status
                </Link>
              </li>
              <li>
                <Link href="/about" className="font-mono text-xs text-stone-600 hover:text-stone-900 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="font-mono text-xs text-stone-600 hover:text-stone-900 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="font-mono text-xs text-stone-600 hover:text-stone-900 transition-colors">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="font-mono text-xs text-stone-600 hover:text-stone-900 transition-colors">
                  Terms of use
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#CFC8BC] pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400">
            © {YEAR} Nuclear Hustle. All rights reserved.
          </p>
          <p className="font-mono text-[10px] text-stone-300">
            Data sourced from NRC &amp; public operator listings.
          </p>
        </div>
      </div>
    </footer>
  );
}
