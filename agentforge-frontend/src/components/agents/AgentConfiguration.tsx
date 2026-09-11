import React from 'react';
import { Agent } from '@/types/models';
import { Card } from '@/components/ui/Card';

interface AgentConfigurationProps {
  agent: Agent;
}

export function AgentConfiguration({ agent }: AgentConfigurationProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-text-heading mb-4">Configuration</h3>
      {agent.configuration && Object.keys(agent.configuration).length > 0 ? (
        <pre className="bg-bg-tertiary p-4 rounded-lg text-sm text-text-body overflow-x-auto border border-canvas-border">
          {JSON.stringify(agent.configuration, null, 2)}
        </pre>
      ) : (
        <p className="text-text-muted">No custom configuration.</p>
      )}
    </Card>
  );
}