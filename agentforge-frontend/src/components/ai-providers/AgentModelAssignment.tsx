// src/components/ai-providers/AgentModelAssignment.tsx
// Agent Model Assignment - configure which model each AI agent uses

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Bot, Save, RefreshCw, Brain, Zap, Code, FileText, GitBranch, Terminal, Search, Globe, Settings, ChevronDown } from 'lucide-react';
import { aiProvidersApi, ModelInfo } from '@/api/aiProviders';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Separator } from '@/components/ui/Separator';
import { ModelSelector } from './ModelSelector';

const AGENT_ROLES = [
  { key: 'architect', label: 'System Architect', icon: Brain, description: 'High-level architecture & design decisions', capabilities: ['reasoning', 'code'] },
  { key: 'backend', label: 'Backend Engineer', icon: Code, description: 'API development, database design, server logic', capabilities: ['code', 'reasoning'] },
  { key: 'frontend', label: 'Frontend Engineer', icon: FileText, description: 'UI implementation, state management, styling', capabilities: ['code', 'reasoning'] },
  { key: 'devops', label: 'DevOps Engineer', icon: Terminal, description: 'CI/CD, infrastructure, deployment', capabilities: ['code', 'reasoning'] },
  { key: 'qa', label: 'QA Engineer', icon: Search, description: 'Test planning, automation, quality gates', capabilities: ['reasoning', 'code'] },
  { key: 'product', label: 'Product Manager', icon: GitBranch, description: 'Requirements, prioritization, roadmap', capabilities: ['reasoning', 'chat'] },
];

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  'google-ai': <Brain size={12} className="text-blue-500" />,
  'groq': <Zap size={12} className="text-green-500" />,
  'openrouter': <Globe size={12} className="text-purple-500" />,
  'opencode-zen': <Terminal size={12} className="text-orange-500" />,
};

const PROVIDER_LABELS: Record<string, string> = {
  'google-ai': 'Google AI Studio',
  'groq': 'Groq',
  'openrouter': 'OpenRouter',
  'opencode-zen': 'OpenCode Zen',
};

interface AgentModelAssignment {
  agent: string;
  model: string;
  provider: string;
  temperature?: number;
  systemPrompt?: string;
}

export function AgentModelAssignment() {
  const queryClient = useQueryClient();
  const [assignments, setAssignments] = useState<Record<string, AgentModelAssignment>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);

  // Fetch available models
  const { data: modelsData } = useQuery({
    queryKey: ['ai-models'],
    queryFn: () => aiProvidersApi.listModels(),
    staleTime: 60000,
  });

  // Flatten all models
  const allModels: Array<ModelInfo & { providerName: string }> = [];
  if (modelsData) {
    Object.entries(modelsData.models).forEach(([provider, models]) => {
      models.forEach(model => {
        allModels.push({ ...model, providerName: provider });
      });
    });
  }

  // Group by provider
  const modelsByProvider = allModels.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, Array<ModelInfo & { providerName: string }>>);

  // Load saved assignments from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('agent-model-assignments');
    if (saved) {
      try {
        setAssignments(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse agent assignments', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save assignments
  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, AgentModelAssignment>) => {
      localStorage.setItem('agent-model-assignments', JSON.stringify(data));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-model-assignments'] });
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync(assignments);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('agent-model-assignments');
    setAssignments({});
  };

  const getModelsForAgent = (agentKey: string) => {
    const role = AGENT_ROLES.find(r => r.key === agentKey);
    if (!role) return allModels;

    return allModels.filter(model => {
      return role.capabilities.some(cap => model.capabilities.includes(cap));
    });
  };

  const getCurrentModel = (agentKey: string) => {
    const assignment = assignments[agentKey];
    if (!assignment) return null;
    return allModels.find(m => m.id === assignment.model);
  };

  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <RefreshCw size={24} className="mx-auto animate-spin text-brand-primary mb-2" />
        <p className="text-text-muted">Loading agent assignments...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-brand-primary" />
          <h3 className="font-semibold text-text-heading">Agent Model Assignment</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={isSaving}>
            <RefreshCw size={14} />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving} icon={isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} />
        </div>
      </div>

      <p className="text-sm text-text-muted">
        Configure which AI model each agent role uses. Different roles benefit from different model capabilities.
      </p>

      <div className="space-y-3">
        {AGENT_ROLES.map((role) => {
          const Icon = role.icon;
          const assignment = assignments[role.key];
          const currentModel = getCurrentModel(role.key);
          const suitableModels = getModelsForAgent(role.key);

          return (
            <div
              key={role.key}
              className="rounded-xl border border-canvas-border overflow-hidden"
            >
              {/* Agent Header */}
              <div className="p-3 flex items-center gap-3 bg-canvas-surface/50">
                <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                  <Icon size={16} className="text-brand-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-heading">{role.label}</span>
                    {assignment && (
                      <Badge variant="outline" className="text-xs">
                        {PROVIDER_LABELS[assignment.provider] || assignment.provider}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">{role.description}</p>
                </div>

                {assignment && currentModel && (
                  <div className="flex items-center gap-1.5 text-sm text-text-muted">
                    {PROVIDER_ICONS[assignment.provider]}
                    <span className="truncate max-w-[200px]">{currentModel.name}</span>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingAgent(editingAgent === role.key ? null : role.key)}
                  className="ml-2"
                >
                  {editingAgent === role.key ? <Search size={14} /> : <Settings size={14} />}
                </Button>
              </div>

              {/* Expanded Configuration */}
              <AnimatePresence>
                {editingAgent === role.key && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden px-3 pb-3 border-t border-canvas-border"
                  >
                    <Separator className="my-2" />
                    
                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Model Selector */}
                      <div>
                        <Label className="text-xs font-medium text-text-muted mb-1">Model</Label>
                        <ModelSelector
                          selectedModel={assignment?.model}
                          onModelChange={(modelId, provider) => {
                            const model = allModels.find(m => m.id === modelId);
                            if (model) {
                              setAssignments(prev => ({
                                ...prev,
                                [role.key]: { 
                                  ...prev[role.key], 
                                  agent: role.key, 
                                  model: modelId, 
                                  provider,
                                  temperature: prev[role.key]?.temperature || 0.7,
                                },
                              }));
                            }
                          }}
                          filterCapability={role.capabilities}
                          showPricing={true}
                          showCapabilities={true}
                          placeholder={`Select model for ${role.label}`}
                        />
                      </div>

                      {/* Temperature */}
                      <div>
                        <Label className="text-xs font-medium text-text-muted mb-1">Temperature</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                          value={assignment?.temperature || 0.7}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              setAssignments(prev => ({
                                ...prev,
                                [role.key]: { ...prev[role.key], temperature: val },
                              }));
                            }
                          }}
                          className="text-sm"
                        />
                        <p className="text-xs text-text-muted mt-1">
                          Lower = more focused, Higher = more creative
                        </p>
                      </div>
                    </div>

                    {/* System Prompt */}
                    <div className="mt-3">
                      <Label className="text-xs font-medium text-text-muted mb-1">System Prompt (optional)</Label>
                      <textarea
                        value={assignment?.systemPrompt || ''}
                        onChange={(e) => {
                          setAssignments(prev => ({
                            ...prev,
                            [role.key]: { ...prev[role.key], systemPrompt: e.target.value },
                          }));
                        }}
                        rows={3}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-canvas-border bg-canvas-surface focus:border-brand-primary focus:outline-none"
                        placeholder="Custom system prompt for this agent..."
                      />
                    </div>

                    {/* Quick Model Suggestions */}
                    <div className="mt-3">
                      <Label className="text-xs font-medium text-text-muted mb-2">Quick Select</Label>
                      <div className="flex flex-wrap gap-2">
                        {suitableModels.slice(0, 5).map(model => (
                          <Button
                            key={model.id}
                            variant={assignment?.model === model.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setAssignments(prev => ({
                                ...prev,
                                [role.key]: { 
                                  agent: role.key, 
                                  model: model.id, 
                                  provider: model.provider,
                                  temperature: prev[role.key]?.temperature || 0.7,
                                },
                              }));
                            }}
                          >
                            {PROVIDER_ICONS[model.provider]}
                            <span className="truncate max-w-[120px]">{model.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Agent Capability Matrix */}
      <div className="pt-4 border-t border-canvas-border">
        <h4 className="text-sm font-medium text-text-heading mb-3">Capability Matrix</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-canvas-border">
                <th className="pb-2 pr-4">Agent</th>
                <th className="pb-2 pr-4">Model</th>
                <th className="pb-2 pr-4">Provider</th>
                <th className="pb-2 pr-4">Temp</th>
                <th className="pb-2 pr-4">Capabilities</th>
              </tr>
            </thead>
            <tbody>
              {AGENT_ROLES.map((role) => {
                const assignment = assignments[role.key];
                const model = getCurrentModel(role.key);
                const RoleIcon = role.icon;
                return (
                  <tr key={role.key} className="border-b border-canvas-border/50">
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <RoleIcon size={12} className="text-brand-primary" />
                        <span className="font-medium">{role.label}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      {model ? model.name : <span className="text-text-muted italic">Default</span>}
                    </td>
                    <td className="py-2 pr-4">
                      {assignment && (
                        <span className="flex items-center gap-1">
                          {PROVIDER_ICONS[assignment.provider]}
                          <span>{PROVIDER_LABELS[assignment.provider] || assignment.provider}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {assignment?.temperature !== undefined ? assignment.temperature : '—'}
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {role.capabilities.map(cap => (
                          <Badge key={cap} variant="outline" className="text-[10px]">
                            {cap.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

// Need imports
import { motion, AnimatePresence } from 'framer-motion';