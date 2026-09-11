// src/components/dashboard/QAPassRateChart.tsx

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

interface QADataPoint {
  feature: string;
  passed: number;
  failed: number;
  total: number;
  passRate: number;
}

interface QAPassRateChartProps {
  data: QADataPoint[];
  title?: string;
  height?: number;
}

export function QAPassRateChart({ data, title = 'QA Pass Rate by Feature', height = 300 }: QAPassRateChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="font-semibold text-text-heading mb-4">QA Pass Rate</h3>
        <div className="text-center text-text-muted py-8">
          <p>No QA data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-text-heading mb-4">QA Pass Rate by Feature</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
            <XAxis
              type="number"
              tick={{ fill: '#888', fontSize: 11 }}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              dataKey="feature"
              type="category"
              tick={{ fill: '#888', fontSize: 11 }}
              width={140}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e1e1e',
                border: '1px solid #2d2d2d',
                borderRadius: '8px',
              }}
              formatter={(value: any, name: any) => [
                `${value ?? 0} (${name === 'passed' ? 'Passed' : 'Failed'})`,
                name === 'passed' ? 'Passed' : 'Failed',
              ] as [string, string]}
            />
            <Legend />
            <Bar
              dataKey="passed"
              fill="#10b981"
              name="Passed"
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="failed"
              fill="#ef4444"
              name="Failed"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}