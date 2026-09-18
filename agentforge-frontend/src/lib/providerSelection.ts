// src/lib/providerSelection.ts
// Single source of truth for the user's selected AI provider.
//
// Persists to localStorage and broadcasts a window event so every switcher
// instance (ProviderSwitcher, QuickProviderSelector, settings) stays in sync
// within the same tab. Storage events alone only fire across tabs.

export const PROVIDER_STORAGE_KEY = 'agentforge.provider.selected';
export const PROVIDER_CHANGED_EVENT = 'agentforge:provider-changed';

export function getStoredProvider(): string {
  try {
    return window.localStorage.getItem(PROVIDER_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function storeProvider(providerId: string): void {
  try {
    if (providerId) window.localStorage.setItem(PROVIDER_STORAGE_KEY, providerId);
    else window.localStorage.removeItem(PROVIDER_STORAGE_KEY);
  } catch {
    /* storage unavailable — selection simply won't survive refresh */
  }
  try {
    window.dispatchEvent(
      new CustomEvent<string>(PROVIDER_CHANGED_EVENT, { detail: providerId }),
    );
  } catch {
    /* ignore */
  }
}

export function subscribeProviderChange(listener: (providerId: string) => void): () => void {
  const handler = (e: Event) => {
    listener((e as CustomEvent<string>).detail ?? '');
  };
  window.addEventListener(PROVIDER_CHANGED_EVENT, handler);
  return () => window.removeEventListener(PROVIDER_CHANGED_EVENT, handler);
}
