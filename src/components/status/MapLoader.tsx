'use client';

import dynamic from 'next/dynamic';
import type { PlantWithStatus } from '@/app/status/page';

const ReactorMap = dynamic(() => import('./ReactorMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[560px] bg-[#E5DFD5] flex items-center justify-center">
      <p className="font-mono text-xs text-stone-300 tracking-widest uppercase">Loading map...</p>
    </div>
  ),
});

export default function MapLoader({ plants }: { plants: PlantWithStatus[] }) {
  return <ReactorMap plants={plants} />;
}
