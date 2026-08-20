import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Pencil, Play, Trash2 } from 'lucide-react';
import { Agent } from '@/types/models';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/format';

interface AgentDetailHeaderProps {
  agent: Agent;
}

export function AgentDetailHeader({ agent }: AgentDetailHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-electric-500/20 to-violet-500/20 flex items-center justify-center">
          <Bot size={24} className="text-electric-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-base-500">{agent.type}</span>
            <span className="text-base-600">•</span>
            <StatusBadge status={agent.status} />
            <span className="text-base-600">•</span>
            <span className="text-sm text-base-500">Created {formatDate(agent.created_at)}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" icon={<Pencil size={16} />} onClick={() => navigate(`/agents/${agent.id}/edit`)}>
          Edit
        </Button>
        <Button icon={<Play size={16} />} onClick={() => navigate(`/agents/${agent.id}/execute`)}>
          Execute
        </Button>
        <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => {/* confirm delete */}}>
          Delete
        </Button>
      </div>
    </div>
  );
}