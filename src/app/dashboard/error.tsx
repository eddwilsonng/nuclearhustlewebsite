"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="font-sans text-2xl font-semibold text-ink">This page didn&apos;t load</h1>
      <p className="mt-2 max-w-prose font-sans text-sm leading-relaxed text-secondary">
        Something failed on our side while loading your account. Your data is safe. Try again,
        and if it keeps happening, email nuclearhustle@gmail.com
        {error.digest ? ` with the reference ${error.digest}` : ""}.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <LinkButton href="/dashboard" variant="secondary">
          Back to overview
        </LinkButton>
      </div>
    </div>
  );
}
