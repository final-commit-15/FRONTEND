import React from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

interface ChartCardProps {
  title: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function ChartCard({ title, isLoading, children }: ChartCardProps) {
  if (isLoading) return <Skeleton className="h-64" />;
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {children}
    </Card>
  );
}