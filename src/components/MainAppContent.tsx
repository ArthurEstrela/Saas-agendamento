// src/components/MainAppContent.tsx
import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { messaging } from "../firebase/config";
import { onMessage } from "firebase/messaging";
import Dashboard from "../pages/DashboardPage";
import Footer from "./Footer";

// Componente de notificação (Toast) para substituir o alert
const NotificationToast = ({
  title,
  body,
  onClose,
}: {
  title: string;
  body: string;
  onClose: () => void;
}) => (
  <div className="fixed top-5 right-5 bg-gray-700 border border-yellow-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm animate-fade-in-down">
    <div className="flex items-start">
      <div className="ml-3 w-0 flex-1 pt-0.5">
        <p className="text-sm font-bold text-yellow-400">{title}</p>
        <p className="mt-1 text-sm text-gray-300">{body}</p>
      </div>
      <div className="ml-4 flex-shrink-0 flex">
        <button
          onClick={onClose}
          className="inline-flex text-gray-400 hover:text-gray-200"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
);

const MainAppContent = () => {
  const { user, requestFCMToken } = useAuthStore();
  const [notification, setNotification] = useState<{
    title: string;
    body: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      const requestToken = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            await requestFCMToken();
          }
        } catch (error) {
          console.error("Erro ao solicitar permissão de notificação:", error);
        }
      };
      requestToken();
    }
  }, [user, requestFCMToken]);

  useEffect(() => {
    if (user) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("Mensagem recebida em primeiro plano: ", payload);
        const { title, body } = payload.notification || {};
        if (title && body) {
          setNotification({ title, body });
          setTimeout(() => setNotification(null), 5000);
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      {notification && (
        <NotificationToast
          title={notification.title}
          body={notification.body}
          onClose={() => setNotification(null)}
        />
      )}
      <main className="flex-grow">
        <Dashboard />
      </main>
      <Footer />
    </div>
  );
};

export default MainAppContent;
