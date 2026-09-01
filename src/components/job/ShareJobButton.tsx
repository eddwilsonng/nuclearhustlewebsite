"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ShareJobButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or share failed; fall through to copy.
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="secondary" size="compact" onClick={share}>
      {copied ? "Link copied" : "Share"}
    </Button>
  );
}
