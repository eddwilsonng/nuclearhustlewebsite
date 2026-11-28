"use client";

import { useState } from "react";
import { Facebook, Linkedin, Link as LinkIcon } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.nuclearhustle.com';
const PAGE_URL = `${SITE_URL}/outages`;
const PAGE_TITLE = 'Nuclear outage schedule - every US reactor';

export function ShareOutageButtons() {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(`${PAGE_URL}?utm_source=site&utm_medium=outages_share&utm_campaign=community`);
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${PAGE_URL}?utm_source=site&utm_medium=outages_share&utm_campaign=community`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = `${PAGE_URL}?utm_source=site&utm_medium=outages_share&utm_campaign=community`;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 font-sans text-sm text-secondary underline decoration-dotted underline-offset-2 hover:text-ink"
      >
        <Linkedin className="h-4 w-4" />
        Share on LinkedIn
      </a>
      <span className="text-rule" aria-hidden="true">
        |
      </span>
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 font-sans text-sm text-secondary underline decoration-dotted underline-offset-2 hover:text-ink"
      >
        <Facebook className="h-4 w-4" />
        Share on Facebook
      </a>
      <span className="text-rule" aria-hidden="true">
        |
      </span>
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-2 font-sans text-sm text-secondary underline decoration-dotted underline-offset-2 hover:text-ink"
      >
        <LinkIcon className="h-4 w-4" />
        {copied ? "Link copied!" : "Copy link"}
      </button>
    </div>
  );
}
