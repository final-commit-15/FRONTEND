// src/components/dashboard/BlockerTrendChart.tsx

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

interface BlockerTrendDataPoint {
  date: string;
  open: number;
  in_progress: number;
  resolved: number;
}

interface BlockerTrendChartProps {
  data: BlockerTrendDataPoint[];
  title?: string;
  height?: number;
}

export function BlockerTrendChart({ data, title = 'Blocker Trends', height = 300 }: BlockerTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="font-semibold text-text-heading mb-4">Blocker Trends</h3>
        <div className="text-center text-text-muted py-8">
          <p>No blocker trend data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-text-heading mb-4">Blocker Trends</h3>
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
              tickFormatter={(value) => `${value}`}
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
              dataKey="open"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Open"
            />
            <Line
              type="monotone"
              dataKey="in_progress"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="In Progress"
            />
            <Line
              type="monotone"
              dataKey="resolved"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Resolved"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}