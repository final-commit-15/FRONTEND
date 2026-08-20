import React from 'react';
import { Agent } from '@/types/models';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface AgentCapabilitiesProps {
  agent: Agent;
}

export function AgentCapabilities({ agent }: AgentCapabilitiesProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Capabilities</h3>
      <div className="flex flex-wrap gap-2">
        {agent.capabilities.map((cap) => (
          <Badge key={cap} variant="info">{cap}</Badge>
        ))}
        {agent.capabilities.length === 0 && (
          <p className="text-base-500">No capabilities defined.</p>
        )}
      </div>
    </Card>
  );
}