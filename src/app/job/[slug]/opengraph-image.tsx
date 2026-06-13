import { ImageResponse } from 'next/og';
import { getAnyJobBySlug } from '@/lib/data/employer';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getAnyJobBySlug(slug);

  const title = job?.title ?? 'Nuclear Job';
  const company = job?.company?.name ?? 'Nuclear Hustle';
  const location = job?.location ?? 'United States';
  const fontSize = title.length > 40 ? 52 : 64;

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

        {/* Middle: job info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <span style={{ color: '#78716C', fontSize: 20, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            NOW HIRING
          </span>
          <span style={{ color: '#1C1917', fontSize: fontSize, fontWeight: 900, lineHeight: 1.1 }}>
            {title}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
            <span style={{ color: '#EAB308', fontSize: 26, fontWeight: 700 }}>{company}</span>
            <span style={{ color: '#CFC8BC', fontSize: 26 }}>//</span>
            <span style={{ color: '#78716C', fontSize: 26 }}>{location}</span>
          </div>
        </div>

        {/* Bottom */}
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
            APPLY NOW →
          </div>
          <span style={{ color: '#A8A29E', fontSize: 20 }}>nuclearhustle.com</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
