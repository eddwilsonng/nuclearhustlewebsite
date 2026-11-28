"use client";

import { useState } from "react";
import { Facebook, Linkedin, Link as LinkIcon } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="font-mono text-xs uppercase tracking-widest text-secondary">
        Share
      </span>
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-secondary underline decoration-dotted underline-offset-2 hover:text-ink"
      >
        <Linkedin className="h-4 w-4" />
        LinkedIn
      </a>
      <span className="text-rule" aria-hidden="true">
        |
      </span>
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-secondary underline decoration-dotted underline-offset-2 hover:text-ink"
      >
        <Facebook className="h-4 w-4" />
        Facebook
      </a>
      <span className="text-rule" aria-hidden="true">
        |
      </span>
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 text-secondary underline decoration-dotted underline-offset-2 hover:text-ink"
      >
        <LinkIcon className="h-4 w-4" />
        {copied ? "Link copied!" : "Copy link"}
      </button>
    </div>
  );
}
