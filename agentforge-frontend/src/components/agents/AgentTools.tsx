import React from 'react';
import { Agent } from '@/types/models';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Wrench } from 'lucide-react';

interface AgentToolsProps {
  agent: Agent;
}

export function AgentTools({ agent }: AgentToolsProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Wrench size={18} className="text-electric-400" /> Tools
      </h3>
      <div className="flex flex-wrap gap-2">
        {agent.tools?.map((tool) => (
          <Badge key={tool} variant="neutral">{tool}</Badge>
        ))}
        {!agent.tools?.length && <p className="text-base-500">No tools assigned.</p>}
      </div>
    </Card>
  );
}