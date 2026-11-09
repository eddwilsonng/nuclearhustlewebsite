'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartDataPoint {
  date: string;
  scraped: number;
  employer: number;
}

interface JobChartProps {
  data: ChartDataPoint[];
}

const AXIS_TICK = { fontSize: 12, fontFamily: 'var(--font-geist-mono)', fill: 'var(--ink-secondary)' };

export function JobChart({ data }: JobChartProps) {
  if (data.length === 0) {
    return (
      <p className="border border-dashed border-rule px-5 py-12 text-center font-sans text-sm text-secondary">
        No postings yet.
      </p>
    );
  }

  const scraped = data.reduce((sum, d) => sum + d.scraped, 0);
  const employer = data.reduce((sum, d) => sum + d.employer, 0);
  // A canvas gap between stacked segments, while bars are wide enough to keep it.
  const gap = data.length <= 60 ? { stroke: 'var(--canvas)', strokeWidth: 2 } : {};

  return (
    <div
      role="img"
      aria-label={`Job postings per day, ${data[0].date} to ${data[data.length - 1].date}: ${scraped} scraped, ${employer} from employers.`}
    >
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 5, right: 8, left: -16, bottom: 5 }}>
          <CartesianGrid vertical={false} stroke="var(--rule)" />
          <XAxis
            dataKey="date"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: 'var(--rule)' }}
            minTickGap={16}
          />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: 'var(--surface)' }}
            contentStyle={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: 12,
              color: 'var(--ink)',
              background: 'var(--surface-raised)',
              border: '1px solid var(--control-border)',
              borderRadius: 0,
            }}
            labelStyle={{ color: 'var(--ink)' }}
          />
          <Legend wrapperStyle={{ fontFamily: 'var(--font-geist-sans)', fontSize: 12, color: 'var(--ink-secondary)' }} />
          <Bar dataKey="scraped" name="Scraped" fill="var(--ink-muted)" stackId="jobs" {...gap} />
          <Bar dataKey="employer" name="Employer" fill="var(--ink)" stackId="jobs" {...gap} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
