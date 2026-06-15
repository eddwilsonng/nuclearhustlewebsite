import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About — Nuclear Hustle',
  description: 'Nuclear Hustle is the job board built specifically for the US nuclear energy industry. Learn about our mission and how we connect nuclear professionals with top employers.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#EDE8DF]">

      {/* Hero */}
      <section className="py-20 md:py-28 border-b border-[#CFC8BC]">
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-4">About</p>
          <h1 className="font-mono text-4xl md:text-5xl font-bold text-stone-900 leading-tight max-w-2xl">
            Built for the people who keep the lights on.
          </h1>
          <p className="mt-6 text-stone-500 text-lg max-w-xl leading-relaxed">
            Nuclear Hustle is a job board built specifically for the US nuclear energy industry —
            connecting skilled professionals with the operators, contractors, and utilities driving
            the next generation of clean energy.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 border-b border-[#CFC8BC]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-4">01</p>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">Why nuclear?</h2>
              <p className="text-sm text-stone-500 leading-relaxed">
                Nuclear power produces more carbon-free electricity than any other source in the US.
                With new reactors being built and existing plants extending their operating licenses,
                the industry needs thousands of qualified workers over the coming decade.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-4">02</p>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">The problem</h2>
              <p className="text-sm text-stone-500 leading-relaxed">
                Nuclear is a niche field with specific licensing, clearance, and experience requirements.
                General job boards don&apos;t understand the industry. Candidates waste time. Employers
                struggle to find qualified people. We fix that.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-4">03</p>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">Our mission</h2>
              <p className="text-sm text-stone-500 leading-relaxed">
                Make it simple for nuclear professionals to find their next role, and for employers
                to reach the right candidates — without the noise of generic job platforms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-b border-[#CFC8BC]">
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-2">How it works</p>
          <h2 className="font-mono text-2xl font-bold text-stone-900 mb-12">For everyone in nuclear.</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Job seekers */}
            <div className="border border-[#CFC8BC] p-8">
              <p className="font-mono text-xs tracking-widest uppercase text-yellow-500 mb-4">Job seekers</p>
              <h3 className="font-mono text-lg font-bold text-stone-900 mb-4">Find your next role</h3>
              <ul className="space-y-3 text-sm text-stone-500">
                <li className="flex gap-3">
                  <span className="font-mono text-gray-200 flex-shrink-0">—</span>
                  Browse hundreds of live roles from top nuclear operators
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-gray-200 flex-shrink-0">—</span>
                  Filter by state, role type, and category
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-gray-200 flex-shrink-0">—</span>
                  Apply directly through the site or link out to employer portals
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-gray-200 flex-shrink-0">—</span>
                  Build a profile and upload your resume for employers to find you
                </li>
              </ul>
              <Link
                href="/signup/job-seeker"
                className="inline-block mt-8 font-mono text-xs tracking-widest uppercase px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors"
              >
                Create a profile →
              </Link>
            </div>

            {/* Employers */}
            <div className="border border-[#CFC8BC] p-8">
              <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-4">Employers</p>
              <h3 className="font-mono text-lg font-bold text-stone-900 mb-4">Hire nuclear talent</h3>
              <ul className="space-y-3 text-sm text-stone-500">
                <li className="flex gap-3">
                  <span className="font-mono text-gray-200 flex-shrink-0">—</span>
                  Post directly to an audience of nuclear professionals
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-gray-200 flex-shrink-0">—</span>
                  Receive applications by email with CV attachments, or link to your own portal
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-gray-200 flex-shrink-0">—</span>
                  Manage all your active listings from a simple dashboard
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-gray-200 flex-shrink-0">—</span>
                  Your jobs appear alongside listings from major operators
                </li>
              </ul>
              <Link
                href="/signup/employer"
                className="inline-block mt-8 font-mono text-xs tracking-widest uppercase px-5 py-2.5 border border-[#CFC8BC] hover:border-stone-400 text-stone-600 hover:text-stone-900 transition-colors"
              >
                Post a job →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-4">
            Ready to get started?
          </p>
          <h2 className="font-mono text-3xl md:text-4xl font-bold text-stone-900 mb-8 max-w-xl">
            The nuclear workforce is growing. Be part of it.
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/jobs"
              className="font-mono text-xs tracking-widest uppercase px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors"
            >
              Browse Jobs
            </Link>
            <Link
              href="/signup/employer"
              className="font-mono text-xs tracking-widest uppercase px-6 py-3 border border-[#CFC8BC] hover:border-stone-400 text-stone-600 hover:text-stone-900 transition-colors"
            >
              Post a Job
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
