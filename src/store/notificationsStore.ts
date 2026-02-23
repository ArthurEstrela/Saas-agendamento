import { create } from 'zustand';
import { isAxiosError } from 'axios';
import type { Notification } from '../types';
import { api } from '../lib/api';

const extractErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (isAxiosError(error)) {
    return error.response?.data?.message || defaultMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  // ==========================================================================
  // 1. BUSCAR NOTIFICAÇÕES (API LÊ O TOKEN E SABE QUEM É O USER)
  // ==========================================================================
  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<Notification[]>('/notifications');
      const data = response.data;
      
      // Conta automaticamente quantas estão "isRead = false"
      const unread = data.filter(n => !n.isRead).length;
      
      set({ notifications: data, unreadCount: unread, loading: false });
    } catch (error) {
      set({ 
        error: extractErrorMessage(error, 'Erro ao carregar notificações.'), 
        loading: false 
      });
    }
  },

  // ==========================================================================
  // 2. MARCAR UMA ÚNICA NOTIFICAÇÃO COMO LIDA
  // ==========================================================================
  markAsRead: async (id: string) => {
    // ⭐️ OPTIMISTIC UPDATE: Atualiza a tela primeiro para não parecer lento
    const { notifications } = get();
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    set({ 
      notifications: updated, 
      unreadCount: updated.filter(n => !n.isRead).length 
    });

    try {
      // Confirma na base de dados (Java)
      await api.patch(`/notifications/${id}/read`);
    } catch (error) {
      // Em caso de falha de rede, reverte para o estado anterior buscando da DB
      await get().fetchNotifications();
      set({ error: extractErrorMessage(error, 'Erro ao marcar notificação como lida.') });
    }
  },

  // ==========================================================================
  // 3. MARCAR TODAS COMO LIDAS (O BOTÃO "LER TODAS")
  // ==========================================================================
  markAllAsRead: async () => {
    const { notifications } = get();
    
    // ⭐️ OPTIMISTIC UPDATE: Zera o contador na hora
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    set({ notifications: updated, unreadCount: 0 });

    try {
      await api.patch('/notifications/read-all');
    } catch (error) {
      await get().fetchNotifications();
      set({ error: extractErrorMessage(error, 'Erro ao limpar notificações.') });
    }
  },
  // ==========================================================================
  // 4. DELETAR NOTIFICAÇÃO
  // ==========================================================================
  deleteNotification: async (id: string) => {
    // ⭐️ OPTIMISTIC UPDATE: Remove da tela na mesma hora para parecer instantâneo
    const { notifications } = get();
    const updated = notifications.filter(n => n.id !== id);
    set({ 
      notifications: updated, 
      unreadCount: updated.filter(n => !n.isRead).length 
    });

    try {
      // Confirma a exclusão no backend (Java)
      await api.delete(`/notifications/${id}`);
    } catch (error) {
      // Se der erro na rede, busca tudo de novo e volta a notificação pra tela
      await get().fetchNotifications();
      set({ error: extractErrorMessage(error, 'Erro ao deletar notificação.') });
    }
  },

  clearError: () => set({ error: null }),
}));