import React from 'react';
import { useToast, ToastType } from '../../contexts/ToastContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
};

const borderStyles: Record<ToastType, string> = {
  success: 'border-emerald-500/20 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100',
  error: 'border-rose-500/20 bg-rose-50/90 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100',
  info: 'border-sky-500/20 bg-sky-50/90 dark:bg-sky-950/40 text-sky-900 dark:text-sky-100',
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-enter ${borderStyles[toast.type]}`}
        >
          {icons[toast.type]}
          <div className="flex-1 text-sm font-medium leading-snug">{toast.message}</div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
