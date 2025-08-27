// src/store/notificationsStore.ts
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
  unreadCount: number;
  fetchNotifications: (userId: string) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: true,
  unsubscribe: null,
  unreadCount: 0,

  fetchNotifications: (userId) => {
    get().unsubscribe?.(); 

    // CORREÇÃO: Aponte para a subcoleção dentro do documento do usuário
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      const unread = notificationsData.filter(n => !n.isRead).length;
      set({ notifications: notificationsData, loading: false, unreadCount: unread });
    }, (error) => {
      console.error("Erro ao buscar notificações:", error);
      set({ loading: false });
    });

    set({ unsubscribe });
  },

  markAsRead: async (notificationId) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      console.error("Usuário não autenticado.");
      return;
    }
    // CORREÇÃO: Use o caminho completo para a subcoleção
    const notifRef = doc(db, 'users', user.uid, 'notifications', notificationId);
    try {
      await updateDoc(notifRef, { isRead: true });
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  },

  deleteNotification: async (notificationId) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      console.error("Usuário não autenticado.");
      return;
    }
    // CORREÇÃO: Use o caminho completo para a subcoleção
    const notifRef = doc(db, 'users', user.uid, 'notifications', notificationId);
    try {
      await deleteDoc(notifRef);
    } catch (error) {
      console.error("Erro ao apagar notificação:", error);
    }
  },
}));