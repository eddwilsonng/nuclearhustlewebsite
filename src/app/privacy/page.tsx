import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Nuclear Hustle',
  description: 'Nuclear Hustle privacy policy. How we collect, use, and protect your personal data.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#EDE8DF]">

      {/* Hero */}
      <section className="py-20 md:py-28 border-b border-[#CFC8BC]">
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-4">Legal</p>
          <h1 className="font-mono text-4xl md:text-5xl font-bold text-stone-900 leading-tight">
            Privacy Policy
          </h1>
          <p className="mt-6 text-stone-500 text-sm font-mono">
            Last updated: June 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-gray max-w-none space-y-12">

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">1. Who we are</h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                Nuclear Hustle ("we", "us", "our") operates nuclearhustle.com, a job board for the US nuclear energy industry. We are committed to protecting your personal information and your right to privacy.
              </p>
              <p className="text-stone-500 text-sm leading-relaxed mt-3">
                If you have any questions about this policy, please contact us at{' '}
                <a href="mailto:hello@nuclearhustle.com" className="text-stone-900 underline hover:text-yellow-500 transition-colors">
                  hello@nuclearhustle.com
                </a>.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">2. Information we collect</h2>
              <p className="text-stone-500 text-sm leading-relaxed mb-3">We collect information you provide directly to us, including:</p>
              <ul className="space-y-2 text-sm text-stone-500">
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>Name and email address when you create an account</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>Email address when you subscribe to job alerts (no account required)</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>Profile information such as location, work history, and resume (job seekers)</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>Company name, website, and job listings (employers)</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>Communications you send to us</li>
              </ul>
              <p className="text-stone-500 text-sm leading-relaxed mt-4">We also collect usage data automatically through our privacy-focused analytics provider (Clicky), including pages visited, browser type, approximate location, IP address, and referring URLs.</p>
            </div>

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">3. How we use your information</h2>
              <ul className="space-y-2 text-sm text-stone-500">
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>To provide and maintain the platform</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>To match job seekers with relevant opportunities</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>To process employer job postings</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>To send transactional emails (account confirmations, application notifications)</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>To send job alert emails and our weekly digest of new roles</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>To improve and personalise the user experience</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>To comply with legal obligations</li>
              </ul>
              <p className="text-stone-500 text-sm leading-relaxed mt-4">
                Job alerts and the weekly digest are marketing communications. You can unsubscribe at any time using the one-click link included in every such email, or by contacting us — we honour one-click unsubscribe (RFC 8058). Transactional emails tied to your account or applications are not marketing and cannot be opted out of while your account is active.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">4. Sharing your information</h2>
              <p className="text-stone-500 text-sm leading-relaxed mb-3">
                We do not sell your personal data. We share information only with trusted third-party service providers, solely to operate the platform:
              </p>
              <ul className="space-y-2 text-sm text-stone-500">
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span><span><strong className="text-stone-700 font-normal">Supabase</strong> — database, authentication, and resume storage</span></li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span><span><strong className="text-stone-700 font-normal">Resend</strong> — sending transactional and marketing email, and recording delivery, bounce, and complaint events</span></li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span><span><strong className="text-stone-700 font-normal">Clicky</strong> — privacy-focused website analytics</span></li>
              </ul>
              <p className="text-stone-500 text-sm leading-relaxed mt-4">
                These providers are contractually obligated to protect your data and may only process it on our instructions.
              </p>
              <p className="text-stone-500 text-sm leading-relaxed mt-3">
                Job seeker profile information (name, resume, location) may be visible to verified employer accounts if you choose to make your profile discoverable.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">5. Data retention</h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                We retain your personal data for as long as your account is active. You can request deletion of your account and associated data at any time by contacting us at{' '}
                <a href="mailto:hello@nuclearhustle.com" className="text-stone-900 underline hover:text-yellow-500 transition-colors">
                  hello@nuclearhustle.com
                </a>.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">6. Cookies & analytics</h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                We use essential cookies to manage authentication sessions. We also use Clicky, a privacy-focused analytics service, to understand how the platform is used; it may set cookies or use similar technologies to count unique visitors and measure page views. We do not use third-party advertising cookies and we do not sell analytics data.
              </p>
              <p className="text-stone-500 text-sm leading-relaxed mt-3">
                You can disable cookies in your browser settings, though this may affect your ability to log in. To opt out of analytics specifically, you can enable your browser&apos;s &ldquo;Do Not Track&rdquo; setting or use an ad/tracker blocker.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">7. Your rights</h2>
              <p className="text-stone-500 text-sm leading-relaxed mb-3">You have the right to:</p>
              <ul className="space-y-2 text-sm text-stone-500">
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>Access the personal data we hold about you</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>Request correction of inaccurate data</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>Request deletion of your data</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>Withdraw consent at any time</li>
              </ul>
              <p className="text-stone-500 text-sm leading-relaxed mt-4">
                To exercise these rights, contact us at{' '}
                <a href="mailto:hello@nuclearhustle.com" className="text-stone-900 underline hover:text-yellow-500 transition-colors">
                  hello@nuclearhustle.com
                </a>.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">8. Changes to this policy</h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                We may update this policy from time to time. We will notify registered users of material changes by email. Continued use of the platform after changes constitutes acceptance of the updated policy.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
