import { Metadata } from 'next';
import Link from 'next/link';
import plantsData from '@/data/plants.json';
import { US_STATES } from '@/lib/states';

export const metadata: Metadata = {
  title: 'US Nuclear Power Plants Directory — Nuclear Hustle',
  description: `Every commercial nuclear power plant in the United States. Browse all ${plantsData.plants.length} plants by state, see operating status, and find open nuclear jobs.`,
  alternates: { canonical: '/plants' },
};

export default function PlantsPage() {
  // Group plants by state, sorted alphabetically by state name
  const byState = new Map<string, typeof plantsData.plants>();
  for (const plant of plantsData.plants) {
    if (!byState.has(plant.state)) byState.set(plant.state, []);
    byState.get(plant.state)!.push(plant);
  }

  const sortedStates = [...byState.entries()].sort((a, b) => {
    const nameA = US_STATES.find(s => s.code === a[0])?.name ?? a[0];
    const nameB = US_STATES.find(s => s.code === b[0])?.name ?? b[0];
    return nameA.localeCompare(nameB);
  });

  const totalUnits = plantsData.plants.reduce((sum, p) => sum + p.units.length, 0);

  return (
    <div className="min-h-screen bg-[#EDE8DF]">

      {/* Header */}
      <div className="border-b border-[#CFC8BC] py-10">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-3">Directory</p>
          <h1 className="font-mono text-3xl md:text-4xl font-bold text-stone-900 mb-3">
            US Nuclear Power Plants
          </h1>
          <p className="font-mono text-sm text-stone-500">
            {plantsData.plants.length} plants · {totalUnits} reactors · {sortedStates.length} states
          </p>
        </div>
      </div>

      {/* Plants by state */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col gap-8">
          {sortedStates.map(([stateCode, plants]) => {
            const stateInfo = US_STATES.find(s => s.code === stateCode);
            const stateName = stateInfo?.name ?? stateCode;

            return (
              <div key={stateCode}>
                <div className="flex items-baseline justify-between mb-3">
                  <p className="font-mono text-xs tracking-widest uppercase text-stone-400">
                    {stateName}
                  </p>
                  {stateInfo?.slug && (
                    <Link
                      href={`/jobs/${stateInfo.slug}`}
                      className="font-mono text-xs text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      {stateName} jobs →
                    </Link>
                  )}
                </div>

                <div className="border border-[#CFC8BC] divide-y divide-[#CFC8BC]">
                  {plants.map(plant => (
                    <Link
                      key={plant.id}
                      href={`/plants/${plant.id}`}
                      className="flex items-center justify-between px-5 py-4 hover:bg-[#E5DFD5] transition-colors group"
                    >
                      <div>
                        <p className="font-mono text-sm font-bold text-stone-900 group-hover:underline underline-offset-2">
                          {plant.name}
                        </p>
                        <p className="font-mono text-xs text-stone-400 mt-0.5">
                          {plant.city} · {plant.operator}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-4">
                        <span className="hidden sm:block font-mono text-xs text-stone-300">
                          {plant.units.length} unit{plant.units.length > 1 ? 's' : ''}
                        </span>
                        {(plant as { restarting?: boolean }).restarting && (
                          <span className="font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5 border border-blue-200 text-blue-600 bg-blue-50">
                            Restarting
                          </span>
                        )}
                        <span className="font-mono text-xs text-stone-300 group-hover:text-stone-500">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="font-mono text-xs text-stone-400 mt-10">
          Data sourced from the US Nuclear Regulatory Commission.{' '}
          <Link href="/status" className="hover:text-stone-600 transition-colors underline underline-offset-2">
            View live fleet status →
          </Link>
        </p>
      </div>
    </div>
  );
}
