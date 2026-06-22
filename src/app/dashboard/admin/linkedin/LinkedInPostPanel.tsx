'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function LinkedInPostPanel({ post }: { post: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(post);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase border border-[#CFC8BC] bg-[#EDE8DF] hover:bg-[#E5DFD5] px-2 py-1 transition-colors"
      >
        {copied ? (
          <>
            <Check size={11} />
            Copied
          </>
        ) : (
          <>
            <Copy size={11} />
            Copy
          </>
        )}
      </button>
      <textarea
        readOnly
        value={post}
        rows={Math.max(16, post.split('\n').length + 2)}
        className="w-full font-mono text-xs text-stone-700 bg-[#EDE8DF] border border-[#CFC8BC] p-4 pr-24 resize-none focus:outline-none leading-relaxed"
      />
    </div>
  );
}
