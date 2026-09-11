// src/components/dashboard/AIActivitySummary.tsx

import { Bot, CheckCircle2, AlertCircle, Zap, TrendingUp } from 'lucide-react';

interface AIActivitySummary {
  total_runs: number;
  successful: number;
  failed: number;
  agents_active: number;
  last_run: string;
  summary: string;
  top_agents: { name: string; runs: number; success_rate: number }[];
}

interface AIActivitySummaryProps {
  data: AIActivitySummary;
}

export function AIActivitySummaryComponent({ data }: AIActivitySummaryProps) {
  const successRate = data.total_runs > 0 ? Math.round((data.successful / data.total_runs) * 100) : 0;

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-semibold text-text-heading">AI Agent Activity</h3>
          <p className="text-sm text-text-muted mt-1">Last 24 hours</p>
        </div>
        <div className="flex items-center gap-2 p-3 bg-brand-primary/10 rounded-xl">
          <Bot className="h-5 w-5 text-brand-primary" />
          <span className="text-sm font-medium text-brand-primary">
            {data.agents_active} Agents Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-text-heading">{data.total_runs}</div>
          <div className="text-xs text-text-muted mt-1">Total Runs</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-success-500">{data.successful}</div>
          <div className="text-xs text-text-muted mt-1">Successful</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-error-500">{data.failed}</div>
          <div className="text-xs text-text-muted mt-1">Failed</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-brand-primary">{successRate}%</div>
          <div className="text-xs text-text-muted mt-1">Success Rate</div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-text-heading">Top Performing Agents</h4>
        {data.top_agents && data.top_agents.length > 0 ? (
          <div className="space-y-3">
            {data.top_agents.slice(0, 5).map((agent, index) => (
              <div key={index} className="flex items-center justify-between p-3 card hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-medium text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-text-heading">{agent.name}</p>
                    <p className="text-xs text-text-muted">{agent.runs} runs</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-success-500 font-medium">{agent.success_rate}%</span>
                  <span className="text-text-muted">{agent.runs} runs</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-center py-4">No agent activity yet</p>
        )}
      </div>

      <div className="mt-6 p-4 bg-brand-primary/5 rounded-xl border border-brand-primary/10">
        <div className="flex items-start gap-3">
          <Bot className="h-5 w-5 text-brand-primary mt-0.5" />
          <div>
            <p className="font-medium text-brand-primary">AI Summary</p>
            <p className="text-sm text-text-muted mt-1">{data.summary}</p>
            <p className="text-xs text-text-muted mt-2">
              Last run: {new Date(data.last_run).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}