import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { LinkButton } from "@/components/ui/LinkButton";
import { createClient } from "@/lib/supabase/server";
import { JOB_DURATION_DAYS } from "@/lib/jobs/expiry";
import {
  FEATURED_DURATION_DAYS,
  FEATURED_PRICE_CENTS,
  featuredPlacementSentence,
  featuredPriceLabel,
} from "@/lib/jobs/featuredOffer";
import { LEGAL_EMAIL } from "@/lib/legal";
import { generateBreadcrumbSchema } from "@/lib/seo/schema";

const PRICE = featuredPriceLabel();
const SITE = "https://www.nuclearhustle.com";

export const metadata: Metadata = {
  title: "Post a Nuclear Job | Nuclear Hustle",
  description: `List a US nuclear role free for ${JOB_DURATION_DAYS} days. Feature it for ${PRICE}: pinned for ${FEATURED_DURATION_DAYS} days on the board and homepage, and included in every Monday digest during that window.`,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Post a Nuclear Job | Nuclear Hustle",
    description: `A listing is free for ${JOB_DURATION_DAYS} days. Featuring it is ${PRICE} for ${FEATURED_DURATION_DAYS} days.`,
    type: "website",
    url: `${SITE}/pricing`,
  },
};

const STANDARD_INCLUDES = [
  "Live on the board, including the matching state and role pages",
  "Applicants go to your careers URL, or you take applications by email with the CV attached",
  "You manage the listing from the employer dashboard",
];

const FEATURED_INCLUDES = [
  "Pinned to the top of the jobs board",
  "Shown on the homepage",
  "Featured badge on the listing",
  `Included in every Monday digest sent during those ${FEATURED_DURATION_DAYS} days`,
];

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const postHref = user ? "/dashboard/jobs/new" : "/signup/employer";

  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: `${SITE}/` },
    { name: "Pricing", url: `${SITE}/pricing` },
  ]);

  const offers = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Post a nuclear job",
    url: `${SITE}/pricing`,
    description: featuredPlacementSentence(),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          item: {
            "@type": "Offer",
            name: "Standard listing",
            price: "0",
            priceCurrency: "USD",
            description: `A nuclear job listing, live for ${JOB_DURATION_DAYS} days.`,
          },
        },
        {
          "@type": "ListItem",
          position: 2,
          item: {
            "@type": "Offer",
            name: "Featured listing",
            price: String(FEATURED_PRICE_CENTS / 100),
            priceCurrency: "USD",
            description: featuredPlacementSentence(),
          },
        },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-canvas">
      <Script
        id="pricing-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <Script
        id="pricing-offer-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offers) }}
      />

      <section className="border-b border-rule py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <p className="mb-4 font-mono text-xs tracking-widest text-secondary uppercase">
            Employers
          </p>
          <h1 className="max-w-2xl font-sans text-3xl leading-tight font-bold text-ink md:text-4xl">
            Post a nuclear job.
          </h1>
          <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-secondary">
            A listing is free for {JOB_DURATION_DAYS} days. Featuring it is {PRICE}{" "}
            for {FEATURED_DURATION_DAYS} days.
          </p>
        </div>
      </section>

      <section className="border-b border-rule py-20" aria-labelledby="listing-options">
        <div className="mx-auto max-w-4xl px-6">
          <h2 id="listing-options" className="sr-only">
            Listing options
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <article className="border border-rule p-8">
              <p className="font-mono text-xs tracking-widest text-secondary uppercase">
                Standard
              </p>
              <p className="mt-4 font-sans text-4xl font-bold text-ink">$0</p>
              <p className="mt-1 font-sans text-sm text-secondary">
                {JOB_DURATION_DAYS} days
              </p>
              <ul className="mt-8 space-y-3 font-sans text-sm leading-relaxed text-secondary">
                {STANDARD_INCLUDES.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="shrink-0 font-mono text-ink" aria-hidden="true">
                      —
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article className="border border-rule border-l-2 border-l-signal p-8">
              <p className="font-mono text-xs tracking-widest text-secondary uppercase">
                Featured
              </p>
              <p className="mt-4 font-sans text-4xl font-bold text-ink">{PRICE}</p>
              <p className="mt-1 font-sans text-sm text-secondary">
                {FEATURED_DURATION_DAYS} days
              </p>
              <p className="mt-8 font-sans text-sm leading-relaxed text-secondary">
                Everything in a standard listing, plus:
              </p>
              <ul className="mt-3 space-y-3 font-sans text-sm leading-relaxed text-secondary">
                {FEATURED_INCLUDES.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="shrink-0 font-mono text-ink" aria-hidden="true">
                      —
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mt-12">
            <LinkButton href={postHref} variant="primary">
              Post a job
            </LinkButton>
            {!user ? (
              <p className="mt-4 font-sans text-sm text-secondary">
                <Link href="/login" className="text-ink underline underline-offset-2">
                  Log in
                </Link>{" "}
                if you already have an employer account.
              </p>
            ) : null}
            <p className="mt-6 max-w-xl font-sans text-base leading-relaxed text-secondary">
              You publish the listing first. Featuring it is a separate {PRICE}{" "}
              checkout. Full refund if it never goes live as featured.
              Non-refundable once it does.{" "}
              <Link href="/terms" className="text-ink underline underline-offset-2">
                Terms
              </Link>
            </p>
            <p className="mt-4 max-w-xl font-sans text-base leading-relaxed text-secondary">
              Hiring more than one role, or need an invoice before you pay?{" "}
              <a
                href={`mailto:${LEGAL_EMAIL}`}
                className="text-ink underline underline-offset-2"
              >
                {LEGAL_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
