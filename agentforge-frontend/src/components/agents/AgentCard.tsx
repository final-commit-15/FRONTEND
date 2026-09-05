// src/components/agents/AgentCard.tsx
import { Link } from 'react-router-dom';
import { Bot, MoreVertical, Play, Pause, Trash2, Edit, Eye, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { formatRelativeTime, formatPercent } from '@/lib/format';
import { Agent } from '@/types/models';
import { Card } from '@/components/ui/Card';

interface AgentCardProps {
  agent: Agent;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}

export function AgentCard({ agent, onToggle, onDelete }: AgentCardProps) {
  const isActive = agent.status === 'active';

  return (
    <Card className="card-hover p-5 h-full" onClick={() => {}}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <Bot size={22} className="text-brand-primary" />
          </div>
          <div>
            <Link to={`/agents/${agent.id}`} className="font-semibold text-text-heading hover:text-brand-primary transition-colors">
              {agent.name}
            </Link>
            <p className="text-sm text-text-muted">{agent.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isActive ? 'success' : isActive === false ? 'neutral' : 'warning'}>{agent.status}</Badge>
          <Dropdown
            trigger={
              <button className="p-2 rounded-lg text-text-muted hover:text-text-heading hover:bg-canvas-surface transition-colors">
                <MoreVertical size={16} />
              </button>
            }
          >
            <div className="w-44 p-1">
              <DropdownItem asChild>
                <Link to={`/agents/${agent.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-text-body hover:bg-canvas-surface rounded-lg w-full">
                  <Eye size={16} /> View
                </Link>
              </DropdownItem>
              <DropdownItem asChild>
                <Link to={`/agents/${agent.id}/edit`} className="flex items-center gap-2 px-3 py-2 text-sm text-text-body hover:bg-canvas-surface rounded-lg w-full">
                  <Edit size={16} /> Edit
                </Link>
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem
                onClick={(e) => { e.stopPropagation(); onToggle(!isActive); }}
                icon={isActive ? <Pause size={16} /> : <Play size={16} />}
              >
                {isActive ? 'Disable' : 'Enable'}
              </DropdownItem>
              <DropdownItem destructive onClick={(e) => { e.stopPropagation(); onDelete(); }} icon={<Trash2 size={16} />}>
                Delete
              </DropdownItem>
            </div>
          </Dropdown>
        </div>
      </div>

      <p className="mt-4 text-sm text-text-muted line-clamp-2">{agent.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {agent.capabilities?.slice(0, 3).map((cap) => (
          <Badge key={cap} variant="neutral" className="text-xs">{cap}</Badge>
        ))}
        {agent.capabilities && agent.capabilities.length > 3 && (
          <Badge variant="neutral" className="text-xs">+{agent.capabilities.length - 3}</Badge>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-canvas-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-text-muted">Executions: <span className="font-mono font-medium text-text-heading">{agent.execution_count}</span></span>
          <span className="text-text-muted">Success: <span className="font-mono font-medium text-success-600">{formatPercent(agent.success_rate)}</span></span>
        </div>
        <span className="text-text-muted text-xs">{formatRelativeTime(agent.last_execution)}</span>
      </div>
    </Card>
  );
}