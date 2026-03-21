'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
  success: { icon: CheckCircle, cls: 'text-green-400', bar: 'bg-green-500' },
  error:   { icon: XCircle,     cls: 'text-red-400',   bar: 'bg-red-500' },
  warning: { icon: AlertTriangle, cls: 'text-yellow-400', bar: 'bg-yellow-500' },
  info:    { icon: Info,         cls: 'text-blue-400',  bar: 'bg-blue-500' },
};

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  const { icon: Icon, cls, bar } = ICONS[toast.type] || ICONS.info;

  useEffect(() => {
    // mount animation
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`relative flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 shadow-2xl w-80 overflow-hidden transition-all duration-300 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      }`}
    >
      <Icon size={18} className={`flex-shrink-0 mt-0.5 ${cls}`} />
      <div className="flex-1 min-w-0">
        {toast.title && <p className="text-white text-sm font-medium">{toast.title}</p>}
        <p className="text-gray-400 text-xs mt-0.5">{toast.message}</p>
      </div>
      <button onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
        className="text-gray-500 hover:text-white flex-shrink-0 transition-colors">
        <X size={14} />
      </button>
      {/* progress bar */}
      <div className={`absolute bottom-0 left-0 h-0.5 ${bar} animate-shrink`}
        style={{ animationDuration: `${toast.duration || 3500}ms` }} />
    </div>
  );
}

export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
