// src/context/ProviderContext.tsx
// Global Provider Context for multi-provider AI management

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiProvidersApi, ProviderConfig, ModelInfo, ProviderHealth } from '@/api/aiProviders';
import { getStoredProvider, storeProvider, subscribeProviderChange } from '@/lib/providerSelection';

interface ProviderContextType {
  providers: ProviderConfig[];
  providerModels: Record<string, ModelInfo[]>;
  providerHealth: Record<string, ProviderHealth>;
  selectedProvider: string;
  setSelectedProvider: (provider: string) => void;
  refreshProviders: () => Promise<void>;
  refreshModels: () => Promise<void>;
  refreshHealth: () => Promise<void>;
  isLoading: boolean;
}

const ProviderContext = createContext<ProviderContextType | null>(null);

export function ProviderProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  // Persisted selection wins; backend default fills in on first run.
  const [selectedProvider, setSelectedProviderState] = useState<string>(() => getStoredProvider());

  const setSelectedProvider = useCallback((provider: string) => {
    setSelectedProviderState(provider);
    storeProvider(provider);
  }, []);
  
  // Fetch providers
  const { data: providersData, isLoading: providersLoading, refetch: refetchProviders } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: aiProvidersApi.listProviders,
    staleTime: 30000,
  });
  
  // Fetch models
  const { data: modelsData, isLoading: modelsLoading, refetch: refetchModels } = useQuery({
    queryKey: ['ai-providers-models'],
    queryFn: () => aiProvidersApi.listModels(),
    staleTime: 60000,
  });
  
  // Fetch health
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['ai-providers-health'],
    queryFn: aiProvidersApi.healthCheck,
    refetchInterval: 60000,
    staleTime: 30000,
  });
  
  // Set default provider (persisted selection wins over backend default).
  useEffect(() => {
    if (providersData?.default_provider && !selectedProvider && !getStoredProvider()) {
      setSelectedProvider(providersData.default_provider);
    }
  }, [providersData, selectedProvider, setSelectedProvider]);

  // Stay in sync when another switcher instance changes the selection.
  useEffect(() => subscribeProviderChange((p) => setSelectedProviderState(p)), []);
  
  // Update provider health
  const providerHealth: Record<string, ProviderHealth> = {};
  if (healthData) {
    Object.entries(healthData.providers).forEach(([key, value]) => {
      providerHealth[key] = value;
    });
  }
  
  // Flatten models
  const providerModels: Record<string, ModelInfo[]> = {};
  if (modelsData) {
    Object.entries(modelsData.models).forEach(([provider, models]) => {
      providerModels[provider] = models;
    });
  }
  
  const refreshProviders = useCallback(async () => {
    await refetchProviders();
    queryClient.invalidateQueries({ queryKey: ['ai-providers-health'] });
  }, [refetchProviders, queryClient]);
  
  const refreshModels = useCallback(async () => {
    await refetchModels();
  }, [refetchModels]);
  
  const refreshHealth = useCallback(async () => {
    await refetchHealth();
  }, [refetchHealth]);
  
  const isLoading = providersLoading || modelsLoading || healthLoading;
  
  const value: ProviderContextType = {
    providers: providersData?.providers || [],
    providerModels,
    providerHealth,
    selectedProvider,
    setSelectedProvider,
    refreshProviders,
    refreshModels,
    refreshHealth,
    isLoading,
  };
  
  return (
    <ProviderContext.Provider value={value}>
      {children}
    </ProviderContext.Provider>
  );
}

export function useProviders() {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error('useProviders must be used within a ProviderProvider');
  }
  return context;
}