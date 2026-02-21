import { create } from 'zustand';
import { isAxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import type { ClientProfile } from '../types';
import { api } from '../lib/api';
import { useAuthStore } from './authStore'; // Importamos o authStore para sincronizar os dados globais

const extractErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (isAxiosError(error)) {
    return error.response?.data?.message || defaultMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

interface ProfileState {
  loading: boolean;
  error: string | null;
  updateProfile: (id: string, data: Partial<ClientProfile>) => Promise<void>;
  uploadAvatar: (id: string, file: File) => Promise<void>;
  clearError: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  loading: false,
  error: null,

  // ==========================================================================
  // 1. ATUALIZAR DADOS DE TEXTO DO CLIENTE
  // ==========================================================================
  updateProfile: async (id: string, data: Partial<ClientProfile>) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put<ClientProfile>(`/clients/${id}`, data);
      
      // Sincroniza o novo utilizador no AuthStore para o cabeçalho do site atualizar na hora!
      useAuthStore.setState({ user: response.data });
      
      toast.success('Perfil atualizado com sucesso!');
      set({ loading: false });
    } catch (error) {
      const errMsg = extractErrorMessage(error, 'Erro ao atualizar o perfil.');
      set({ error: errMsg, loading: false });
      toast.error(errMsg);
      throw error;
    }
  },

  // ==========================================================================
  // 2. UPLOAD DA FOTO DE PERFIL
  // ==========================================================================
  uploadAvatar: async (id: string, file: File) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Endpoint para envio de multipart/form-data
      const response = await api.put(`/profile-images/client/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Atualiza a URL da foto no AuthStore
      const currentUser = useAuthStore.getState().user as ClientProfile;
      if (currentUser) {
        useAuthStore.setState({ 
          user: { ...currentUser, profilePictureUrl: response.data.url } 
        });
      }

      toast.success('Foto de perfil atualizada!');
      set({ loading: false });
    } catch (error) {
      const errMsg = extractErrorMessage(error, 'Erro ao enviar a foto.');
      set({ error: errMsg, loading: false });
      toast.error(errMsg);
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));