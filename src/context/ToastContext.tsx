import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, options?: { type?: ToastType; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Componente de Toast individual
const Toast = ({ message, type, onClose }: { message: string, type: ToastType, onClose: () => void }) => {
  // Classes base para todos os toasts
  const baseClasses = 'w-full max-w-sm p-4 rounded-lg shadow-lg flex items-center justify-between animate-fade-in-down border';
  
  // Classes específicas para cada tipo de toast, com cores mais visíveis
  const typeClasses = {
    success: 'bg-green-600 border-green-700 text-white', // Fundo verde sólido, texto branco
    error: 'bg-red-600 border-red-700 text-white',     // Fundo vermelho sólido, texto branco
    info: 'bg-blue-600 border-blue-700 text-white',      // Fundo azul sólido, texto branco
  };

  // Ícones para cada tipo de toast
  const Icon = () => {
    switch (type) {
      case 'success': return <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
      case 'error': return <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
      default: return <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
    }
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <div className="flex items-center">
        <Icon />
        <span>{message}</span>
      </div>
      <button onClick={onClose} className="ml-4 text-white opacity-70 hover:opacity-100">&times;</button>
    </div>
  );
};

// Provider do Contexto
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, options?: { type?: ToastType; duration?: number }) => {
    const id = uuidv4();
    const type = options?.type || 'info';
    const duration = options?.duration || 5000; // Duração padrão de 5 segundos

    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-5 right-5 z-[100] w-full max-w-sm space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
