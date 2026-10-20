import Link from "next/link";
import { HOME_FAQ_GROUPS, HOME_FAQS } from "@/lib/seo/homeFaq";
import { generateFaqSchema } from "@/lib/seo/schema";

export function HomeFaq() {
  const schema = generateFaqSchema(HOME_FAQS);

  return (
    <section
      className="border-b border-rule py-16"
      aria-labelledby="home-faq-heading"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16">
        {/* Left: sticky heading rail */}
        <div className="self-start lg:sticky lg:top-6">
          <p className="font-mono text-xs uppercase tracking-widest text-secondary">
            FAQ
          </p>
          <h2
            id="home-faq-heading"
            className="mt-2 font-sans text-2xl font-bold tracking-tight text-ink"
          >
            Questions, answered
          </h2>
          <p className="mt-3 max-w-xs font-sans text-sm leading-relaxed text-secondary">
            How the board works, who it&rsquo;s for, and what to expect when you
            apply or hire.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-ink underline-offset-4 hover:underline"
          >
            Still stuck? Contact us →
          </Link>
        </div>

        {/* Right: grouped accordions */}
        <div className="space-y-10">
          {HOME_FAQ_GROUPS.map((group) => (
            <div key={group.id}>
              <p className="mb-1 font-mono text-xs uppercase tracking-widest text-muted">
                {group.label}
              </p>
              <div className="border-t border-rule">
                {group.items.map((item) => (
                  <details
                    key={item.question}
                    open={item.open}
                    className="group border-b border-rule"
                  >
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
                      <h3 className="font-sans text-[0.95rem] font-semibold text-ink">
                        {item.question}
                      </h3>
                      {/* plus that becomes a minus when open */}
                      <span
                        aria-hidden="true"
                        className="relative mt-1 size-3.5 shrink-0 text-secondary transition-colors group-hover:text-ink"
                      >
                        <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current" />
                        <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-current transition-all duration-150 group-open:rotate-90 group-open:opacity-0 motion-reduce:transition-none" />
                      </span>
                    </summary>
                    <p className="max-w-prose pb-4 font-sans text-sm leading-relaxed text-secondary">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
