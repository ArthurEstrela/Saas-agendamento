import React, { useEffect } from 'react';
import { Bell, Clock, Trash2, Loader2, Inbox, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationsStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// Card individual para cada notificação com animações e interações
const NotificationCard = ({ notification, onMarkAsRead, onDelete }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
    className={`p-4 rounded-lg flex items-start gap-4 border-l-4 transition-all duration-300 transform hover:scale-[1.02] ${
      notification.isRead
        ? 'bg-gray-800/50 border-gray-700'
        : 'bg-amber-900/20 border-amber-500'
    }`}
  >
    <div className="flex-shrink-0 pt-1">
      <Bell
        className={`h-6 w-6 ${
          notification.isRead ? 'text-gray-500' : 'text-amber-400'
        }`}
      />
    </div>
    <div className="flex-grow">
      <p
        className={`font-semibold ${
          notification.isRead ? 'text-gray-400' : 'text-white'
        }`}
      >
        {notification.title}
      </p>
      <p className="text-sm text-gray-300">{notification.message}</p>
      <div className="flex items-center text-xs text-gray-500 mt-2">
        <Clock className="h-3 w-3 mr-1.5" />
        <span>
          {notification.createdAt
            ? formatDistanceToNow(new Date(notification.createdAt.seconds * 1000), {
                addSuffix: true,
                locale: ptBR,
              })
            : 'agora'}
        </span>
      </div>
    </div>
    <div className="flex flex-col gap-2 items-center">
      {!notification.isRead && (
         <button
          onClick={() => onMarkAsRead(notification.id)}
          className="p-1 text-amber-400 hover:text-amber-200 transition-colors"
          title="Marcar como lida"
        >
          <CheckCircle className="h-5 w-5" />
        </button>
      )}
      <button
        onClick={() => onDelete(notification.id)}
        className="p-1 text-gray-500 hover:text-red-500 transition-colors"
        title="Excluir"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  </motion.div>
);

// Componente principal que orquestra a exibição
export const Notifications = () => {
  const { user } = useAuthStore();
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    clearNotifications,
  } = useNotificationStore();

  useEffect(() => {
    if (user?.uid) {
      fetchNotifications(user.uid);
    }
    // Limpa o listener ao desmontar o componente para evitar memory leaks
    return () => {
      clearNotifications();
    };
  }, [user, fetchNotifications, clearNotifications]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin h-8 w-8 text-[#daa520]" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-down">
      <h1 className="text-4xl font-bold text-white">Notificações</h1>
      <p className="text-lg text-gray-400 mt-2 mb-10">
        Acompanhe tudo o que acontece na sua agenda.
      </p>

      {notifications.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence>
            {notifications.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-20 bg-black/20 rounded-xl border-2 border-dashed border-gray-700">
          <Inbox className="h-16 w-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-white">Caixa de entrada vazia</h3>
          <p className="text-gray-400 mt-2">
            Novas notificações sobre seus agendamentos aparecerão aqui.
          </p>
        </div>
      )}
    </div>
  );
};