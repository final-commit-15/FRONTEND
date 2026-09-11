// src/components/dashboard/DailyCompletedTasksChart.tsx

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

interface DailyTaskDataPoint {
  date: string;
  completed: number;
  created: number;
}

interface DailyCompletedTasksChartProps {
  data: DailyTaskDataPoint[];
  title?: string;
  height?: number;
}

export function DailyCompletedTasksChart({ data, title = 'Daily Completed Tasks', height = 300 }: DailyCompletedTasksChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="font-semibold text-text-heading mb-4">Daily Completed Tasks</h3>
        <div className="text-center text-text-muted py-8">
          <p>No task completion data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-text-heading mb-4">Daily Completed Tasks</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
            <XAxis
              type="number"
              tick={{ fill: '#888', fontSize: 11 }}
              tickFormatter={(value) => `${value}`}
            />
            <YAxis
              dataKey="date"
              type="category"
              tick={{ fill: '#888', fontSize: 11 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              width={100}
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
            <Bar
              dataKey="completed"
              fill="#10b981"
              name="Completed"
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="created"
              fill="#3b82f6"
              name="Created"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}