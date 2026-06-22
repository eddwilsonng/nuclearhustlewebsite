'use client';

import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export function LinkedInRerunButton({ currentSeed }: { currentSeed: number }) {
  const router = useRouter();

  function rerun() {
    // Pick a new seed that's different from the current one
    let next = Math.floor(Math.random() * 9999) + 1;
    if (next === currentSeed) next = (next % 9999) + 1;
    router.push(`/dashboard/admin/linkedin?seed=${next}`);
  }

  return (
    <button
      onClick={rerun}
      className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase border border-[#CFC8BC] bg-[#EDE8DF] hover:bg-[#E5DFD5] px-3 py-1.5 transition-colors"
    >
      <RefreshCw size={11} />
      Rerun
    </button>
  );
}
