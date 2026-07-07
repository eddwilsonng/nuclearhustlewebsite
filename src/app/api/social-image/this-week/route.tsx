import { ImageResponse } from 'next/og';
import { getPublishedWeek } from '@/lib/weekly/store';
import { getCurrentWeekId, weekLabel } from '@/lib/date/week';

// Square post image for manual LinkedIn attachment. Not an OG card (those are
// auto-wired for link previews) — this is a downloadable asset the admin
// attaches to the post itself, where a native image lifts reach over text-only.
export const dynamic = 'force-dynamic';

const SIZE = { width: 1200, height: 1200 };

export async function GET() {
  const week = await getPublishedWeek();
  const count = week?.jobs.length ?? 0;
  // The published set's week if we have one, otherwise the live week.
  const rawLabel = weekLabel(week?.weekId ?? getCurrentWeekId());
  const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1); // "Week of 6 Jul 2026"

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
          padding: '90px 88px',
          fontFamily: 'monospace',
        }}
      >
        {/* Top: logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ color: '#A8A29E', fontSize: 30 }}>##</span>
          <span
            style={{
              color: '#1C1917',
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            NUCLEARHUSTLE
          </span>
        </div>

        {/* Middle: the message */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              color: '#78716C',
              fontSize: 30,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '24px',
            }}
          >
            THIS WEEK IN NUCLEAR
          </span>

          {count > 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px' }}>
              <span style={{ color: '#1C1917', fontSize: 240, fontWeight: 900, lineHeight: 0.9 }}>
                {count}
              </span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  paddingBottom: '22px',
                  color: '#1C1917',
                  fontSize: 76,
                  fontWeight: 900,
                  lineHeight: 1.05,
                }}
              >
                <span>roles worth</span>
                <span>a look</span>
              </div>
            </div>
          ) : (
            <span style={{ color: '#1C1917', fontSize: 100, fontWeight: 900, lineHeight: 1.05 }}>
              Roles worth a look
            </span>
          )}

          <span style={{ color: '#78716C', fontSize: 38, marginTop: '30px' }}>
            New this week across US operators, contractors &amp; engineering firms
          </span>

          <div style={{ display: 'flex', marginTop: '20px' }}>
            <span
              style={{
                color: '#1C1917',
                fontSize: 34,
                fontWeight: 700,
                background: '#FACC15',
                padding: '10px 22px',
              }}
            >
              {label}
            </span>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              color: '#78716C',
              fontSize: 30,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            nuclearhustle.com/this-week
          </span>
          <span style={{ color: '#A8A29E', fontSize: 30 }}>→</span>
        </div>
      </div>
    ),
    { ...SIZE }
  );
}
