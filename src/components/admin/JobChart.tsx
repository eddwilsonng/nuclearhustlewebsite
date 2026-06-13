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

export function JobChart({ data }: JobChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 font-mono text-sm">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fontFamily: 'monospace' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fontFamily: 'monospace' }}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            fontFamily: 'monospace',
            fontSize: 12,
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        />
        <Legend
          wrapperStyle={{ fontFamily: 'monospace', fontSize: 11 }}
        />
        <Bar
          dataKey="scraped"
          name="Scraped"
          fill="#d1d5db"
          radius={[2, 2, 0, 0]}
          stackId="jobs"
        />
        <Bar
          dataKey="employer"
          name="Employer"
          fill="#eab308"
          radius={[2, 2, 0, 0]}
          stackId="jobs"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
