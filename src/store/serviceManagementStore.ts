import { create } from 'zustand';
import { useProfileStore } from './profileStore';
import { addServiceToProvider, removeServiceFromProvider, updateServiceInProvider } from '../firebase/serviceManagementService';
import type { Service } from '../types';
import { toast } from 'react-hot-toast'; // 1. Mantenha o import

interface ServiceManagementState {
  isSubmitting: boolean;
  error: string | null;
  addService: (providerId: string, serviceData: Omit<Service, 'id'>) => Promise<void>;
  updateService: (providerId: string, serviceId: string, updates: Partial<Omit<Service, 'id'>>) => Promise<void>;
  removeService: (providerId: string, service: Service) => Promise<void>;
}

export const useServiceManagementStore = create<ServiceManagementState>((set) => ({
  isSubmitting: false,
  error: null,

  addService: async (providerId, service) => {
    set({ isSubmitting: true, error: null });

    // 2. Crie a promise que será passada para o toast
    const promise = addServiceToProvider(providerId, service);

    // 3. Use toast.promise para gerenciar os estados
    toast.promise(promise, {
      loading: 'Adicionando serviço...',
      success: 'Serviço adicionado com sucesso!',
      error: 'Falha ao adicionar o serviço.',
    });

    try {
      await promise;
      // O fetch do perfil agora só precisa acontecer após o sucesso
      await useProfileStore.getState().fetchUserProfile(providerId);
    } catch (err: unknown) {
      // O toast já exibe o erro. Aqui podemos apenas logar se necessário.
      console.error("Erro em addService:", err);
      // Opcional: você ainda pode querer guardar o erro no estado da store
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      set({ error: errorMessage });
    } finally {
      set({ isSubmitting: false });
    }
  },

  updateService: async (providerId, serviceId, updates) => {
    set({ isSubmitting: true, error: null });

    const promise = updateServiceInProvider(providerId, serviceId, updates);

    toast.promise(promise, {
      loading: 'Atualizando serviço...',
      success: 'Serviço atualizado com sucesso!',
      error: 'Falha ao atualizar o serviço.',
    });

    try {
      await promise;
      await useProfileStore.getState().fetchUserProfile(providerId);
    } catch (err: unknown) {
      console.error("Erro em updateService:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      set({ error: errorMessage });
    } finally {
      set({ isSubmitting: false });
    }
  },

  removeService: async (providerId, service) => {
    set({ isSubmitting: true, error: null });

    const promise = removeServiceFromProvider(providerId, service);

    toast.promise(promise, {
        loading: 'Removendo serviço...',
        success: 'Serviço removido com sucesso!',
        error: 'Falha ao remover o serviço.',
    });

    try {
        await promise;
        await useProfileStore.getState().fetchUserProfile(providerId);
    } catch (err: unknown) {
        console.error("Erro em removeService:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
        set({ error: errorMessage });
    } finally {
        set({ isSubmitting: false });
    }
  },
}));