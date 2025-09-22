import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { db } from './config';
import type { Notification } from '../types';

// Helper para converter Timestamps
const convertNotificationTimestamp = (data: Record<string, unknown>): Record<string, unknown> => {
    if (data['createdAt'] instanceof Timestamp) {
        data['createdAt'] = (data['createdAt'] as Timestamp).toDate();
    }
    return data;
};

/**
 * Escuta as notificações de um usuário em tempo real.
 * @param userId O ID do usuário.
 * @param callback A função para ser chamada com as novas notificações.
 * @returns Uma função para cancelar a inscrição (unsubscribe).
 */
export const onNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
  const notificationsCollection = collection(db, 'notifications');
  const q = query(
    notificationsCollection,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => {
      const data = doc.data();
      const convertedData = convertNotificationTimestamp(data);
      return { id: doc.id, ...convertedData } as unknown as Notification;
    });
    callback(notifications);
  });
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, { isRead: true });
};

/**
 * Busca as notificações de um usuário específico, ordenadas pelas mais recentes.
 */
export const getNotificationsByUserId = async (userId: string): Promise<Notification[]> => {
  const notificationsCollection = collection(db, 'notifications');
  const q = query(
    notificationsCollection,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    const convertedData = convertNotificationTimestamp(data);
    return { id: doc.id, ...convertedData } as unknown as Notification;
  });
};

export const deleteNotificationById = async (notificationId: string): Promise<void> => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await deleteDoc(notificationRef);
};

/**
 * Cria uma nova notificação para um usuário.
 * (Esta função pode ser útil para ser chamada de suas Cloud Functions no futuro)
 */
export const createNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<void> => {
    const notificationsCollection = collection(db, 'notifications');
    await addDoc(notificationsCollection, {
        ...notificationData,
        isRead: false,
        createdAt: serverTimestamp(),
    });
};