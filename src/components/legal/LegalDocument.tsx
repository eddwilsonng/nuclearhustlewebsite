import type { ReactNode } from "react";
import { LEGAL_EMAIL, legalOperatorName, legalPostalLines } from "@/lib/legal";

export function LegalDocument({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <section className="border-b border-rule py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <p className="mb-4 font-mono text-xs tracking-widest text-secondary uppercase">
            Legal
          </p>
          <h1 className="font-sans text-3xl leading-tight font-bold text-ink md:text-4xl">
            {title}
          </h1>
          <p className="mt-6 font-mono text-sm text-secondary">
            Last updated: {updated}
          </p>
        </div>
      </section>
      <section className="py-20">
        <div className="mx-auto max-w-4xl space-y-12 px-6">{children}</div>
      </section>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-4 font-sans text-xl font-bold text-ink sm:text-2xl">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-secondary">
        {children}
      </div>
    </div>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm text-secondary">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="shrink-0 font-mono text-ink">—</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LegalEmailLink() {
  return (
    <a
      href={`mailto:${LEGAL_EMAIL}`}
      className="text-ink underline underline-offset-2"
    >
      {LEGAL_EMAIL}
    </a>
  );
}

export function OperatorBlock() {
  const lines = legalPostalLines();
  return (
    <div className="space-y-1">
      <p>{legalOperatorName()} operates nuclearhustle.com.</p>
      {lines.length > 0 ? (
        <p>
          {lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      ) : null}
      <p>
        <LegalEmailLink />
      </p>
    </div>
  );
}
