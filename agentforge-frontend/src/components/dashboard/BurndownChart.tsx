// src/components/dashboard/BurndownChart.tsx

import { cn } from '../../lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BurndownDataPoint {
  date: string;
  ideal: number;
  actual: number;
}

interface BurndownChartProps {
  data: BurndownDataPoint[];
  title?: string;
  height?: number;
}

export function BurndownChart({ data, title = 'Sprint Burndown', height = 300 }: BurndownChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="font-semibold text-text-heading mb-4">{title}</h3>
        <div className="text-center text-text-muted py-8">
          <p>No burndown data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-text-heading mb-4">{title}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#888', fontSize: 11 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis
              tick={{ fill: '#888', fontSize: 11 }}
              tickFormatter={(value) => `${value} SP`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e1e1e',
                border: '1px solid #2d2d2d',
                borderRadius: '8px',
              }}
              labelFormatter={(label: any) => label ? new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="ideal"
              stroke="#888"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Ideal"
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="var(--brand-primary)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
              name="Actual"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}