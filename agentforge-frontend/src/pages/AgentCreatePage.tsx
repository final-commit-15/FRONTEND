// src/pages/AgentCreatePage.tsx

import React from 'react';
import { AgentForm } from '@/components/agents/AgentForm';
import { PageHeader } from '@/components/layout/PageHeader';

export function AgentCreatePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Create Agent" description="Configure a new AI agent" />
      <AgentForm mode="create" />
    </div>
  );
}