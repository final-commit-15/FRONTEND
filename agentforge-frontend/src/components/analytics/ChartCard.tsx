import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

interface ChartCardProps {
  title: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function ChartCard({ title, isLoading, children }: ChartCardProps) {
  if (isLoading) return <Skeleton variant="card" className="h-64" />;
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <h3 className="font-heading text-lg font-semibold text-text-heading">{title}</h3>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}