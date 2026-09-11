// src/components/dashboard/VelocityChart.tsx

import { cn } from '../../lib/utils';
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

interface VelocityDataPoint {
  sprint: string;
  velocity: number;
  planned: number;
}

interface VelocityChartProps {
  data: VelocityDataPoint[];
  title?: string;
  height?: number;
}

export function VelocityChart({ data, title = 'Sprint Velocity', height = 300 }: VelocityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="font-semibold text-text-heading mb-4">Sprint Velocity</h3>
        <div className="text-center text-text-muted py-8">
          <p>No velocity data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-text-heading mb-4">Sprint Velocity</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
            <XAxis
              type="number"
              tick={{ fill: '#888', fontSize: 11 }}
              tickFormatter={(value) => `${value} SP`}
            />
            <YAxis
              dataKey="sprint"
              type="category"
              tick={{ fill: '#888', fontSize: 11 }}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e1e1e',
                border: '1px solid #2d2d2d',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar
              dataKey="velocity"
              fill="var(--brand-primary)"
              name="Actual Velocity"
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="planned"
              fill="#2d2d2d"
              name="Planned"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}