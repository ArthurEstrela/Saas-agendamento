import { useState, useEffect } from 'react';
import { useAuth, messaging } from '../context/AuthContext';
import { onMessage } from 'firebase/messaging';
import Login from './Login';
import Dashboard from './Dashboard';

// Componente de notificação (Toast) para substituir o alert
const NotificationToast = ({ title, body, onClose }: { title: string; body: string; onClose: () => void }) => (
  <div className="fixed top-5 right-5 bg-gray-700 border border-yellow-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm animate-fade-in-down">
    <div className="flex items-start">
      <div className="ml-3 w-0 flex-1 pt-0.5">
        <p className="text-sm font-bold text-yellow-400">{title}</p>
        <p className="mt-1 text-sm text-gray-300">{body}</p>
      </div>
      <div className="ml-4 flex-shrink-0 flex">
        <button onClick={onClose} className="inline-flex text-gray-400 hover:text-gray-200">
          <span className="sr-only">Close</span>
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
);


const MainAppContent = () => {
  const { currentUser, loading, requestFCMToken } = useAuth();
  const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);

  // Efeito para solicitar permissão de notificação e obter o token FCM
  useEffect(() => {
    if (currentUser) {
      const requestToken = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            console.log('Permissão para notificação concedida.');
            await requestFCMToken();
          } else {
            console.log('Permissão para notificação negada.');
          }
        } catch (error) {
          console.error('Erro ao solicitar permissão de notificação:', error);
        }
      };
      requestToken();
    }
  }, [currentUser, requestFCMToken]);

  // Efeito para escutar mensagens do FCM quando o app está em primeiro plano
  useEffect(() => {
    if (currentUser) {
      // onMessage retorna uma função "unsubscribe" que usamos na limpeza do useEffect
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Mensagem recebida em primeiro plano: ', payload);
        const { title, body } = payload.notification || {};
        if (title && body) {
          setNotification({ title, body });
          // Auto-fecha a notificação após 5 segundos
          setTimeout(() => setNotification(null), 5000);
        }
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-yellow-500 text-xl">
        Carregando...
      </div>
    );
  }

  return (
    <>
      {notification && (
        <NotificationToast 
          title={notification.title} 
          body={notification.body} 
          onClose={() => setNotification(null)} 
        />
      )}
      {currentUser ? <Dashboard /> : <Login />}
    </>
  );
};

export default MainAppContent;
