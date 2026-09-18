// src/components/ai-providers/StageModelAssignment.tsx
// Stage-Level Model Assignment - configure which model/provider handles each pipeline stage

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Brain, Zap, Globe, Cpu, Settings, Save, RefreshCw, ArrowRight, ChevronDown } from 'lucide-react';
import { aiProvidersApi, ModelInfo } from '@/api/aiProviders';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Separator } from '@/components/ui/Separator';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ModelSelector } from './ModelSelector';

const STAGE_CONFIG = [
  { key: 'requirements', label: 'Requirements Analysis', icon: Brain, description: 'Extract requirements from brief' },
  { key: 'features', label: 'Feature Extraction', icon: Brain, description: 'Break down into features' },
  { key: 'stories', label: 'User Story Generation', icon: Brain, description: 'Generate user stories' },
  { key: 'tasks', label: 'Task Generation', icon: Zap, description: 'Segregate tasks and estimates' },
  { key: 'engineers', label: 'Engineer Assignment', icon: Globe, description: 'Match tasks to team members' },
  { key: 'sprint', label: 'Sprint Planning', icon: Cpu, description: 'Plan sprints with deadlines' },
  { key: 'debug', label: 'Debug / Architecture', icon: Cpu, description: 'Architecture decisions & debugging' },
  { key: 'monitoring', label: 'Monitoring Summary', icon: Brain, description: 'Generate monitoring summaries' },
  { key: 'embedding', label: 'Embeddings', icon: Globe, description: 'Vector embeddings for search' },
];

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  'google-ai': <Brain size={14} className="text-blue-500" />,
  'groq': <Zap size={14} className="text-green-500" />,
  'openrouter': <Globe size={14} className="text-purple-500" />,
  'opencode-zen': <Cpu size={14} className="text-orange-500" />,
};

const PROVIDER_LABELS: Record<string, string> = {
  'google-ai': 'Google AI Studio',
  'groq': 'Groq',
  'openrouter': 'OpenRouter',
  'opencode-zen': 'OpenCode Zen',
};

interface StageAssignment {
  stage: string;
  model: string;
  provider: string;
}

export function StageModelAssignment() {
  const queryClient = useQueryClient();
  const [assignments, setAssignments] = useState<Record<string, StageAssignment>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  // Fetch current stage models
  const { data: stageModels, refetch: refetchStageModels } = useQuery({
    queryKey: ['stage-models'],
    queryFn: async () => {
      const result: Record<string, StageAssignment> = {};
      for (const stage of STAGE_CONFIG) {
        try {
          const data = await aiProvidersApi.getStageModel(stage.key);
          result[stage.key] = {
            stage: stage.key,
            model: data.model,
            provider: data.provider,
          };
        } catch (e) {
          // Use defaults
        }
      }
      return result;
    },
    staleTime: 60000,
  });

  // Fetch available models for selectors
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

  // Load initial assignments
  useEffect(() => {
    if (stageModels) {
      setAssignments(stageModels);
    }
    setIsLoading(false);
  }, [stageModels]);

  // Save assignments mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, StageAssignment>) => {
      // In a real implementation, this would call a backend endpoint
      // For now, we just persist to localStorage and update the server
      localStorage.setItem('stage-model-assignments', JSON.stringify(data));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stage-models'] });
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

  const handleReset = async () => {
    setIsSaving(true);
    try {
      await refetchStageModels();
      if (stageModels) {
        setAssignments(stageModels);
      }
      localStorage.removeItem('stage-model-assignments');
    } finally {
      setIsSaving(false);
    }
  };

  const getModelsForStage = (stageKey: string) => {
    // Filter models suitable for this stage
    return allModels.filter(model => {
      const capabilities = model.capabilities;
      switch (stageKey) {
        case 'requirements':
        case 'features':
        case 'stories':
        case 'monitoring':
          return capabilities.includes('chat') || capabilities.includes('reasoning');
        case 'tasks':
        case 'engineers':
        case 'sprint':
          return capabilities.includes('chat') || capabilities.includes('reasoning') || capabilities.includes('code');
        case 'debug':
          return capabilities.includes('code') || capabilities.includes('reasoning');
        case 'embedding':
          return capabilities.includes('embedding');
        default:
          return true;
      }
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <RefreshCw size={24} className="mx-auto animate-spin text-brand-primary mb-2" />
        <p className="text-text-muted">Loading stage assignments...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-brand-primary" />
          <h3 className="font-semibold text-text-heading">Stage Model Assignment</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={isSaving}>
            <RefreshCw size={14} />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving} icon={isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} />
        </div>
      </div>

      <p className="text-sm text-text-muted">
        Configure which AI model handles each pipeline stage. Different stages benefit from different model capabilities.
      </p>

      <div className="space-y-3">
        {STAGE_CONFIG.map((stage) => {
          const Icon = stage.icon;
          const assignment = assignments[stage.key];
          const currentModel = allModels.find(m => m.id === assignment?.model);
          const stageModels = getModelsForStage(stage.key);

          return (
            <div
              key={stage.key}
              className={cn(
                'rounded-xl border transition-all',
                expandedStage === stage.key ? 'border-brand-primary/30 bg-brand-primary/5' : 'border-canvas-border'
              )}
            >
              {/* Stage Header */}
              <button
                onClick={() => setExpandedStage(expandedStage === stage.key ? null : stage.key)}
                className="w-full p-3 flex items-center gap-3 text-left"
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  expandedStage === stage.key ? 'bg-brand-primary/10' : 'bg-canvas-surface'
                )}>
                  <Icon size={16} className="text-brand-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-heading">{stage.label}</span>
                    {assignment && (
                      <Badge variant="outline" className="text-xs">
                        {PROVIDER_LABELS[assignment.provider] || assignment.provider}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">{stage.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  {assignment && currentModel && (
                    <div className="flex items-center gap-1.5 text-sm text-text-muted">
                      {PROVIDER_ICONS[assignment.provider]}
                      <span className="truncate max-w-[200px]">{currentModel.name}</span>
                    </div>
                  )}
                  <ChevronDown
                    size={16}
                    className={cn(
                      'text-text-muted transition-transform',
                      expandedStage === stage.key && 'rotate-180'
                    )}
                  />
                </div>
              </button>

              {/* Expanded Model Selector */}
              <AnimatePresence>
                {expandedStage === stage.key && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden px-3 pb-3"
                  >
                    <Separator className="my-2" />
                    <ModelSelector
                      selectedModel={assignment?.model}
                      onModelChange={(modelId, provider) => {
                        const model = allModels.find(m => m.id === modelId);
                        if (model) {
                          setAssignments(prev => ({
                            ...prev,
                            [stage.key]: { stage: stage.key, model: modelId, provider },
                          }));
                        }
                      }}
                      filterCapability={['chat', 'reasoning']}
                      showPricing={true}
                      showCapabilities={true}
                      placeholder={`Select model for ${stage.label}`}
                    />
                    <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
                      <span>Current: </span>
                      {assignment ? (
                        <>
                          {PROVIDER_ICONS[assignment.provider]}
                          <span className="font-medium">{currentModel?.name || assignment.model}</span>
                          <span className="text-text-muted">({PROVIDER_LABELS[assignment.provider] || assignment.provider})</span>
                        </>
                      ) : (
                        <span className="italic">Not configured (uses default)</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t border-canvas-border">
        <h4 className="text-sm font-medium text-text-heading mb-2">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Assign best reasoning models to all stages
              const newAssignments: Record<string, StageAssignment> = {};
              STAGE_CONFIG.forEach(stage => {
                const suitable = getModelsForStage(stage.key)
                  .filter(m => m.capabilities.includes('reasoning'))
                  .sort((a, b) => (b.capabilities.includes('reasoning') ? 1 : 0) - (a.capabilities.includes('reasoning') ? 1 : 0))[0];
                if (suitable) {
                  newAssignments[stage.key] = { stage: stage.key, model: suitable.id, provider: suitable.provider };
                }
              });
              setAssignments(newAssignments);
            }}
          >
            <Brain size={12} />
            Assign Reasoning Models
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Assign fastest/cheapest models
              const newAssignments: Record<string, StageAssignment> = {};
              STAGE_CONFIG.forEach(stage => {
                const suitable = getModelsForStage(stage.key)
                  .filter(m => m.is_free)
                  .sort((a, b) => a.pricing_input - b.pricing_input)[0];
                if (suitable) {
                  newAssignments[stage.key] = { stage: stage.key, model: suitable.id, provider: suitable.provider };
                }
              });
              setAssignments(newAssignments);
            }}
          >
            <Zap size={12} />
            Assign Free/Fast Models
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Assign by provider priority
              const providers = Object.keys(modelsByProvider);
              STAGE_CONFIG.forEach((stage, i) => {
                const provider = providers[i % providers.length];
                const model = modelsByProvider[provider]?.[0];
                if (model) {
                  setAssignments(prev => ({
                    ...prev,
                    [stage.key]: { stage: stage.key, model: model.id, provider: model.provider },
                  }));
                }
              });
            }}
          >
            <Globe size={12} />
            Distribute Across Providers
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Need motion import
import { motion, AnimatePresence } from 'framer-motion';