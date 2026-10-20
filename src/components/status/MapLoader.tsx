'use client';

import dynamic from 'next/dynamic';
import type { PlantWithStatus } from '@/app/outages/page';

const ReactorMap = dynamic(() => import('./ReactorMap'), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[5/3] w-full items-center justify-center bg-surface">
      <p className="font-mono text-xs text-secondary tracking-widest uppercase">Loading map...</p>
    </div>
  ),
});

export default function MapLoader({ plants }: { plants: PlantWithStatus[] }) {
  return (
    <div>
      <div className="flex justify-end border-b border-rule bg-surface px-4 py-2">
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
