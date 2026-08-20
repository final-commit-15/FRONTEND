import React from 'react';
import { Agent } from '@/types/models';
import { Card } from '@/components/ui/Card';
import {
  formatNumber,
  formatPercent,
  formatDuration,
  formatRelativeTime,
  formatDate,          // <-- added
} from '@/lib/format';

interface AgentOverviewProps {
  agent: Agent;
}

export function AgentOverview({ agent }: AgentOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-sm text-base-500">Type</dt>
            <dd className="text-sm text-white">{agent.type}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-base-500">Status</dt>
            <dd className="text-sm text-white">{agent.status}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-base-500">Created</dt>
            <dd className="text-sm text-white">{formatDate(agent.created_at)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-base-500">Last Updated</dt>
            <dd className="text-sm text-white">{formatDate(agent.updated_at)}</dd>
          </div>
        </dl>
      </Card>
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-sm text-base-500">Total Executions</dt>
            <dd className="text-sm text-white">{formatNumber(agent.execution_count)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-base-500">Success Rate</dt>
            <dd className="text-sm text-success-500">{formatPercent(agent.success_rate)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-base-500">Avg Duration</dt>
            <dd className="text-sm text-white">{formatDuration(agent.avg_duration)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-base-500">Last Execution</dt>
            <dd className="text-sm text-white">{formatRelativeTime(agent.last_execution)}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}