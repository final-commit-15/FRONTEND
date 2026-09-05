import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <Card>
        <CardContent className="pt-12 pb-12 px-8">
          <h1 className="font-heading text-6xl font-bold text-brand-primary">404</h1>
          <p className="mt-4 text-xl text-text-heading">Page not found</p>
          <p className="mt-2 text-text-muted">The page you're looking for doesn't exist or has been moved.</p>
          <Link to="/dashboard" className="mt-6 inline-block">
            <Button icon={<Home size={18} />}>Go to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}