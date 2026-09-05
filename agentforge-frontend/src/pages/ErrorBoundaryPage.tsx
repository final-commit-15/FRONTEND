// src/pages/ErrorBoundaryPage.tsx
import { useRouteError } from 'react-router-dom';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card, CardContent } from '@/components/ui/Card';

export function ErrorBoundaryPage() {
  const error = useRouteError();
  return (
    <div className="flex items-center justify-center h-screen p-4">
      <Card>
        <CardContent className="pt-8 pb-8 px-8 max-w-md">
          <ErrorState
            title="Something went wrong"
            description={error instanceof Error ? error.message : 'An unexpected error occurred.'}
          />
        </CardContent>
      </Card>
    </div>
  );
}