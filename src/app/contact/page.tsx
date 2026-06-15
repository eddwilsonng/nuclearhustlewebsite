import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact — Nuclear Hustle',
  description: 'Get in touch with the Nuclear Hustle team. Questions about job listings, employer accounts, or partnerships — we\'re happy to help.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#EDE8DF]">

      {/* Hero */}
      <section className="py-20 md:py-28 border-b border-[#CFC8BC]">
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-4">Contact</p>
          <h1 className="font-mono text-4xl md:text-5xl font-bold text-stone-900 leading-tight max-w-2xl">
            Get in touch.
          </h1>
          <p className="mt-6 text-stone-500 text-lg max-w-xl leading-relaxed">
            Questions about listings, employer accounts, or partnerships — reach out and we'll get back to you promptly.
          </p>
        </div>
      </section>

      {/* Contact options */}
      <section className="py-20 border-b border-[#CFC8BC]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-4">01</p>
              <h2 className="font-mono text-lg font-bold text-stone-900 mb-3">General enquiries</h2>
              <p className="text-sm text-stone-500 leading-relaxed mb-4">
                Questions about how the platform works, or anything else.
              </p>
              <a
                href="mailto:hello@nuclearhustle.com"
                className="font-mono text-xs tracking-widest uppercase text-stone-900 hover:text-yellow-500 transition-colors"
              >
                hello@nuclearhustle.com
              </a>
            </div>

            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-4">02</p>
              <h2 className="font-mono text-lg font-bold text-stone-900 mb-3">Employers</h2>
              <p className="text-sm text-stone-500 leading-relaxed mb-4">
                Interested in posting jobs or featuring your listings? We'd love to hear from you.
              </p>
              <a
                href="mailto:employers@nuclearhustle.com"
                className="font-mono text-xs tracking-widest uppercase text-stone-900 hover:text-yellow-500 transition-colors"
              >
                employers@nuclearhustle.com
              </a>
            </div>

            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-4">03</p>
              <h2 className="font-mono text-lg font-bold text-stone-900 mb-3">Partnerships</h2>
              <p className="text-sm text-stone-500 leading-relaxed mb-4">
                Industry organisations, training providers, or media — let's work together.
              </p>
              <a
                href="mailto:partnerships@nuclearhustle.com"
                className="font-mono text-xs tracking-widest uppercase text-stone-900 hover:text-yellow-500 transition-colors"
              >
                partnerships@nuclearhustle.com
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* Response time */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="border border-[#CFC8BC] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-2">Response time</p>
              <p className="text-stone-500 text-sm leading-relaxed max-w-md">
                We aim to respond to all enquiries within one business day. For urgent employer issues, use the employers address above.
              </p>
            </div>
            <Link
              href="/jobs"
              className="font-mono text-xs tracking-widest uppercase px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors whitespace-nowrap self-start md:self-auto"
            >
              Browse Jobs →
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
