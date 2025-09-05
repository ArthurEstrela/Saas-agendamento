import React, { useEffect } from 'react';
import { Bell, Clock, Trash2, Loader2, Inbox, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationsStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NotificationCard = ({ notification, onMarkAsRead, onDelete }) => (
  <div
    className={`p-4 rounded-lg flex items-start gap-4 border-l-4 transition-all duration-300 transform hover:scale-[1.02] ${
      notification.isRead
        ? 'bg-gray-800/50 border-gray-700'
        : 'bg-blue-900/40 border-blue-500'
    }`}
  >
    <div className="flex-shrink-0 pt-1">
      <Bell
        className={`h-6 w-6 ${
          notification.isRead ? 'text-gray-500' : 'text-blue-400'
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
            ? formatDistanceToNow(notification.createdAt.toDate(), {
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
          className="p-1 text-blue-400 hover:text-blue-200 transition-colors"
          title="Marcar como lida"
        >
          <CheckCircle className="h-4 w-4" />
        </button>
      )}
      <button
        onClick={() => onDelete(notification.id)}
        className="p-1 text-gray-500 hover:text-red-500 transition-colors"
        title="Excluir"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const Notifications = () => {
  const { user } = useAuthStore();
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    if (user?.uid) {
      fetchNotifications(user.uid);
    }
  }, [user, fetchNotifications]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin h-8 w-8 text-[#daa520]" />
        <p className="ml-3 text-gray-400">Carregando notificações...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-3xl font-bold text-white mb-6">Notificações</h2>
      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-800/40 rounded-xl border-2 border-dashed border-gray-700">
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

export default Notifications;