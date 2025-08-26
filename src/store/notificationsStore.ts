import { create } from 'zustand';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: any;
}

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  unsubscribe: () => void | null;
  fetchNotifications: (userId: string) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: true,
  unsubscribe: null,

  fetchNotifications: (userId) => {
    get().unsubscribe?.(); // Cancela a subscrição anterior

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      set({ notifications: notificationsData, loading: false });
    }, (error) => {
      console.error("Erro ao buscar notificações:", error);
      set({ loading: false });
    });

    set({ unsubscribe });
  },

  markAsRead: async (notificationId) => {
    const notifRef = doc(db, 'notifications', notificationId);
    try {
      await updateDoc(notifRef, { isRead: true });
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  },

  deleteNotification: async (notificationId) => {
    const notifRef = doc(db, 'notifications', notificationId);
    try {
      await deleteDoc(notifRef);
    } catch (error) {
      console.error("Erro ao apagar notificação:", error);
    }
  },
}));
