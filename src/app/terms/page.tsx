import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Nuclear Hustle',
  description: 'Nuclear Hustle terms of service. Rules and conditions governing use of the platform by job seekers and employers.',
  alternates: { canonical: 'https://nuclearhustle.com/terms' },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#EDE8DF]">

      {/* Hero */}
      <section className="py-20 md:py-28 border-b border-[#CFC8BC]">
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-4">Legal</p>
          <h1 className="font-mono text-4xl md:text-5xl font-bold text-stone-900 leading-tight">
            Terms of Service
          </h1>
          <p className="mt-6 text-stone-500 text-sm font-mono">
            Last updated: January 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="space-y-12">

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">1. Acceptance of terms</h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                By accessing or using nuclearhustle.com ("the platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform. These terms apply to all visitors, job seekers, and employers.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">2. Use of the platform</h2>
              <p className="text-stone-500 text-sm leading-relaxed mb-3">You agree to use the platform only for lawful purposes. You must not:</p>
              <ul className="space-y-2 text-sm text-stone-500">
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>Post false, misleading, or fraudulent job listings or profile information</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>Scrape or copy content from the platform without permission</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>Attempt to gain unauthorised access to other accounts or systems</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>Use the platform to send unsolicited communications</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>Violate any applicable laws or regulations</li>
              </ul>
            </div>

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">3. Accounts</h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                You are responsible for maintaining the security of your account credentials. You must notify us immediately at{' '}
                <a href="mailto:hello@nuclearhustle.com" className="text-stone-900 underline hover:text-yellow-500 transition-colors">
                  hello@nuclearhustle.com
                </a>{' '}
                if you suspect unauthorised access to your account. We reserve the right to suspend or terminate accounts that violate these terms.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">4. Employer responsibilities</h2>
              <p className="text-stone-500 text-sm leading-relaxed mb-3">Employers who post jobs on the platform agree to:</p>
              <ul className="space-y-2 text-sm text-stone-500">
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>Ensure all job listings are genuine, accurate, and legally compliant</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>Only contact candidates for roles they have applied to or expressed interest in</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>Comply with all applicable employment and equal opportunity laws</li>
                <li className="flex gap-3"><span className="font-mono text-gray-200 flex-shrink-0">—</span>Remove listings promptly once a role is filled</li>
              </ul>
            </div>

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">5. Job seeker responsibilities</h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                Job seekers agree to provide accurate information in their profiles and applications. You understand that Nuclear Hustle does not guarantee employment and acts only as a platform connecting candidates with employers. We are not party to any employment agreement between you and an employer.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">6. Intellectual property</h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                All content on the platform — including design, code, copy, and data — is owned by Nuclear Hustle or its licensors. You may not reproduce, distribute, or create derivative works without our express written permission. Job listings posted by employers remain the intellectual property of the respective employers.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">7. Disclaimer of warranties</h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                The platform is provided "as is" without warranties of any kind. We do not guarantee the accuracy of job listings, the suitability of candidates, or uninterrupted access to the platform. Use is at your own risk.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">8. Limitation of liability</h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                To the fullest extent permitted by law, Nuclear Hustle shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform, including loss of data, lost profits, or damages resulting from interactions between job seekers and employers.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">9. Governing law</h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                These terms are governed by the laws of the United States. Any disputes arising from use of the platform shall be resolved in the applicable federal or state courts.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">10. Changes to these terms</h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                We may update these terms at any time. Continued use of the platform after changes are posted constitutes acceptance. We will notify registered users of material changes by email.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-4">11. Contact</h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                Questions about these terms? Contact us at{' '}
                <a href="mailto:hello@nuclearhustle.com" className="text-stone-900 underline hover:text-yellow-500 transition-colors">
                  hello@nuclearhustle.com
                </a>.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
