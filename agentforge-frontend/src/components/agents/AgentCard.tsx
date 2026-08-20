// src/components/agents/AgentCard.tsx
import { Link } from 'react-router-dom';
import { Bot, MoreVertical, Play, Pause, Trash2, Edit, Eye, Activity } from 'lucide-react';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { formatRelativeTime, formatPercent } from '@/lib/format';
import { Agent } from '@/types/models';

interface AgentCardProps {
  agent: Agent;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}

export function AgentCard({ agent, onToggle, onDelete }: AgentCardProps) {
  return (
    <div className="card group hover:border-base-700 p-5 cursor-pointer" onClick={() => {/* navigate to detail */}}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-electric-500/20 to-violet-500/20 flex items-center justify-center">
            <Bot size={20} className="text-electric-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{agent.name}</h3>
            <p className="text-sm text-base-500">{agent.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={agent.status} />
          <Dropdown
            trigger={
              <button className="p-1.5 rounded-lg text-base-500 hover:text-white hover:bg-base-800 transition-colors">
                <MoreVertical size={16} />
              </button>
            }
          >
            <div className="w-40 p-1">
              <Link to={`/agents/${agent.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-base-300 hover:bg-base-800 rounded-lg">
                <Eye size={16} /> View
              </Link>
              <Link to={`/agents/${agent.id}/edit`} className="flex items-center gap-2 px-3 py-2 text-sm text-base-300 hover:bg-base-800 rounded-lg">
                <Edit size={16} /> Edit
              </Link>
              <button
                onClick={(e) => { e.stopPropagation(); onToggle(agent.status !== 'active'); }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-base-300 hover:bg-base-800 rounded-lg w-full text-left"
              >
                {agent.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                {agent.status === 'active' ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-error-500 hover:bg-error-700/10 rounded-lg w-full text-left"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </Dropdown>
        </div>
      </div>
      
      <p className="mt-4 text-sm text-base-400 line-clamp-2">{agent.description}</p>
      
      <div className="mt-4 flex flex-wrap gap-2">
        {agent.capabilities?.slice(0, 3).map((cap) => (
          <span key={cap} className="px-2 py-1 text-xs font-medium bg-base-800 rounded-md text-base-300">
            {cap}
          </span>
        ))}
        {agent.capabilities?.length > 3 && (
          <span className="px-2 py-1 text-xs font-medium bg-base-800 rounded-md text-base-500">
            +{agent.capabilities.length - 3}
          </span>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-base-800 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-base-500">Executions: <span className="text-white font-medium">{agent.execution_count}</span></span>
          <span className="text-base-500">Success: <span className="text-success-500 font-medium">{formatPercent(agent.success_rate)}</span></span>
        </div>
        <span className="text-base-500 text-xs">{formatRelativeTime(agent.last_execution)}</span>
      </div>
    </div>
  );
}