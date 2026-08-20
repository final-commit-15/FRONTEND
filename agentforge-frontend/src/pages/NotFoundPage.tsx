import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-white">404</h1>
      <p className="mt-4 text-xl text-base-400">Page not found</p>
      <p className="mt-2 text-base-500">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/dashboard" className="mt-6">
        <Button icon={<Home size={18} />}>Go to Dashboard</Button>
      </Link>
    </div>
  );
}