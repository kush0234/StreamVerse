'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import ToastContainer from '@/components/admin/Toast';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message, type = 'info', title = '', duration = 3500) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type, title, duration }]);
  }, []);

  // Convenience methods
  toast.success = (message, title = 'Success') => toast(message, 'success', title);
  toast.error   = (message, title = 'Error')   => toast(message, 'error',   title);
  toast.warning = (message, title = 'Warning') => toast(message, 'warning', title);
  toast.info    = (message, title = '')        => toast(message, 'info',    title);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
