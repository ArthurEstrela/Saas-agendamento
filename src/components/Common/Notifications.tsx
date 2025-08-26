import React, { useEffect } from 'react';
// --- CORREÇÃO AQUI: Usando um caminho absoluto a partir da pasta 'src' ---
import { Bell, Clock, Trash2, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationsStore';

const NotificationCard = ({ notification, onMarkAsRead, onDelete }) => (
  <div className={`p-4 rounded-lg flex items-start gap-4 border-l-4 transition-all duration-300 ${notification.isRead ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-900/30 border-blue-500'}`}>
    <div className="flex-shrink-0">
      <Bell className={`h-6 w-6 ${notification.isRead ? 'text-gray-500' : 'text-blue-400'}`} />
    </div>
    <div className="flex-grow">
      <p className={`font-semibold ${notification.isRead ? 'text-gray-400' : 'text-white'}`}>{notification.title}</p>
      <p className="text-sm text-gray-400">{notification.message}</p>
      <div className="flex items-center text-xs text-gray-500 mt-2">
        <Clock className="h-3 w-3 mr-1" />
        <span>{new Date(notification.createdAt.seconds * 1000).toLocaleString('pt-BR')}</span>
      </div>
    </div>
    <div className="flex flex-col gap-2">
      {!notification.isRead && (
        <button onClick={() => onMarkAsRead(notification.id)} className="text-xs text-blue-400 hover:underline">Marcar como lida</button>
      )}
      <button onClick={() => onDelete(notification.id)} className="text-gray-500 hover:text-red-500">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const Notifications = () => {
  const { user } = useAuthStore();
  const { notifications, loading, fetchNotifications, markAsRead, deleteNotification } = useNotificationStore();

  useEffect(() => {
    if (user) {
      fetchNotifications(user.uid);
    }
  }, [user, fetchNotifications]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="animate-spin h-8 w-8 text-[#daa520]" />
        <p className="ml-3 text-gray-400">A carregar notificações...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-3xl font-bold text-white mb-6">Notificações</h2>
      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map(n => (
            <NotificationCard 
              key={n.id} 
              notification={n}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-800/50 rounded-lg">
          <Bell className="h-12 w-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Não tem notificações novas.</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
