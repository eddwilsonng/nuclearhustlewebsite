import { Metadata } from "next";
import {
  LegalDocument,
  LegalEmailLink,
  LegalSection,
} from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Accessibility — Nuclear Hustle",
  description:
    "How to report an accessibility barrier on Nuclear Hustle, and the standard we build to.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return (
    <LegalDocument title="Accessibility" updated="October 2026">
      <LegalSection title="What we build to">
        <p>
          Public pages are built to WCAG 2.2 level AA: text that meets contrast,
          keyboard access, visible focus, and labels on form fields. We have not
          commissioned a third-party audit, so this page is not a conformance
          certificate.
        </p>
      </LegalSection>

      <LegalSection title="If something blocks you">
        <p>
          Email <LegalEmailLink /> with the page URL, what you were trying to
          do, and what you were using (keyboard, screen reader, browser zoom, or
          something else). We will reply within 5 business days with a fix, a
          workaround, or a date.
        </p>
        <p>
          If you need a job listing in a different format, say which listing and
          which format. We will send the text we have.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
