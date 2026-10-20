import { ImageResponse } from 'next/og';

export const alt =
  'Nuclear Salary Report 2026: What Nuclear Jobs Actually Pay | Nuclear Hustle';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Rounded from BLS_ROLES medians on the salary page ($133,970 / $122,890 / $110,240).
const ROLES = [
  { label: 'Nuclear engineer', pay: '$134k', lead: true },
  { label: 'Reactor operator', pay: '$123k', lead: false },
  { label: 'Nuclear technician', pay: '$110k', lead: false },
] as const;

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <span
            style={{
              color: '#78716C',
              fontSize: 22,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Nuclear salary report 2026
          </span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '40px' }}>
            {ROLES.map((role) => (
              <div key={role.label} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span
                  style={{
                    color: role.lead ? '#EAB308' : '#1C1917',
                    fontSize: role.lead ? 92 : 48,
                    fontWeight: 900,
                    lineHeight: 1,
                  }}
                >
                  {role.pay}
                </span>
                <span style={{ color: '#78716C', fontSize: 22 }}>{role.label} median</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#78716C', fontSize: 22 }}>BLS OES 2025 · $93k–$196k engineer range</span>
          <span style={{ color: '#A8A29E', fontSize: 20 }}>nuclearhustle.com/nuclear-salary</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
