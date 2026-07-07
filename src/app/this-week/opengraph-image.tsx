import { ImageResponse } from 'next/og';
import { getPublishedWeek } from '@/lib/weekly/store';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  const week = await getPublishedWeek();
  const count = week?.jobs.length ?? 0;

  const headline = count > 0 ? `${count} roles worth a look.` : 'Top roles, updated weekly.';

  return new ImageResponse(
    (
      <div
        style={{
          background: '#EDE8DF',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          fontFamily: 'monospace',
        }}
      >
        {/* Top: logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#A8A29E', fontSize: 24 }}>##</span>
          <span
            style={{
              color: '#1C1917',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            NUCLEARHUSTLE
          </span>
        </div>

        {/* Middle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <span
            style={{
              color: '#78716C',
              fontSize: 20,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            THIS WEEK IN NUCLEAR
          </span>
          <span style={{ color: '#1C1917', fontSize: 72, fontWeight: 900, lineHeight: 1.1 }}>
            {headline}
          </span>
          <span style={{ color: '#78716C', fontSize: 26, marginTop: '8px' }}>
            Operators, contractors, and engineering firms across the US.
          </span>
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div
            style={{
              background: '#FACC15',
              color: '#1C1917',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '14px 28px',
              display: 'flex',
            }}
          >
            SEE THIS WEEK&rsquo;S PICKS →
          </div>
          <span style={{ color: '#A8A29E', fontSize: 20 }}>nuclearhustle.com/this-week</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
