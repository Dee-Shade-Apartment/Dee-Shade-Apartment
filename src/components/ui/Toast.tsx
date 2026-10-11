import { type ReactNode, useState } from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let toastIdCounter = 0;
let addToastFn: ((type: ToastType, message: string) => void) | null = null;

export function toast(type: ToastType, message: string) {
  if (addToastFn) addToastFn(type, message);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  if (!addToastFn) {
    addToastFn = (type: ToastType, message: string) => {
      const id = `toast-${++toastIdCounter}`;
      setToasts(prev => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    };
  }

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-lg animate-slide-in"
        >
          {icons[t.type]}
          <p className="text-sm text-ink-700">{t.message}</p>
          <button onClick={() => removeToast(t.id)} className="text-ink-300 hover:text-ink-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
