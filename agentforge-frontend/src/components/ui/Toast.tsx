import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

export function ToastProvider() {
  const { toasts, removeToast } = useUiStore();

  useEffect(() => {
    toasts.forEach((toast) => {
      const duration = toast.duration || 5000;
      const timer = setTimeout(() => removeToast(toast.id), duration);
      return () => clearTimeout(timer);
    });
  }, [toasts, removeToast]);

  return (
    <div className="fixed bottom-4 right-4 z-[200] space-y-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className="card p-4 flex items-start gap-3 shadow-glass animate-slide-up min-w-[300px]"
            role="alert"
          >
            <Icon
              size={20}
              className={
                toast.type === 'success'
                  ? 'text-success-500'
                  : toast.type === 'error'
                    ? 'text-error-500'
                    : toast.type === 'warning'
                      ? 'text-warning-500'
                      : 'text-info-500'
              }
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{toast.title}</p>
              {toast.description && <p className="mt-1 text-sm text-base-400">{toast.description}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-base-500 hover:text-white transition-colors"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}