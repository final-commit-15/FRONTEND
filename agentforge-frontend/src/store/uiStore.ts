// src/store/uiStore.ts

import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
  duration?: number;
}

interface UIState {
  sidebarCollapsed: boolean;
  mobileOpen: boolean;
  toasts: Toast[];
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileOpen: (open: boolean) => void;
  // ✅ Now accepts full Toast (including id)
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  mobileOpen: false,
  toasts: [],
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileOpen: (open) => set({ mobileOpen: open }),
  // ✅ Use the passed id, don't generate a new one
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, toast],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));