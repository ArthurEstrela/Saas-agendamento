import { create } from 'zustand';
import type { Notification } from '../types';
import { onNotifications, markNotificationAsRead, deleteNotificationById } from '../firebase/notificationService';
import type { Unsubscribe } from 'firebase/firestore';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  unsubscribe: Unsubscribe | null;
  fetchNotifications: (userId: string) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  unsubscribe: null,

  fetchNotifications: (userId) => {
    if (!userId) return;
    
    // Cancela a inscrição anterior se houver
    get().unsubscribe?.();
    
    set({ isLoading: true, error: null });

    const unsubscribe = onNotifications(userId, (notifications) => {
      const unreadCount = notifications.filter(n => !n.isRead).length;
      set({ notifications, unreadCount, isLoading: false });
    });

    set({ unsubscribe });
  },

  markAsRead: async (notificationId: string) => {
    const notification = get().notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      // Atualização otimista
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
      try {
        await markNotificationAsRead(notificationId);
      } catch (err) {
        console.error("Erro ao marcar como lida:", err);
        // Reverte em caso de erro (opcional, mas bom para robustez)
        get().fetchNotifications(notification.userId);
      }
    }
  },

  deleteNotification: async (notificationId: string) => {
    const originalNotifications = get().notifications;
    // Atualização otimista
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== notificationId),
      unreadCount: state.notifications.find(n => n.id === notificationId && !n.isRead)
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount,
    }));
    try {
      await deleteNotificationById(notificationId);
    } catch (err) {
      console.error("Erro ao deletar notificação:", err);
      // Reverte em caso de erro
      set({ notifications: originalNotifications });
    }
  },
  
  clearNotifications: () => {
    get().unsubscribe?.();
    set({ notifications: [], unreadCount: 0, isLoading: false, error: null, unsubscribe: null });
  },
}));