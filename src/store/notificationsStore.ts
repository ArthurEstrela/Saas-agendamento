import { create } from 'zustand';
import type { Notification } from '../types';
import { getNotificationsByUserId, markNotificationAsRead } from '../firebase/notificationService';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (userId: string) => {
    if (!userId) return;
    set({ isLoading: true, error: null });
    try {
      const notifications = await getNotificationsByUserId(userId);
      const unreadCount = notifications.filter(n => !n.isRead).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch (err: unknown) {
      let errorMessage = "Erro ao buscar notificações.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },

  markAsRead: async (notificationId: string) => {
    const notification = get().notifications.find(n => n.id === notificationId);
    // Só faz a chamada se a notificação existir e não estiver lida (evita chamadas duplicadas)
    if (notification && !notification.isRead) {
      try {
        await markNotificationAsRead(notificationId);

        set(state => {
          const updatedNotifications = state.notifications.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          );
          const newUnreadCount = state.unreadCount - 1;
          return {
            notifications: updatedNotifications,
            unreadCount: newUnreadCount > 0 ? newUnreadCount : 0,
          };
        });

      } catch (err: unknown) {
        console.error("Erro ao marcar notificação como lida:", err);
      }
    }
  },
}));