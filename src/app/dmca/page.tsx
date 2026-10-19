import { Metadata } from "next";
import {
  LegalDocument,
  LegalEmailLink,
  LegalList,
  LegalSection,
  OperatorBlock,
} from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Copyright notices — Nuclear Hustle",
  description:
    "How to send a copyright takedown notice or a counter-notice to Nuclear Hustle.",
  alternates: { canonical: "/dmca" },
};

export default function DmcaPage() {
  return (
    <LegalDocument title="Copyright notices" updated="October 2026">
      <LegalSection title="Designated agent">
        <OperatorBlock />
        <p>
          Send copyright notices and counter-notices to <LegalEmailLink /> with
          the subject line “Copyright notice”. The US Copyright Act safe-harbor
          rules also require a designated agent on file with the US Copyright
          Office. Notices sent to the email above are still reviewed and, when
          complete, acted on.
        </p>
      </LegalSection>

      <LegalSection title="What a notice must include">
        <p>
          A notice under 17 USC 512(c)(3) needs all of the following. We will
          ask for anything missing before we treat it as a formal notice.
        </p>
        <LegalList
          items={[
            "Your physical or electronic signature.",
            "The copyrighted work you claim is infringed.",
            "The URL or other location of the material on this site.",
            "Your name, postal address, telephone number, and email address.",
            "A statement that you have a good-faith belief the use is not authorised by the owner, the owner's agent, or the law.",
            "A statement, under penalty of perjury, that the notice is accurate and that you are the owner or are authorised to act for the owner.",
          ]}
        />
      </LegalSection>

      <LegalSection title="What we do">
        <p>
          A complete notice is enough for us to remove or disable the material
          and, where we have an account for the poster, pass the notice on.
          Repeat posters can lose their account.
        </p>
      </LegalSection>

      <LegalSection title="Counter-notice">
        <p>
          If your material was removed and you believe that was a mistake, send
          a counter-notice to the same address. Include your signature, the
          material that was removed and where it appeared, a statement under
          penalty of perjury that the removal was a mistake or misidentification,
          your name and contact details, and consent to the jurisdiction of the
          federal court for your district (or, if you are outside the United
          States, for any district where we may be found). We may restore the
          material after 10 business days unless the complainant tells us they
          have filed a court action.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
