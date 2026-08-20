// src/pages/ErrorBoundaryPage.tsx
import { useRouteError } from 'react-router-dom';
import { ErrorState } from '@/components/ui/ErrorState';

export function ErrorBoundaryPage() {
  const error = useRouteError();
  return (
    <div className="flex items-center justify-center h-screen p-4">
      <ErrorState
        title="Something went wrong"
        description={error instanceof Error ? error.message : 'An unexpected error occurred.'}
      />
    </div>
  );
}