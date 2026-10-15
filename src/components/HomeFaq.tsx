import Script from "next/script";
import { HOME_FAQ_GROUPS, HOME_FAQS } from "@/lib/seo/homeFaq";
import { generateFaqSchema } from "@/lib/seo/schema";

export function HomeFaq() {
  const schema = generateFaqSchema(HOME_FAQS);

  return (
    <section className="border-t border-rule py-16" aria-labelledby="home-faq-heading">
      <Script
        id="home-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="mx-auto max-w-6xl px-6">
        <h2 id="home-faq-heading" className="font-sans text-2xl font-bold text-ink">
          FAQs
        </h2>
        <div className="mt-10 grid gap-12 md:grid-cols-2 md:gap-16">
          {HOME_FAQ_GROUPS.map((group) => (
            <div key={group.id}>
              <p className="font-mono text-xs uppercase tracking-widest text-secondary">
                {group.label}
              </p>
              <div className="mt-4 border-t border-rule">
                {group.items.map((item) => (
                  <details
                    key={item.question}
                    open={item.open}
                    className="group border-b border-rule"
                  >
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
                      <h3 className="font-sans text-sm font-semibold text-ink">
                        {item.question}
                      </h3>
                      <svg
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                        className="size-4 shrink-0 text-secondary transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
                      >
                        <path
                          d="M4 6l4 4 4-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="square"
                        />
                      </svg>
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
