import { create } from 'zustand';
import { isAxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import type { ServiceProviderProfile } from '../types';
import { api } from '../lib/api';
import { useAuthStore } from './authStore'; 

const extractErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (isAxiosError(error)) {
    return error.response?.data?.message || defaultMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

interface ProviderProfileState {
  loading: boolean;
  error: string | null;
  updateProfile: (id: string, data: Partial<ServiceProviderProfile>) => Promise<void>;
  uploadLogo: (id: string, file: File) => Promise<void>;
  uploadBanner: (id: string, file: File) => Promise<void>;
  clearError: () => void;
}

export const useProviderProfileStore = create<ProviderProfileState>((set) => ({
  loading: false,
  error: null,

  // ==========================================================================
  // 1. ATUALIZAR DADOS DA BARBEARIA/SALÃO (INCLUI MORADA E DEFINIÇÕES)
  // ==========================================================================
  updateProfile: async (id: string, data: Partial<ServiceProviderProfile>) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put<ServiceProviderProfile>(`/service-providers/${id}`, data);
      
      // Sincroniza o state global para que o menu lateral atualize o nome do negócio
      useAuthStore.setState({ user: response.data });
      
      toast.success('Configurações atualizadas com sucesso!');
      set({ loading: false });
    } catch (error) {
      const errMsg = extractErrorMessage(error, 'Erro ao atualizar os dados do estabelecimento.');
      set({ error: errMsg, loading: false });
      toast.error(errMsg);
      throw error;
    }
  },

  // ==========================================================================
  // 2. UPLOAD DO LOGÓTIPO
  // ==========================================================================
  uploadLogo: async (id: string, file: File) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.put(`/profile-images/provider/${id}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const currentUser = useAuthStore.getState().user as ServiceProviderProfile;
      if (currentUser) {
        useAuthStore.setState({ 
          user: { ...currentUser, logoUrl: response.data.url } 
        });
      }

      toast.success('Logótipo atualizado!');
      set({ loading: false });
    } catch (error) {
      const errMsg = extractErrorMessage(error, 'Erro ao enviar o logótipo.');
      set({ error: errMsg, loading: false });
      toast.error(errMsg);
      throw error;
    }
  },

  // ==========================================================================
  // 3. UPLOAD DO BANNER PRINCIPAL
  // ==========================================================================
  uploadBanner: async (id: string, file: File) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.put(`/profile-images/provider/${id}/banner`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const currentUser = useAuthStore.getState().user as ServiceProviderProfile;
      if (currentUser) {
        useAuthStore.setState({ 
          user: { ...currentUser, bannerUrl: response.data.url } 
        });
      }

      toast.success('Banner atualizado com sucesso!');
      set({ loading: false });
    } catch (error) {
      const errMsg = extractErrorMessage(error, 'Erro ao enviar o banner.');
      set({ error: errMsg, loading: false });
      toast.error(errMsg);
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));