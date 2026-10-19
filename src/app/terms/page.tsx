import { Metadata } from "next";
import {
  LegalDocument,
  LegalEmailLink,
  LegalList,
  LegalSection,
  OperatorBlock,
} from "@/components/legal/LegalDocument";
import { LEGAL_GOVERNING_LAW, LEGAL_VENUE } from "@/lib/legal";
import {
  FEATURED_DURATION_DAYS,
  featuredPlacementSentence,
  featuredPriceLabel,
} from "@/lib/jobs/featuredOffer";

export const metadata: Metadata = {
  title: "Terms of Service — Nuclear Hustle",
  description:
    "Terms for using Nuclear Hustle as a visitor, job seeker, or employer, including featured listings and aggregated jobs.",
  alternates: { canonical: "/terms" },
};

const featuredPrice = featuredPriceLabel();

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Service" updated="October 2026">
      <LegalSection title="1. Who you are contracting with">
        <OperatorBlock />
        <p>
          These terms are a contract between you and that operator. They apply
          to visitors, job seekers, and employers. If you do not agree, do not
          use the site. Creating an account, applying through our form, or
          paying for a featured listing requires you to confirm that you agree.
        </p>
      </LegalSection>

      <LegalSection title="2. What this site is">
        <p>
          Nuclear Hustle is a job board. It is not an employment agency, a
          recruiter, or an employer. We do not charge job seekers. We do not
          guarantee a job, an interview, or a hire, and we are not a party to
          any employment agreement.
        </p>
        <p>
          A featured listing is advertising space on the board. The fee is not
          a placement fee and does not buy a candidate.
        </p>
      </LegalSection>

      <LegalSection title="3. Using the site">
        <p>Use the site for lawful purposes. You must not:</p>
        <LegalList
          items={[
            "Post a false, misleading, or fraudulent listing or profile.",
            "Scrape or copy the board without permission.",
            "Attempt to access another account or our systems without authorisation.",
            "Send unsolicited mail through the platform.",
            "Break employment, privacy, or advertising law that applies to you.",
          ]}
        />
        <p>
          Listings can be wrong, stale, or posted by someone who is not the
          employer. Check the employer before you send a CV or pay a fee.
        </p>
      </LegalSection>

      <LegalSection title="4. Accounts">
        <p>
          You are responsible for your login. Email <LegalEmailLink /> if you
          think someone else is using the account. We can suspend or close an
          account that breaks these terms.
        </p>
        <p>
          You can delete your account from the profile page. That removes the
          profile and, for an employer, the listings on the board. It does not
          pull back an application an employer has already received.
        </p>
      </LegalSection>

      <LegalSection title="5. Employers">
        <p>If you post a job, you agree that:</p>
        <LegalList
          items={[
            "The listing is genuine, accurate, and complies with employment law that applies to it, including equal opportunity rules and any pay-range disclosure the job's location requires.",
            "You will not contact a candidate except about a role they applied to or asked to hear about.",
            "You will take the listing down when the role is filled or cancelled.",
            "You have the right to give us the text, logo, and other material you upload.",
          ]}
        />
        <p>
          You keep ownership of that material. You grant us a non-exclusive
          licence to host, store, reproduce, display, format, and promote it,
          including by editing a listing for length and clarity, for as long as
          it is on the board and in emails we have already sent. Deleting the
          listing ends the licence for new use. Backups and mail already sent
          follow the retention periods in the privacy policy.
        </p>
        <p>
          You will indemnify us against claims arising from your listing, your
          hiring decisions, or your use of candidate information, including a
          claim that the listing was fraudulent, discriminatory, or missing a
          disclosure the law required you to publish.
        </p>
      </LegalSection>

      <LegalSection title="6. Job seekers">
        <p>
          Give accurate information in your profile and applications. Sending
          an application through our form authorises us to store it and email
          it to that employer, as described in the privacy policy.
        </p>
      </LegalSection>

      <LegalSection title="7. Aggregated listings">
        <p>
          Some listings are copied from public employer career sites and other
          public sources, then edited for length. For those listings:
        </p>
        <LegalList
          items={[
            "They are provided as is. They may be incomplete, out of date, or closed.",
            "The employer's pay range, equal-opportunity statement, visa note, and accessibility statement stay on the listing when the source included them.",
            "You apply on the employer's site. We do not control that process.",
            "The listing remains the employer's intellectual property. We display it to send candidates to the source.",
          ]}
        />
        <p>
          Employers can ask us to correct or remove a listing by emailing{" "}
          <LegalEmailLink />. We also accept copyright notices at{" "}
          <a href="/dmca" className="text-ink underline underline-offset-2">
            the DMCA page
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="8. Featured listings">
        <p>
          Featuring a listing costs {featuredPrice}, charged once through
          Stripe, and lasts {FEATURED_DURATION_DAYS} days from the time the
          listing is marked featured. {featuredPlacementSentence()} It is not a
          subscription.
        </p>
        <p>
          If we take payment and the listing never goes live as featured, we
          refund the full amount. Once it is featured, the fee is not
          refundable, including if you fill the role or take the listing down
          during the {FEATURED_DURATION_DAYS} days.
        </p>
      </LegalSection>

      <LegalSection title="9. Our material">
        <p>
          The site design, code, and our own writing belong to us or our
          licensors. You may not copy them or build a product from them without
          written permission. Employer listings and aggregated listings are not
          our property. See sections 5 and 7.
        </p>
      </LegalSection>

      <LegalSection title="10. Disclaimer">
        <p>
          The site is provided as is. We do not warrant that listings are
          accurate, that candidates are suitable, or that the site will be
          uninterrupted. US government reactor data is shown with its public
          source. It can lag the plant.
        </p>
      </LegalSection>

      <LegalSection title="11. Liability">
        <p>
          To the extent the law allows, we are not liable for indirect,
          incidental, special, or consequential damages, including lost profits,
          lost data, or a dispute between a candidate and an employer.
        </p>
        <p>
          Our total liability arising out of the site in any 12-month period is
          limited to the amount you paid us in that period, or $100 if you paid
          nothing. This limit does not apply to liability that cannot legally
          be limited, including fraud, or death or personal injury caused by
          negligence where the law forbids that limit.
        </p>
      </LegalSection>

      <LegalSection title="12. Copyright complaints">
        <p>
          If you believe material on the site infringes a copyright you own,
          send a notice as described on the{" "}
          <a href="/dmca" className="text-ink underline underline-offset-2">
            DMCA page
          </a>
          . We will remove or disable material that a complete notice identifies.
        </p>
      </LegalSection>

      <LegalSection title="13. Governing law">
        <p>
          These terms are governed by the laws of {LEGAL_GOVERNING_LAW}.
          Disputes are heard in {LEGAL_VENUE}, except where the law of the
          place you live gives you a right to sue there that cannot be waived.
        </p>
        <p>
          Employment and advertising laws that apply to a job posting still
          apply to the employer who made it. These terms do not move that duty
          onto us.
        </p>
      </LegalSection>

      <LegalSection title="14. Changes">
        <p>
          We will post changes on this page and email registered users about a
          material change. The new terms apply from the date at the top. If you
          do not agree, stop using the site and delete your account.
        </p>
      </LegalSection>

      <LegalSection title="15. Contact">
        <p>
          Questions about these terms: <LegalEmailLink />.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
