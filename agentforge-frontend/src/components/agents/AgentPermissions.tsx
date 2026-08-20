import React from 'react';
import { Agent } from '@/types/models';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck } from 'lucide-react';

interface AgentPermissionsProps {
  agent: Agent;
}

export function AgentPermissions({ agent }: AgentPermissionsProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <ShieldCheck size={18} className="text-violet-400" /> Permissions
      </h3>
      <div className="flex flex-wrap gap-2">
        {agent.permissions?.map((permission) => (
          <Badge key={permission} variant="success">{permission}</Badge>
        ))}
        {!agent.permissions?.length && <p className="text-base-500">No permissions assigned.</p>}
      </div>
    </Card>
  );
}