import { ImageResponse } from 'next/og';

export const alt = 'Nuclear Hustle — Nuclear Power Plant Jobs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
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
          <span style={{ color: '#1C1917', fontSize: 20, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            NUCLEARHUSTLE
          </span>
        </div>

        {/* Middle: headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ color: '#78716C', fontSize: 22, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            ★ THE JOB BOARD FOR NUCLEAR PROFESSIONALS
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: 72, fontWeight: 900, lineHeight: 1.1 }}>
            <span style={{ color: '#1C1917', marginRight: '20px' }}>Nuclear energy</span>
            <span style={{ color: '#EAB308' }}>careers.</span>
          </div>
          <span style={{ color: '#78716C', fontSize: 26, marginTop: '8px' }}>
            Updated daily from top US operators.
          </span>
        </div>

        {/* Bottom: CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div
            style={{
              background: '#EAB308',
              color: '#1C1917',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '14px 28px',
              display: 'flex',
            }}
          >
            BROWSE ALL JOBS →
          </div>
          <span style={{ color: '#A8A29E', fontSize: 20 }}>nuclearhustle.com</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
