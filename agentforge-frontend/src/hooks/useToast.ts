// src/hooks/useToast.ts

import { useCallback } from 'react';
import { useUiStore, Toast } from '@/store/uiStore';

export type ToastType = Toast['type'];

export function useToast() {
  const addToastStore = useUiStore((state) => state.addToast);
  const removeToastStore = useUiStore((state) => state.removeToast);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID();
      const duration = toast.duration ?? 4000;

      // ✅ Pass the full Toast with id
      addToastStore({
        id,
        duration,
        ...toast,
      });

      // Auto‑remove after duration
      setTimeout(() => removeToastStore(id), duration);
    },
    [addToastStore, removeToastStore]
  );

  return {
    addToast,
    removeToast: removeToastStore,
  };
}