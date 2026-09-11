// src/components/dashboard/FeatureProgressPie.tsx

import { cn } from '../../lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CheckCircle2, AlertCircle, Clock, Archive, Zap } from 'lucide-react';

interface FeatureStatusData {
  name: string;
  value: number;
  color?: string;
  icon?: React.ElementType;
}

interface FeatureProgressPieProps {
  data: FeatureStatusData[];
  title?: string;
  height?: number;
}

const statusIcons = {
  completed: CheckCircle2,
  in_progress: AlertCircle,
  in_review: Clock,
  planned: Zap,
  archived: Archive,
};

export function FeatureProgressPie({ data, title = 'Features by Status', height = 300 }: FeatureProgressPieProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="font-semibold text-text-heading mb-4">Features by Status</h3>
        <div className="text-center text-text-muted py-8">
          <p>No feature data available</p>
        </div>
      </div>
    );
  }

  const COLORS = [
    '#10b981', // completed - green
    '#3b82f6', // in_progress - blue
    '#8b5cf6', // in_review - purple
    '#6366f1', // planned - indigo
    '#6b7280', // archived - gray
  ];

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-text-heading mb-4">{title}</h3>
      <div className="flex gap-8">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, value, percent }) => {
                  const p = percent ?? 0;
                  return `${name}: ${value} (${(p * 100).toFixed(0)}%)`;
                }}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e1e1e',
                  border: '1px solid #2d2d2d',
                  borderRadius: '8px',
                }}
                formatter={(value: any, name: any) => [
                  `${(value ?? 0)} features`,
                  name ?? ''
                ] as [string, string]}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                iconType="circle"
                wrapperStyle={{ paddingTop: 20 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-64">
          <div className="space-y-3">
            {data.map((entry, index) => {
              const iconName = entry.name.toLowerCase().replace(' ', '_');
              const IconComponent = statusIcons[iconName as keyof typeof statusIcons] || Zap;
              return (
                <div key={entry.name} className="flex items-center gap-3 p-3 card hover:shadow-md transition-shadow">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}
                  >
                    <IconComponent 
                      className="h-5 w-5" 
                      style={{ color: COLORS[index % COLORS.length] }} 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-heading truncate">{entry.name}</p>
                    <p className="text-sm text-text-muted">{entry.value} features</p>
                  </div>
                  <span className="text-lg font-bold text-text-heading">
                    {((entry.value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}