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
  markAllAsRead: () => Promise<void>; // <--- ADICIONADO AQUI NA INTERFACE
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
        get().fetchNotifications(notification.userId);
      }
    }
  },

  // --- NOVA FUNÇÃO IMPLEMENTADA ---
  markAllAsRead: async () => {
    const { notifications } = get();
    const unreadNotifications = notifications.filter(n => !n.isRead);

    if (unreadNotifications.length === 0) return;

    // 1. Atualização Otimista (zera o contador e marca visuais como lidos)
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0
    }));

    // 2. Chama o serviço para cada notificação não lida
    // (Idealmente, crie um batch update no Firebase, mas isso resolve por agora)
    try {
      await Promise.all(
        unreadNotifications.map(n => markNotificationAsRead(n.id))
      );
    } catch (err) {
      console.error("Erro ao marcar todas como lidas:", err);
      // O listener do onNotifications deve corrigir o estado se falhar
    }
  },

  deleteNotification: async (notificationId: string) => {
    const originalNotifications = get().notifications;
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
      set({ notifications: originalNotifications });
    }
  },
  
  clearNotifications: () => {
    get().unsubscribe?.();
    set({ notifications: [], unreadCount: 0, isLoading: false, error: null, unsubscribe: null });
  },
}));