// src/pages/TaskCreatePage.tsx

import { useNavigate } from 'react-router-dom';
import { TaskForm } from '@/components/tasks/TaskForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export function TaskCreatePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Create Task"
        description="Define a new task for your agents"
      />
      <TaskForm mode="create" />
    </div>
  );
}