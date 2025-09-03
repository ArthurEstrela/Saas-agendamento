import { create } from 'zustand';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: any; // Mantido como 'any' para flexibilidade com Timestamps do Firebase
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  unsubscribe: () => void;
  fetchNotifications: (userId: string) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: true,
  unsubscribe: () => {}, // Inicializa com uma função vazia

  fetchNotifications: (userId) => {
    // Cancela a inscrição anterior para evitar múltiplos listeners
    get().unsubscribe();

    set({ loading: true });
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];

        const unreadCount = notificationsData.filter(n => !n.isRead).length;

        set({ notifications: notificationsData, unreadCount: unreadCount, loading: false });
      },
      (error) => {
        console.error('Erro ao buscar notificações:', error);
        set({ loading: false });
      }
    );

    // Armazena a função de unsubscribe para poder chamá-la depois
    set({ unsubscribe });
  },

  markAsRead: async (notificationId) => {
    const { notifications } = get();
    const notification = notifications.find((n) => n.id === notificationId);

    if (notification && notification.userId) {
      const notificationRef = doc(
        db,
        'users',
        notification.userId,
        'notifications',
        notificationId
      );
      try {
        await updateDoc(notificationRef, { isRead: true });
        // O listener onSnapshot atualizará o estado automaticamente
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
      }
    }
  },

  deleteNotification: async (notificationId) => {
    const { notifications } = get();
    const notification = notifications.find((n) => n.id === notificationId);

    if (notification && notification.userId) {
      const notificationRef = doc(
        db,
        'users',
        notification.userId,
        'notifications',
        notificationId
      );
      try {
        await deleteDoc(notificationRef);
        // O listener onSnapshot cuidará da remoção do estado
      } catch (error) {
        console.error('Erro ao excluir notificação:', error);
      }
    }
  },
}));