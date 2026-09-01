'use client';

import dynamic from 'next/dynamic';
import type { PlantWithStatus } from '@/app/status/page';

const ReactorMap = dynamic(() => import('./ReactorMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[560px] bg-surface flex items-center justify-center">
      <p className="font-mono text-xs text-secondary tracking-widest uppercase">Loading map...</p>
    </div>
  ),
});

export default function MapLoader({ plants }: { plants: PlantWithStatus[] }) {
  return (
    <div>
      <div className="mx-auto flex max-w-6xl justify-end px-6 py-2">
        <a
          href="#all-reactors"
          className="font-sans text-sm text-secondary underline underline-offset-2 hover:text-ink"
        >
          Skip map, view reactor list
        </a>
      </div>
      <ReactorMap plants={plants} />
    </div>
  );
}
