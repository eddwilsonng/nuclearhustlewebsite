import { Metadata } from "next";
import { AnalyticsPreference } from "@/components/AnalyticsPreference";
import {
  LegalDocument,
  LegalEmailLink,
  LegalList,
  LegalSection,
  OperatorBlock,
} from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy — Nuclear Hustle",
  description:
    "How Nuclear Hustle collects, uses, and shares personal information for accounts, job alerts, and applications.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy" updated="October 2026">
      <LegalSection title="1. Who we are">
        <OperatorBlock />
        <p>
          This policy covers nuclearhustle.com, a job board for the US nuclear
          energy industry. Questions about your information go to <LegalEmailLink />.
          We reply within 30 days.
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <p>You give us this information when you use the site:</p>
        <LegalList
          items={[
            "Account: name, email address, and a password handled by our authentication provider. Job seekers can also save a city and state.",
            "Job alerts: the email address you type into an alert form. No account is required.",
            "Applications: your name, email, optional cover letter, and CV. We store them and email them to the employer for that job. The download link in that email expires after 24 hours. The file stays in private storage.",
            "Employer accounts: your name, work email, company name, website, description, logo, job listings, and the address where applications should be sent.",
            "Payments: Stripe collects the card and billing details for a featured listing. We receive the payment status, amount, and email. We do not store card numbers.",
            "Messages you send us.",
          ]}
        />
        <p>
          We also store the IP address of an application or alert request for
          about an hour, so one address cannot flood the form. Those rows are
          deleted on the next write after an hour.
        </p>
        <p>
          If you allow analytics, Clicky receives pages visited, browser type,
          approximate location, IP address, and the referring URL. If you
          reject analytics, we do not load Clicky.
        </p>
        <p>
          We send job-ad text to Anthropic to clean listings for the board. We
          do not send accounts, CVs, or applications to Anthropic.
        </p>
      </LegalSection>

      <LegalSection title="3. How we use it">
        <LegalList
          items={[
            "To run the board, your account, and the application you submit.",
            "To send that application to the employer you applied to.",
            "To send account and application email, which you cannot opt out of while the account or application exists.",
            "To send job alerts and the Monday digest if you subscribed. Those are advertisements. Every one has an unsubscribe link, and we honour one-click unsubscribe.",
            "To take payment for a featured listing.",
            "To limit abuse and to fix the product.",
          ]}
        />
        <p>
          Job alerts and analytics run on your consent. An account, an
          application you submit, and a featured listing you buy run on the
          contract with you. Short-lived IP logs run on our interest in keeping
          the forms usable.
        </p>
      </LegalSection>

      <LegalSection title="4. Who else receives it">
        <p>We do not sell personal information. We use these companies to run the site:</p>
        <LegalList
          items={[
            "Supabase — database, authentication, and private storage for CVs.",
            "Resend — delivery of account, application, and marketing email, plus bounce and complaint events.",
            "Stripe — card payments for featured listings.",
            "Vercel — hosting. Request logs can include IP addresses.",
            "Clicky — analytics, and only after you allow it.",
            "Anthropic — job-ad text used to format a listing. Not candidate files.",
          ]}
        />
        <p>
          They process that information to provide the service. Where we have
          signed a data-processing agreement, they are bound by it. Do not read
          this list as a claim that every vendor is under a signed processing
          contract.
        </p>
        <p>
          The employer you apply to receives your name, email, cover letter,
          and CV. We do not offer a searchable candidate database, and we do
          not show your profile or resume to employers unless you apply.
        </p>
      </LegalSection>

      <LegalSection title="5. How long we keep it">
        <LegalList
          items={[
            "Account and profile: until you delete the account, or until we delete it after you email us.",
            "Applications and CVs: until you email us to delete them. We delete our copy within 30 days of that request. An employer who already downloaded the file keeps theirs.",
            "Alert subscribers: until you unsubscribe. We then keep the email and the unsubscribe time so a later signup does not silently ignore the opt-out. Signing up again turns alerts back on.",
            "Email delivery events: while we need them to track bounces and complaints. Email us if you want yours deleted.",
            "Rate-limit IP rows: about an hour.",
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Cookies and analytics">
        <p>
          Essential cookies keep you signed in. Clicky, an analytics service,
          may set a cookie or similar identifier, and only after you choose
          Allow analytics on the banner. Reject leaves those cookies unset.
          We do not use advertising cookies.
        </p>
        <p>
          You can change that choice here. Clearing site data for
          nuclearhustle.com also forgets it, and the banner shows again.
        </p>
        <AnalyticsPreference />
      </LegalSection>

      <LegalSection title="7. Your requests">
        <p>You can ask us to:</p>
        <LegalList
          items={[
            "Tell you what we hold about you.",
            "Correct it.",
            "Delete it. Signed-in users can also delete the account from the profile page.",
            "Stop job alerts, with the unsubscribe link or by email.",
            "Stop analytics, with the control on this page.",
          ]}
        />
        <p>
          Email <LegalEmailLink />. We respond within 30 days. We do not sell
          personal information. If a US state privacy law applies to a request,
          we will honour the rights that law gives you, including a request not
          to sell or share.
        </p>
        <p>
          Withdrawing consent for alerts or analytics does not delete an
          account or an application you already sent.
        </p>
      </LegalSection>

      <LegalSection title="8. Children">
        <p>
          The board is for people seeking work. We do not knowingly collect
          personal information from anyone under 16. If you believe we have,
          email us and we will delete it.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes">
        <p>
          We will update this page when the policy changes, and we will email
          registered users about a material change. The date at the top is the
          latest version.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
