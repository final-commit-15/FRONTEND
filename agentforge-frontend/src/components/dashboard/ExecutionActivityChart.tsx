import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsApi } from '../../api/analytics';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';

export function ExecutionActivityChart() {
  const [range, setRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['execution-activity', range],
    queryFn: () => analyticsApi.getExecutionActivity(range),
    refetchInterval: 60000,
  });

  const chartData = Array.isArray(data) ? data : [];

  if (isLoading) return <Skeleton variant="card" className="h-[380px]" />;
  if (error) {
    return (
      <ErrorState
        title="Failed to load execution activity"
        description={error instanceof Error ? error.message : 'Unknown error'}
        onRetry={refetch}
      />
    );
  }

  const tooltipFormatter = (value: unknown): [string, string] => [
    typeof value === 'number' ? value.toLocaleString() : '0',
    'Executions',
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-heading text-lg font-semibold text-text-heading">Execution Activity</h3>
            <p className="text-sm text-text-body">Number of executions over time</p>
          </div>
          <Tabs defaultValue={range} onValueChange={(v: string) => setRange(v as '24h' | '7d' | '30d' | '90d')}>
            <TabsList className="bg-canvas-surface border-canvas-border p-1">
              {(['24h', '7d', '30d', '90d'] as const).map((r) => (
                <TabsTrigger key={r} value={r} className="px-3 py-1.5 text-xs font-medium">
                  {r}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="executionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0084FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0084FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="timestamp"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.70)',
                  borderRadius: '0.75rem',
                  color: '#171717',
                  fontSize: '0.875rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                }}
                labelStyle={{ color: '#6B7280' }}
                formatter={tooltipFormatter as any}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#0084FF"
                strokeWidth={2}
                fill="url(#executionGradient)"
                activeDot={{ r: 4, fill: '#0084FF', strokeWidth: 2, stroke: '#FFFFFF' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}