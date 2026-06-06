import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const icons = {
    success: <CheckCircle size={18} color="#10B981" />,
    error: <XCircle size={18} color="#EF4444" />,
    info: <Info size={18} color="#06B6D4" />,
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} role="alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {icons[t.type]}
              {t.message}
            </div>
            <div className="toast-progress" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
